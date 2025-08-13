import { supabase } from './supabase'

export async function selectLatest<T>(table: string, match: Record<string, any>): Promise<T | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .match(match)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return (data && (data as any[])[0]) ?? null
}

export async function upsertByUserDate<T>(
  table: string,
  payload: Record<string, any>
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .upsert(payload, { onConflict: 'user_id, log_date' })
    .select()
    .single()

  if (error) throw error
  return data as T
}


