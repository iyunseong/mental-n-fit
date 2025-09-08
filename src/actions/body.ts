// src/actions/body.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { afterLogSave } from '@/actions/common/hooks';

type InbodyFormInput = {
  date: string;
  weight_kg: number;
  skeletal_muscle_kg?: number | null;
  body_fat_pct?: number | null;
};

type InsertInbody = {
  user_id: string;
  log_date: string;
  weight_kg: number;
  skeletal_muscle_mass_kg: number | null;
  body_fat_percentage: number | null;
};

export async function saveBody(input: InbodyFormInput): Promise<{ ok: true }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('no-auth');

  const row: InsertInbody = {
    user_id: user.id,
    log_date: input.date,
    weight_kg: input.weight_kg,
    skeletal_muscle_mass_kg: input.skeletal_muscle_kg ?? null,
    body_fat_percentage: input.body_fat_pct ?? null,
  };

  // ✅ (user_id, log_date) 유니크 제약이 있다고 가정하고 onConflict로 "해당 날짜 덮어쓰기"
  const { error } = await supabase
    .from('inbody_logs')
    .upsert(row, { onConflict: 'user_id,log_date' });

  if (error) throw error;

  await afterLogSave(user.id, input.date, 'body', input);
  return { ok: true };
}
