'use server';

import { createClient } from '@/lib/supabase/server'
import { afterLogSave } from '@/actions/common/hooks'
import type { ConditionPayload } from '@/types/condition'

/**
 * 컨디션 저장: 총수면 계산 후 (user_id, log_date) 기준 upsert
 */
export async function saveDailyCondition(input: ConditionPayload): Promise<{ ok: true }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('no-auth')

  let totalSleepMinutes: number | null = typeof input.sleep_minutes === 'number' ? input.sleep_minutes : null
  if (totalSleepMinutes == null && input.bed_time && input.wake_time) {
    const [bh, bm] = input.bed_time.split(':').map(Number)
    const [wh, wm] = input.wake_time.split(':').map(Number)
    const start = bh * 60 + bm
    let end = wh * 60 + wm
    if (end <= start) end += 24 * 60
    totalSleepMinutes = end - start
  }

  const upsertRow: Record<string, unknown> = {
    user_id: user.id,
    log_date: input.date, // ⚠️ 테이블은 log_date
    bed_time: input.bed_time ?? null,
    wake_time: input.wake_time ?? null,
    sleep_minutes: totalSleepMinutes,
    sleep_quality_1_5: input.sleep_quality_1_5,
    stress_morning_1_5: input.stress_morning_1_5,
    energy_morning_1_5: input.energy_morning_1_5,
    stress_noon_1_5: input.stress_noon_1_5,
    energy_noon_1_5: input.energy_noon_1_5,
    stress_evening_1_5: input.stress_evening_1_5,
    energy_evening_1_5: input.energy_evening_1_5,
    mood_0_10: input.mood_0_10,
    journal_day: input.journal_day ?? null,
    journal_gratitude: input.journal_gratitude ?? null,
    journal_feedback: input.journal_feedback ?? null,
  }

  const { error } = await supabase
    .from('daily_conditions')
    .upsert(upsertRow, { onConflict: 'user_id, log_date' }) // ← 덮어쓰기 보장
  if (error) throw error

  const payloadForHook: ConditionPayload = {
    ...input,
    sleep_minutes: totalSleepMinutes ?? undefined,
  }
  await afterLogSave(user.id, input.date, 'condition', payloadForHook)
  return { ok: true }
}

/**
 * 컨디션 저널만 별도 저장 (같은 테이블, 같은 유니크 키로 upsert)
 */
export async function saveConditionJournals(input: { date: string; journal_day?: string | null; journal_gratitude?: string | null; journal_feedback?: string | null }): Promise<{ ok: true }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('no-auth')

  const upsertRow = {
    user_id: user.id,
    log_date: input.date,
    journal_day: input.journal_day ?? null,
    journal_gratitude: input.journal_gratitude ?? null,
    journal_feedback: input.journal_feedback ?? null,
  }

  const { error } = await supabase
    .from('daily_conditions')
    .upsert(upsertRow, { onConflict: 'user_id, log_date' }) // ← 이게 없으면 새 행이 생길 수 있음
  if (error) throw error

  await afterLogSave(user.id, input.date, 'condition', upsertRow)
  return { ok: true }
}
