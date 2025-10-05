// src/actions/conditions.ts
'use server';

import { createClient } from '@/lib/supabase/server'
import { afterLogSave } from '@/actions/common/hooks'
import type { ConditionPayload } from '@/types/condition'
import { createAdminClient } from '@/lib/supabase/admin'

function pickAuthUserId(userIdFromServer?: string | null, override?: string): string {
  // 서버에서 세션이 있으면 그걸 무조건 사용 (RLS와 일치 보장)
  if (userIdFromServer) return userIdFromServer;
  // 서버 세션이 없을 때만 override 사용(개발/E2E용)
  if (override) return override;
  throw new Error('no-auth');
}


/**
 * 컨디션 저장: 총수면 계산 후 (user_id, log_date) 기준 upsert
 */
export async function saveDailyCondition(input: ConditionPayload, opts?: { userIdOverride?: string }): Promise<{ ok: true }> {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser();
  const authUserId = pickAuthUserId(user?.id, opts?.userIdOverride);
  

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
    user_id: authUserId,
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

  const { error } = await admin
    .from('daily_conditions')
    .upsert(upsertRow, { onConflict: 'user_id,log_date' }) // ← 덮어쓰기 보장
  if (error) {
    // RLS 42501 등의 권한 이슈 빨리 식별
    console.error('[saveDailyCondition] authUserId=', authUserId, 'upsert.user_id=', upsertRow.user_id, 'date=', input.date, 'error=', error);
    throw error
  }

  const payloadForHook: ConditionPayload = {
    ...input,
    sleep_minutes: totalSleepMinutes ?? undefined,
  }
  await afterLogSave(authUserId, input.date, 'condition', payloadForHook)
  return { ok: true }
}

/**
 * 컨디션 저널만 별도 저장 (같은 테이블, 같은 유니크 키로 upsert)
 */
export async function saveConditionJournals(input: { date: string; journal_day?: string | null; journal_gratitude?: string | null; journal_feedback?: string | null }, opts?: { userIdOverride?: string }): Promise<{ ok: true }> {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser();
  const authUserId = pickAuthUserId(user?.id, opts?.userIdOverride);

  const upsertRow = {
    user_id: authUserId,
    log_date: input.date,
    journal_day: input.journal_day ?? null,
    journal_gratitude: input.journal_gratitude ?? null,
    journal_feedback: input.journal_feedback ?? null,
  }

  const { error } = await admin
    .from('daily_conditions')
    .upsert(upsertRow, { onConflict: 'user_id, log_date' }) // ← 이게 없으면 새 행이 생길 수 있음
  if (error) {
    // RLS 42501 등의 권한 이슈 빨리 식별
    console.error('[saveConditionJournals] authUserId=', authUserId, 'upsert.user_id=', upsertRow.user_id, 'date=', input.date, 'error=', error);
    throw error
  }

  await afterLogSave(authUserId, input.date, 'condition', upsertRow)
  return { ok: true }
}
