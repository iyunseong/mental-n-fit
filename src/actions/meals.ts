// /actions/meals.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import type { MealForm } from '@/types/meal';

export async function saveMeal(input: MealForm): Promise<{ ok: true }> {
  const supabase = createClient();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) throw new Error('no-auth');
  const userId = userRes.user.id;

  // 입력 정규화
  const mealType = (input.meal_type ?? '아침').trim();
  const dateStr = input.date; // 'YYYY-MM-DD'
  const ateAt = toAteAt(dateStr, input.time);

  // 1) 같은 (user_id, date, meal_type)의 모든 이벤트 조회
  const { data: foundAll, error: findErr } = await supabase
    .from('meal_events')
    .select('id, ate_at')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .eq('meal_type', mealType)
    .order('ate_at', { ascending: true });

  if (findErr) {
    console.error(findErr);
    throw new Error('failed-to-find-events');
  }

  let canonicalEventId: number;
  const extraEventIds: number[] = [];

  if (foundAll && foundAll.length > 0) {
    // 대표 이벤트(첫 번째)를 선택
    canonicalEventId = Number(foundAll[0].id);
    if (foundAll.length > 1) {
      extraEventIds.push(...foundAll.slice(1).map((r) => Number(r.id)));
    }

    // 대표 이벤트 업데이트(시간/노트 등)
    const { error: updErr } = await supabase
      .from('meal_events')
      .update({
        ate_at: ateAt,
        notes: input.notes ?? null,
        meal_type: mealType,
        date: dateStr,
      })
      .eq('id', canonicalEventId)
      .eq('user_id', userId);
    if (updErr) {
      console.error(updErr);
      throw new Error('failed-to-update-event');
    }

    // 해당 키의 모든 이벤트 아이템 전부 삭제(대표+중복)
    const deleteTargets = [canonicalEventId, ...extraEventIds];
    const { error: delItemsErr } = await supabase
      .from('meal_items')
      .delete()
      .in('meal_event_id', deleteTargets);
    if (delItemsErr) {
      console.error(delItemsErr);
      throw new Error('failed-to-clear-items');
    }

    // 중복 이벤트 자체도 삭제(대표 제외)
    if (extraEventIds.length > 0) {
      const { error: delEventsErr } = await supabase
        .from('meal_events')
        .delete()
        .in('id', extraEventIds)
        .eq('user_id', userId);
      if (delEventsErr) {
        console.warn('failed-to-delete-duplicate-events (non-fatal):', delEventsErr);
      }
    }
  } else {
    // 없으면 새 이벤트 생성
    const { data: insEv, error: insErr } = await supabase
      .from('meal_events')
      .insert({
        user_id: userId,
        date: dateStr,
        ate_at: ateAt,
        meal_type: mealType,
        notes: input.notes ?? null,
      })
      .select('id')
      .single();
    if (insErr || !insEv) {
      console.error(insErr);
      throw new Error('failed-to-insert-event');
    }
    canonicalEventId = Number(insEv.id);
  }

  // 3) 아이템 삽입(Replace) — 폼이 비어 있으면 "빈 상태 유지"
  const rows = (input.items ?? [])
    .map((it) => mapItemToRow(it, canonicalEventId))
    // quantity는 INTEGER NOT NULL & CHECK(quantity >= 0)
    .map((r) => ({ ...r, quantity: Number.isFinite(r.quantity) ? r.quantity : 0 }));

  if (rows.length > 0) {
    const { error: insItemsErr } = await supabase.from('meal_items').insert(rows);
    if (insItemsErr) {
      console.error(insItemsErr);
      throw new Error('failed-to-insert-items');
    }
  }

  return { ok: true };
}

/** 날짜(HH:mm) → ate_at ISO */
function toAteAt(date: string, time?: string | null): string {
  const hhmm = (time && /^\d{2}:\d{2}$/.test(time)) ? time : '12:00';
  const dt = new Date(`${date}T${hhmm}:00`);
  return dt.toISOString();
}

/** MealForm.items -> meal_items 행 매핑 (스키마 제약 준수 + 칼로리 산출) */
function mapItemToRow(
  it: MealForm['items'][number],
  meal_event_id: number
): {
  meal_event_id: number;
  food_id: number | null;
  custom_food_name: string | null;
  quantity: number; // INTEGER NOT NULL
  carb_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  calories: number; // INTEGER (nullable지만 기본 0 존재)
} {
  const hasFoodId = typeof it.id === 'number' && Number.isFinite(it.id);
  const qInt = toNonNegInt(it.quantity_g);

  const carb = toNullableNumber(it.carb_g);
  const protein = toNullableNumber(it.protein_g);
  const fat = toNullableNumber(it.fat_g);
  // 기본 Atwater (섬유는 보통 제외)
  const kcal = calcCalories(carb, protein, fat); // 정수

  return {
    meal_event_id,
    food_id: hasFoodId ? (it.id as number) : null,
    custom_food_name: hasFoodId ? null : (it.name?.trim() || null),
    quantity: qInt,
    carb_g: carb,
    protein_g: protein,
    fat_g: fat,
    fiber_g: toNullableNumber(it.fiber_g),
    calories: kcal,
  };
}

function calcCalories(carb: number | null, protein: number | null, fat: number | null): number {
  const c = carb ?? 0;
  const p = protein ?? 0;
  const f = fat ?? 0;
  // 산출값이 없다면 0으로 저장(스키마가 default 0이지만 null을 주면 default가 적용되지 않음)
  const val = c === 0 && p === 0 && f === 0 ? 0 : Math.round(c * 4 + p * 4 + f * 9);
  return Number.isFinite(val) ? val : 0;
}

function toNullableNumber(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : (v as number | undefined);
  return Number.isFinite(n as number) ? Number(n) : null;
}

function toNonNegInt(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? Number(v) : (v as number | undefined);
  if (!Number.isFinite(n as number)) return fallback;
  const r = Math.round(Number(n));
  return r < 0 ? 0 : r;
}
