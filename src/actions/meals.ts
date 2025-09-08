'use server';

import { createClient } from '@/lib/supabase/server';
import type { MealForm, MealType } from '@/types/meal';

/** ================= 저장 (대표 이벤트 교체 + 중복 이벤트 정리) ================ */
export async function saveMeal(input: MealForm): Promise<{ ok: true }> {
  const supabase = createClient();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) throw new Error('no-auth');
  const userId = userRes.user.id;

  const mealType = (input.meal_type ?? '아침').trim() as MealType;
  const dateStr = input.date; // 'YYYY-MM-DD'
  const ateAt = toAteAt(dateStr, input.time);

  // 같은 키의 모든 이벤트 조회
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
    // 대표 이벤트(첫 번째)
    canonicalEventId = Number(foundAll[0].id);
    if (foundAll.length > 1) {
      extraEventIds.push(...foundAll.slice(1).map((r) => Number(r.id)));
    }

    // 대표 이벤트 업데이트
    const { error: updErr } = await supabase
      .from('meal_events')
      .update({
        ate_at,
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

    // 대표 + 중복 이벤트의 아이템 전부 삭제
    const deleteTargets = [canonicalEventId, ...extraEventIds];
    const { error: delItemsErr } = await supabase
      .from('meal_items')
      .delete()
      .in('meal_event_id', deleteTargets);
    if (delItemsErr) {
      console.error(delItemsErr);
      throw new Error('failed-to-clear-items');
    }

    // 중복 이벤트 자체 삭제(대표 제외)
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
    // 새 이벤트
    const { data: insEv, error: insErr } = await supabase
      .from('meal_events')
      .insert({
        user_id: userId,
        date: dateStr,
        ate_at,
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

  // 아이템 삽입(Replace)
  const rows = (input.items ?? [])
    .map((it) => mapItemToRow(it, canonicalEventId))
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

/** ================= 최근 식사 20개 목록(타입 무시) ================= */
export type RecentMealSummary = {
  event_id: number;
  date: string;
  time: string;               // HH:mm
  meal_type: MealType | null; // 스키마가 null 허용일 수 있어 안전하게
  foods: string[];            // 대표 음식 상위 3개
};

type EventRow = { id: number; date: string; ate_at: string | null; meal_type: string | null };
type ItemNameRow = {
  meal_event_id: number | null;
  custom_food_name: string | null;
  food_db: { name: string | null } | null;
};

/**
 * 선택한 날짜 '이전'의 최근 식사 이벤트 20개를 반환합니다 (meal_type 무시).
 * - 같은 날짜 내에서 "현재 기록을 덮어쓰기" 위험을 줄이기 위해 `< date`만 포함.
 */
export async function listRecentMeals(beforeDate: string, limit = 20): Promise<RecentMealSummary[]> {
  const supabase = createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) throw new Error('no-auth');

  // 1) 최근 이벤트 id 목록
  const { data: ev, error: evErr } = await supabase
    .from('meal_events')
    .select('id, date, ate_at, meal_type')
    .eq('user_id', userRes.user.id)
    .lt('date', beforeDate)
    .order('ate_at', { ascending: false })
    .limit(limit);

  if (evErr) throw evErr;
  const events = (ev ?? []) as EventRow[];
  if (events.length === 0) return [];

  const ids = events.map((e) => e.id);

  // 2) 각 이벤트에서 음식 이름 수집
  const { data: items, error: itErr } = await supabase
    .from('meal_items')
    .select('meal_event_id, custom_food_name, food_db(name)')
    .in('meal_event_id', ids);

  if (itErr) throw itErr;
  const rows = (items ?? []) as ItemNameRow[];

  // 이벤트별 음식명 카운팅
  const foodsByEvent: Record<number, Record<string, number>> = {};
  for (const r of rows) {
    const eid = r.meal_event_id ?? -1;
    if (eid < 0) continue;
    const name = r.custom_food_name ?? r.food_db?.name ?? '';
    if (!name) continue;
    if (!foodsByEvent[eid]) foodsByEvent[eid] = {};
    foodsByEvent[eid][name] = (foodsByEvent[eid][name] ?? 0) + 1;
  }

  // 상위 3개 선정
  const result: RecentMealSummary[] = events.map((e) => {
    const counter = foodsByEvent[e.id] ?? {};
    const top3 = Object.entries(counter)
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([name]) => name);

    return {
      event_id: e.id,
      date: e.date,
      time: toHHMM(e.ate_at),
      meal_type: (e.meal_type ?? null) as MealType | null,
      foods: top3,
    };
  });

  return result;
}

/** ================= 단일 이벤트 아이템 로드(붙여넣기용) ================= */
type ItemRow = {
  food_id: number | null;
  custom_food_name: string | null;
  quantity: number | null;
  carb_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  food_db: { name: string | null } | null;
};

export async function loadMealEventItems(eventId: number): Promise<{
  time: string | null;
  notes?: string | null;
  items: MealForm['items'];
}> {
  const supabase = createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) throw new Error('no-auth');

  // 이벤트 메타
  const { data: ev, error: evErr } = await supabase
    .from('meal_events')
    .select('ate_at, notes, user_id')
    .eq('id', eventId)
    .single();

  if (evErr || !ev) throw evErr ?? new Error('not-found');
  if (ev.user_id !== userRes.user.id) throw new Error('forbidden');

  // 아이템 목록
  const { data: items, error: itErr } = await supabase
    .from('meal_items')
    .select('food_id, custom_food_name, quantity, carb_g, protein_g, fat_g, fiber_g, food_db(name)')
    .eq('meal_event_id', eventId);

  if (itErr) throw itErr;

  const mapped: MealForm['items'] = (items ?? []).map((mi) => ({
    id: mi.food_id ?? undefined,
    name: mi.custom_food_name ?? mi.food_db?.name ?? '',
    quantity_g: Number(mi.quantity ?? 0),
    carb_g: mi.carb_g == null ? undefined : Number(mi.carb_g),
    protein_g: mi.protein_g == null ? undefined : Number(mi.protein_g),
    fat_g: mi.fat_g == null ? undefined : Number(mi.fat_g),
    fiber_g: mi.fiber_g == null ? undefined : Number(mi.fiber_g),
  }));

  return {
    time: toHHMM(ev.ate_at),
    notes: ev.notes ?? null,
    items: mapped,
  };
}

/** ================= utils ================= */
function toAteAt(date: string, time?: string | null): string {
  const hhmm = (time && /^\d{2}:\d{2}$/.test(time)) ? time : '12:00';
  const dt = new Date(`${date}T${hhmm}:00`);
  return dt.toISOString();
}
function toHHMM(iso: string | null): string {
  if (!iso) return '12:00';
  try {
    return new Date(iso).toTimeString().slice(0, 5);
  } catch {
    return '12:00';
  }
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
  calories: number;
} {
  const hasFoodId = typeof it.id === 'number' && Number.isFinite(it.id);
  const qInt = toNonNegInt(it.quantity_g);

  const carb = toNullableNumber(it.carb_g);
  const protein = toNullableNumber(it.protein_g);
  const fat = toNullableNumber(it.fat_g);
  const kcal = calcCalories(carb, protein, fat);

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
