// src/lib/supabase/server.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function createClient() {
  return createServerActionClient({ cookies })
}