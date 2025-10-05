// 서버 전용: 절대 클라이언트에서 import 하지 마세요!
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Server-only env
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
