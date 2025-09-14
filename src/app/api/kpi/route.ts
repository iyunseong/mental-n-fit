import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getRange } from '@/lib/date/getRange'

const toISO = (s?: string | null) => (s ? s.slice(0, 10) : s)
type MealRow = { date: string; kcal: number | null; kcal_ma7: number | null }
type WorkoutRow = { date: string; volume: number | null; volume_ma7: number | null }
type CondRow = { date: string; sleep_minutes: number | null; sleep_ma7: number | null }
type InbodyRow = { date: string; weight_kg: number | null; weight_ma7: number | null }

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const qsFrom = toISO(url.searchParams.get('from'))
    const qsTo = toISO(url.searchParams.get('to'))
    const { fromISO, toISO } = qsFrom && qsTo ? { fromISO: qsFrom, toISO: qsTo } : getRange(30, 'Asia/Seoul')

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 400 })
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const [mealRes, workoutRes, condRes, inbodyRes] = await Promise.all([
      supabase.from('vw_meal_trend').select('date,kcal,kcal_ma7').eq('user_id', user.id).gte('date', fromISO).lte('date', toISO).order('date', { ascending: true }),
      supabase.from('vw_workout_trend').select('date,volume,volume_ma7').eq('user_id', user.id).gte('date', fromISO).lte('date', toISO).order('date', { ascending: true }),
      supabase.from('vw_daily_conditions_trend').select('date,sleep_minutes,sleep_ma7').eq('user_id', user.id).gte('date', fromISO).lte('date', toISO).order('date', { ascending: true }),
      supabase.from('vw_inbody_trend').select('date,weight_kg,weight_ma7').eq('user_id', user.id).gte('date', fromISO).lte('date', toISO).order('date', { ascending: true }),
    ])

    const err = mealRes.error || workoutRes.error || condRes.error || inbodyRes.error
    if (err) return NextResponse.json({ error: err.message }, { status: 400 })

    const meals = (mealRes.data ?? []) as MealRow[]
    const workouts = (workoutRes.data ?? []) as WorkoutRow[]
    const conds = (condRes.data ?? []) as CondRow[]
    const inbodies = (inbodyRes.data ?? []) as InbodyRow[]

    const kcal7d = [...meals].reverse().find(r => r.kcal_ma7 != null)?.kcal_ma7 ?? null
    const volume7d = [...workouts].reverse().find(r => r.volume_ma7 != null)?.volume_ma7 ?? null
    const sleep7d = [...conds].reverse().find(r => r.sleep_ma7 != null)?.sleep_ma7 ?? null

    let weightDelta7d: number | null = null
    const last = [...inbodies].reverse().find(r => r.weight_ma7 != null)
    if (last) {
      const target = addDaysISO(last.date, -7)
      const prev = inbodies.find(r => r.date === target && r.weight_ma7 != null) ?? inbodies.find(r => r.weight_ma7 != null)
      if (prev && prev.weight_ma7 != null) weightDelta7d = (last.weight_ma7 ?? 0) - prev.weight_ma7
    }

    return NextResponse.json({ kcal7d, volume7d, sleep7d, weightDelta7d })
  } catch (e: any) {
    console.error('kpi route error:', e)
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
