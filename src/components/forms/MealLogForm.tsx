'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toLocalDateISO } from '@/lib/date/toLocalDateISO';
import { ProgressRing } from '@/lib/ui/rings';
import { CARD, INPUT, BTN, BTN_SOLID, BTN_OUTLINE, BTN_GHOST } from '@/lib/ui/tokens';
import FormShell from './_FormShell';
import { safeMutate } from '@/lib/swrSafe';
import { swrKeys } from '@/lib/swrKeys';
import { searchFood } from '@/lib/food/searchFood';
import { supabase } from '@/lib/supabase';
import type { MealForm, MealItemInput, MealType } from '@/types/meal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';

// ===== 로컬 타입 =====
type RecentMealSummary = {
  event_id: number;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  meal_type: string | null;
  foods: string[];
};

// 소수 1자리 반올림
const round1 = (n: number) => Math.round(n * 10) / 10;

function IconTrash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="1.5" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    </svg>
  );
}

// ===== Debounce Hook =====
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ===== Supabase Row Types (선언용) =====
type MealItemsRow = {
  id: number;
  food_id: number | null;
  custom_food_name: string | null;
  quantity: number | null;
  carb_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  food_db?: { name: string | null } | Array<{ name: string | null }> | null;
};

type MealEventWithItems = {
  id: number;
  ate_at: string;
  meal_type: string | null;
  notes: string | null;
  meal_items: MealItemsRow[] | null;
};

// searchFood 결과 원소 타입
type SearchFoodRow = Awaited<ReturnType<typeof searchFood>> extends Array<infer R> ? R : never;

export default function MealLogForm({
  selectedDate = null,
  onSaved,
}: {
  selectedDate?: string | null;
  onSaved?: () => void;
}) {
  const dateISO = selectedDate ?? toLocalDateISO();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState,
    setValue,
    reset,
    getValues,
  } = useForm<MealForm>({
    defaultValues: {
      date: dateISO,
      time: new Date().toTimeString().slice(0, 5),
      items: [],
      meal_type: '아침',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const currentItems = watch('items');
  const date = watch('date');
  const mealType = watch('meal_type') as MealType;

  // 각 항목의 100g 기준 영양(검색 추가 시 채움)과 섭취량(g), 자동계산 여부
  const [per100, setPer100] = useState<Array<{ carb_g?: number; protein_g?: number; fat_g?: number }>>([]);
  const [amounts, setAmounts] = useState<number[]>([]);
  const [autoCalc, setAutoCalc] = useState<boolean[]>([]);

  // (UI 안내용) 병합된 이벤트 수
  const [mergedCount, setMergedCount] = useState<number>(0);

  const removeItem = useCallback((index: number) => {
    remove(index);
    setPer100(p => p.filter((_, i) => i !== index));
    setAmounts(a => a.filter((_, i) => i !== index));
    setAutoCalc(a => a.filter((_, i) => i !== index));
  }, [remove]);

  // ===== 검색
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchFood>>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addMode, setAddMode] = useState<'search' | 'manual'>('search');

  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const perform = async () => {
      setIsSearching(true);
      try {
        const results = await searchFood(debouncedSearchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Food search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    perform();
  }, [debouncedSearchQuery]);

  // 항목 추가: 검색 선택 시 자동계산 on
  const addFoodItem = (item: MealItemInput | SearchFoodRow) => {
    const normalized: MealItemInput = {
      id: 'id' in item && typeof item.id === 'number' ? item.id : undefined,
      name: item.name,
      carb_g: 'carb_g' in item ? (item as { carb_g?: number }).carb_g : undefined,
      protein_g: 'protein_g' in item ? (item as { protein_g?: number }).protein_g : undefined,
      fat_g: 'fat_g' in item ? (item as { fat_g?: number }).fat_g : undefined,
    };
    append({
      name: normalized.name,
      carb_g: normalized.carb_g,
      protein_g: normalized.protein_g,
      fat_g: normalized.fat_g,
      quantity_g: 100,
      id: normalized.id,
    });
    setPer100(p => [...p, { carb_g: normalized.carb_g, protein_g: normalized.protein_g, fat_g: normalized.fat_g }]);
    setAmounts(a => [...a, 100]);
    setAutoCalc(a => [...a, true]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // 섭취량 변경 → 자동계산 항목이면 매크로 재계산
  const updateAmountAndRecalc = useCallback((index: number, nextAmount: number) => {
    setAmounts(a => {
      const copy = [...a];
      copy[index] = nextAmount;
      return copy;
    });
    if (autoCalc[index]) {
      const base = per100[index] ?? {};
      const factor = (isFinite(nextAmount) ? nextAmount : 0) / 100;
      setTimeout(() => {
        setValue(`items.${index}.carb_g`,    base.carb_g    != null ? round1((base.carb_g as number)    * factor) : undefined, { shouldDirty: true });
        setValue(`items.${index}.protein_g`, base.protein_g != null ? round1((base.protein_g as number) * factor) : undefined, { shouldDirty: true });
        setValue(`items.${index}.fat_g`,     base.fat_g     != null ? round1((base.fat_g as number)     * factor) : undefined, { shouldDirty: true });
        setValue(`items.${index}.quantity_g`, nextAmount, { shouldDirty: true });
      }, 0);
    }
  }, [autoCalc, per100, setValue]);

  // 총 단백질 KPI
  const totalProtein = useMemo(
    () => (currentItems ?? []).reduce((sum, item) => sum + (item.protein_g ?? 0), 0),
    [currentItems]
  );
  const proteinPct = useMemo(() => {
    const goal = 100; // 임시 목표 100g
    return goal > 0 ? Math.min(100, Math.round((totalProtein / goal) * 100)) : 0;
  }, [totalProtein]);

  // ===== (date, mealType) 변경 시 DB에서 해당 기록 로드 → RHF 주입 =====
  useEffect(() => {
    let cancelled = false;

    async function loadExisting() {
      if (!date || !mealType) return;

      const { data, error } = await supabase
        .from('meal_events')
        .select(`
          id,
          ate_at,
          meal_type,
          notes,
          meal_items (
            id,
            food_id,
            custom_food_name,
            quantity,
            carb_g,
            protein_g,
            fat_g,
            fiber_g,
            food_db:food_id ( name )
          )
        `)
        .eq('date', date)
        .eq('meal_type', mealType)
        .order('ate_at', { ascending: true });

      if (cancelled) return;

      if (error || !data || data.length === 0) {
        reset({ ...getValues(), items: [], notes: undefined }, { keepDirty: false });
        setPer100([]);
        setAmounts([]);
        setAutoCalc([]);
        setMergedCount(0);
        return;
      }

      // 같은 (날짜, meal_type) 안에 여러 이벤트가 있다면 병합해서 표시
      const mergedItems = data.flatMap((ev) =>
        (ev.meal_items ?? []).map((mi) => {
          const fd = mi.food_db as { name?: string | null } | Array<{ name?: string | null }> | null;
          const foodName = Array.isArray(fd) ? (fd[0]?.name ?? '') : (fd?.name ?? '');
          return {
            id: mi.food_id ?? undefined,
            name: mi.custom_food_name ?? foodName ?? '',
            quantity_g: Number(mi.quantity ?? 0),
            carb_g: mi.carb_g == null ? undefined : Number(mi.carb_g),
            protein_g: mi.protein_g == null ? undefined : Number(mi.protein_g),
            fat_g: mi.fat_g == null ? undefined : Number(mi.fat_g),
            fiber_g: mi.fiber_g == null ? undefined : Number(mi.fiber_g),
          };
        })
      );

      // 시간은 가장 마지막 이벤트의 ate_at 사용
      const last = data[data.length - 1];
      const hhmm = (() => {
        try { return new Date(last.ate_at).toTimeString().slice(0, 5); }
        catch { return getValues().time ?? '00:00'; }
      })();

      reset(
        {
          ...getValues(),
          time: hhmm,
          items: mergedItems,
          notes: (data[data.length - 1]?.notes ?? undefined) as string | undefined,
        },
        { keepDirty: false }
      );

      // DB에서 로딩된 항목은 모두 수동 모드
      setPer100(mergedItems.map(() => ({})));
      setAmounts(mergedItems.map((it) => Number(it.quantity_g ?? 0)));
      setAutoCalc(mergedItems.map(() => false));
      setMergedCount(data.length);
    }

    loadExisting();
    return () => { cancelled = true; };
  }, [date, mealType, reset, getValues]);

  // ===== 클라이언트용: 최근 식사 불러오기 =====
  async function listRecentMealsClient(limit = 20): Promise<RecentMealSummary[]> {
    const { data: events, error } = await supabase
      .from('meal_events')
      .select('id, date, ate_at, meal_type')
      .order('ate_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!events?.length) return [];

    const ids = events.map(e => e.id);
    const { data: items, error: itemErr } = await supabase
      .from('meal_items')
      .select('meal_event_id, custom_food_name')
      .in('meal_event_id', ids);

    if (itemErr) throw itemErr;

    const foodsByEvent = new Map<number, string[]>();
    (items ?? []).forEach((it: any) => {
      const arr = foodsByEvent.get(it.meal_event_id) ?? [];
      if (it.custom_food_name) arr.push(it.custom_food_name);
      foodsByEvent.set(it.meal_event_id, arr);
    });

    return events.map(ev => {
      let time = '00:00';
      try { time = new Date(ev.ate_at as string).toTimeString().slice(0,5); } catch {}
      return {
        event_id: ev.id,
        date: ev.date as string,
        time,
        meal_type: (ev.meal_type as string) ?? null,
        foods: foodsByEvent.get(ev.id) ?? [],
      };
    });
  }

  async function loadMealEventItemsClient(eventId: number): Promise<{ items: MealItemInput[]; notes?: string }> {
    const { data: ev, error } = await supabase
      .from('meal_events')
      .select(`
        id,
        notes,
        meal_items (
          custom_food_name,
          quantity,
          carb_g,
          protein_g,
          fat_g,
          fiber_g
        )
      `)
      .eq('id', eventId)
      .maybeSingle();

    if (error) throw error;
    if (!ev) return { items: [] };

    const items: MealItemInput[] = (ev.meal_items ?? []).map((mi: any) => ({
      name: mi.custom_food_name ?? '',
      quantity_g: mi.quantity == null ? undefined : Number(mi.quantity),
      carb_g:     mi.carb_g    == null ? undefined : Number(mi.carb_g),
      protein_g:  mi.protein_g == null ? undefined : Number(mi.protein_g),
      fat_g:      mi.fat_g     == null ? undefined : Number(mi.fat_g),
      fiber_g:    mi.fiber_g   == null ? undefined : Number(mi.fiber_g),
    }));

    return { items, notes: ev.notes ?? undefined };
  }

  // ===== 저장 (클라이언트 Supabase로 직접 처리) =====
  const onSubmit = async (data: MealForm) => {
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes?.user;
      if (!user) throw new Error('no-auth');

      // 자동계산 항목 보정
      const computedItems = (data.items ?? []).map((it, i) => {
        if (autoCalc[i]) {
          const base = per100[i] ?? {};
          const amt = amounts[i] ?? 0;
          const factor = amt / 100;
          return {
            ...it,
            quantity_g: amt,
            carb_g:    base.carb_g    != null ? round1((base.carb_g as number)    * factor) : it.carb_g,
            protein_g: base.protein_g != null ? round1((base.protein_g as number) * factor) : it.protein_g,
            fat_g:     base.fat_g     != null ? round1((base.fat_g as number)     * factor) : it.fat_g,
          };
        }
        return it;
      });

      const ateAt = new Date(`${data.date}T${data.time ?? '12:00'}`).toISOString();

      // 1) 기존 (user, date, meal_type) 이벤트 조회 & 삭제(병합 정책)
      const { data: old, error: oldErr } = await supabase
        .from('meal_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', data.date)
        .eq('meal_type', data.meal_type);

      if (oldErr) throw oldErr;

      if (old && old.length) {
        const ids = old.map(r => r.id);
        const { error: delItemsErr } = await supabase.from('meal_items').delete().in('meal_event_id', ids);
        if (delItemsErr) throw delItemsErr;
        const { error: delEventsErr } = await supabase.from('meal_events').delete().in('id', ids);
        if (delEventsErr) throw delEventsErr;
      }

      // 2) 새 이벤트 생성
      const { data: inserted, error: insErr } = await supabase
        .from('meal_events')
        .insert({
          user_id: user.id,
          date: data.date,
          ate_at: ateAt,
          meal_type: data.meal_type,
          notes: data.notes ?? null,
          total_calories: null, // 필요 시 합산해서 넣어도 됨
        })
        .select('id')
        .single();

      if (insErr) throw insErr;
      const eventId = inserted!.id as number;

      // 3) 항목 벌크 삽입
      const items = (computedItems ?? []).map(it => ({
        meal_event_id: eventId,
        food_id: it.id ?? null,
        custom_food_name: it.id ? null : (it.name || null),
        quantity: it.quantity_g ?? null,
        carb_g: it.carb_g ?? null,
        protein_g: it.protein_g ?? null,
        fat_g: it.fat_g ?? null,
        fiber_g: it.fiber_g ?? null,
      }));

      if (items.length) {
        const { error: itemErr } = await supabase.from('meal_items').insert(items);
        if (itemErr) throw itemErr;
      }

      // 4) SWR 키 갱신
      await Promise.all([
        safeMutate(swrKeys.summary(data.date)),
        safeMutate(swrKeys.kpiToday),
        safeMutate(swrKeys.missions(data.date)),
        safeMutate(swrKeys.recent('meal')),
      ]);

      onSaved?.();
    } catch (error) {
      console.error('Failed to save meal:', error);
      alert('식사 기록 저장에 실패했습니다.');
    }
  };

  /* ---------- 최근 식사 불러오기 ---------- */
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevLoading, setPrevLoading] = useState(false);
  const [recentMeals, setRecentMeals] = useState<RecentMealSummary[]>([]);

  const openPreviousPicker = async () => {
    setPrevOpen(true);
    setPrevLoading(true);
    try {
      const rows = await listRecentMealsClient(20);
      setRecentMeals(rows);
    } catch {
      setRecentMeals([]);
    } finally {
      setPrevLoading(false);
    }
  };

  const pickPreviousEvent = async (eventId: number) => {
    const currentDate = watch('date');
    const currentMealType = watch('meal_type');
    const loaded = await loadMealEventItemsClient(eventId);
    const mergedItems = loaded.items ?? [];
    reset(
      {
        ...getValues(),
        date: currentDate,
        time: getValues().time,
        meal_type: currentMealType,
        items: mergedItems,
        notes: loaded.notes ?? undefined,
      },
      { keepDirty: true }
    );
    setPer100(mergedItems.map(() => ({})));
    setAmounts(mergedItems.map((it) => Number(it.quantity_g ?? 0)));
    setAutoCalc(mergedItems.map(() => false));
    setPrevOpen(false);
  };

  return (
    <FormShell<MealForm>
      title="식사"
      progress={<ProgressRing value={proteinPct} label="단백질" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 기본 정보 + 식사 종류 탭 */}
        <div className={`${CARD} p-4 space-y-3`}>
          <div className="text-sm font-semibold">기본 정보</div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <div className="text-[11px] text-gray-500 mb-1">날짜 *</div>
              <input type="date" className={INPUT} {...register('date')} />
            </label>
            <label className="block">
              <div className="text-[11px] text-gray-500 mb-1">시간</div>
              <input type="time" className={INPUT} {...register('time')} />
            </label>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 mb-1">식사 종류 *</div>
            <div className="flex gap-2">
              {(['아침', '점심', '저녁', '간식'] as MealType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('meal_type', type, { shouldDirty: true })}
                  className={`${BTN} ${mealType === type ? BTN_SOLID : BTN_OUTLINE} px-4 py-2`}
                >
                  {type}
                </button>
              ))}
              <button type="button" className={`${BTN_OUTLINE} ml-auto px-4 py-2`} onClick={openPreviousPicker}>
                최근 식사 불러오기
              </button>
            </div>
            {mergedCount > 1 && (
              <div className="mt-2 text-[11px] text-sky-700 bg-sky-50 border border-sky-100 rounded-md px-2 py-1 inline-block">
                같은 날짜의 {mergedCount}개 식사 기록을 병합해 표시합니다.
              </div>
            )}
          </div>
        </div>

        {/* 음식 추가 */}
        <div className={`${CARD} p-4 space-y-3`}>
          <div className="text-sm font-semibold">음식 추가</div>
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setAddMode('search')}
              className={`px-4 py-2 text-sm ${addMode === 'search' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-gray-500'}`}
            >
              DB 검색
            </button>
            <button
              type="button"
              onClick={() => setAddMode('manual')}
              className={`px-4 py-2 text-sm ${addMode === 'manual' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-gray-500'}`}
            >
              직접 입력
            </button>
          </div>

          {addMode === 'search' && (
            <div className="space-y-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="음식 이름 검색..."
                className={INPUT}
              />
              {isSearching && <div className="text-xs text-gray-500">검색 중...</div>}
              {searchResults.length > 0 && (
                <ul className="border rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.map((food) => (
                    <li key={food.id}>
                      <button
                        type="button"
                        onClick={() => addFoodItem(food)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <div className="font-medium">{food.name}</div>
                        <div className="text-[11px] text-gray-500">
                          100g 기준: 탄 {food.carb_g ?? '-'}g · 단 {food.protein_g ?? '-'}g · 지 {food.fat_g ?? '-'}g
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {addMode === 'manual' && (
            <ManualAddForm
              onAdd={(item) => {
                append(item);
                setPer100((p) => [...p, {}]);
                setAmounts((a) => [...a, NaN]);
                setAutoCalc((a) => [...a, false]);
              }}
            />
          )}
        </div>

        {/* 기록된 항목 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold px-1">기록된 항목</h3>
          {fields.map((field, index) => {
            const auto = autoCalc[index];
            const base = per100[index] ?? {};
            const amt = amounts[index] ?? (auto ? 100 : NaN);
            return (
              <div key={field.id} className={`${CARD} p-3 space-y-2`}>
                {/* 상단: 이름 + 삭제 */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 block">
                    <div className="text-[11px] text-gray-500 mb-1">음식명</div>
                    <input {...register(`items.${index}.name`)} placeholder="음식명" className={INPUT} />
                  </label>
                  <button type="button" onClick={() => removeItem(index)} className={BTN_GHOST}>
                    <IconTrash className="w-5 h-5" />
                  </button>
                </div>

                {/* 100g 기준 정보(검색 추가일 때만 표시) */}
                {auto && (
                  <div className="text-[11px] text-gray-500">
                    100g 기준: 탄 {base.carb_g ?? '-'}g · 단 {base.protein_g ?? '-'}g · 지 {base.fat_g ?? '-'}g
                  </div>
                )}

                {/* 섭취량(g) */}
                {auto && (
                  <div className="flex items-end gap-2">
                    <label className="flex-1 block">
                      <div className="text-[11px] text-gray-500 mb-1">섭취량(g)</div>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        inputMode="decimal"
                        value={Number.isFinite(amt) ? amt : ''}
                        onChange={(e) => updateAmountAndRecalc(index, Number(e.target.value))}
                        placeholder="예: 150.5"
                        className={INPUT}
                      />
                    </label>
                    <div className="flex gap-1">
                      {[50, 100, 150].map((v) => (
                        <button key={v} type="button" className={BTN_OUTLINE} onClick={() => updateAmountAndRecalc(index, v)}>
                          {v}g
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 탄·단·지·섬유 */}
                <div className="grid grid-cols-4 gap-2">
                  <label className="block">
                    <div className="text-[11px] text-gray-500 mb-1">탄수화물(g)</div>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      inputMode="decimal"
                      {...register(`items.${index}.carb_g`, { valueAsNumber: true })}
                      className={`${INPUT} ${auto ? 'bg-gray-50' : ''}`}
                      readOnly={auto}
                    />
                  </label>
                  <label className="block">
                    <div className="text-[11px] text-gray-500 mb-1">단백질(g)</div>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      inputMode="decimal"
                      {...register(`items.${index}.protein_g`, { valueAsNumber: true })}
                      className={`${INPUT} ${auto ? 'bg-gray-50' : ''}`}
                      readOnly={auto}
                    />
                  </label>
                  <label className="block">
                    <div className="text-[11px] text-gray-500 mb-1">지방(g)</div>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      inputMode="decimal"
                      {...register(`items.${index}.fat_g`, { valueAsNumber: true })}
                      className={`${INPUT} ${auto ? 'bg-gray-50' : ''}`}
                      readOnly={auto}
                    />
                  </label>
                  <label className="block">
                    <div className="text-[11px] text-gray-500 mb-1">식이섬유(g)</div>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      inputMode="decimal"
                      {...register(`items.${index}.fiber_g`, { valueAsNumber: true })}
                      className={INPUT}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4">
          <button type="submit" disabled={formState.isSubmitting} className={`${BTN_SOLID} w-full py-3`}>
            {formState.isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>

      {/* 최근 식사 불러오기 모달 */}
      <Dialog open={prevOpen} onOpenChange={setPrevOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>최근 식사 불러오기</DialogTitle>
          </DialogHeader>

          {prevLoading && <div className="text-sm text-gray-500">불러오는 중…</div>}

          {!prevLoading && recentMeals.length === 0 && (
            <div className="text-sm text-gray-500">이전 기록이 없습니다.</div>
          )}

          {!prevLoading && recentMeals.length > 0 && (
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {recentMeals.map(row => (
                <button
                  key={row.event_id}
                  type="button"
                  onClick={() => pickPreviousEvent(row.event_id)}
                  className="w-full text-left rounded-lg border px-3 py-2 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {row.date} <span className="text-gray-500">· {row.time}</span>
                    </div>
                    {row.meal_type && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">{row.meal_type}</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {row.foods.length > 0 ? (
                      row.foods.map((name, i) => (
                        <span
                          key={`${row.event_id}-${name}-${i}`}
                          className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-gray-500">항목 없음</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="pt-3 flex justify-end">
            <Button variant="ghost" onClick={() => setPrevOpen(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </FormShell>
  );
}

function ManualAddForm({ onAdd }: { onAdd: (item: MealItemInput) => void }) {
  const [name, setName] = useState('');
  const [carb, setCarb] = useState<number | undefined>();
  const [protein, setProtein] = useState<number | undefined>();
  const [fat, setFat] = useState<number | undefined>();

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      carb_g: carb,
      protein_g: protein,
      fat_g: fat,
    });
    setName('');
    setCarb(undefined);
    setProtein(undefined);
    setFat(undefined);
  };

  return (
    <div className="space-y-2 p-3 border rounded-lg">
      <label className="block">
        <div className="text-[11px] text-gray-500 mb-1">음식 이름</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 닭가슴살" className={INPUT} />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <div className="text-[11px] text-gray-500 mb-1">탄수화물(g)</div>
          <input
            type="number"
            min={0}
            step={0.1}
            inputMode="decimal"
            value={carb ?? ''}
            onChange={(e) => setCarb(e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="0.0"
            className={INPUT}
          />
        </label>
        <label className="block">
          <div className="text-[11px] text-gray-500 mb-1">단백질(g)</div>
          <input
            type="number"
            min={0}
            step={0.1}
            inputMode="decimal"
            value={protein ?? ''}
            onChange={(e) => setProtein(e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="0.0"
            className={INPUT}
          />
        </label>
        <label className="block">
          <div className="text-[11px] text-gray-500 mb-1">지방(g)</div>
          <input
            type="number"
            min={0}
            step={0.1}
            inputMode="decimal"
            value={fat ?? ''}
            onChange={(e) => setFat(e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="0.0"
            className={INPUT}
          />
        </label>
      </div>
      <button onClick={handleAdd} className={`${BTN_OUTLINE} w-full`}>직접 추가</button>
    </div>
  );
}
