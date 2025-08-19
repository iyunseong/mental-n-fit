import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(_req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'supabase env missing' }, { status: 500 })
  }
  const sb = createClient(url, key)

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const now = new Date()
  const startISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const endISO = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  const weekStart = new Date(now)
  const day = weekStart.getDay() || 7
  weekStart.setDate(weekStart.getDate() - day + 1)
  const ws = weekStart.toISOString().split('T')[0]
  const we = new Date(weekStart)
  we.setDate(weekStart.getDate() + 6)
  const weStr = we.toISOString().split('T')[0]

  const sevenAgo = new Date(now)
  sevenAgo.setDate(sevenAgo.getDate() - 6)
  const sevenAgoStr = sevenAgo.toISOString().split('T')[0]
  const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const [mealsRes, workoutsRes, sleepRes] = await Promise.all([
    sb.from('meal_events')
      .select('id,total_calories')
      .eq('user_id', user.id)
      .gte('ate_at', startISO)
      .lt('ate_at', endISO),
    sb.from('workout_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('log_date', ws)
      .lte('log_date', weStr),
    sb.from('daily_conditions')
      .select('sleep_hours')
      .eq('user_id', user.id)
      .gte('log_date', sevenAgoStr)
      .lte('log_date', todayLocalStr),
  ])

  type MealRow = { id: string; total_calories: number | null }
  const meals = (mealsRes.data ?? []) as MealRow[]
  const totalCalories = meals.reduce((s, m) => s + (m.total_calories ?? 0), 0)

  let totalProtein = 0
  if (meals.length > 0) {
    const mealIds = meals.map((m) => m.id)
    const itemsRes = await sb.from('meal_items').select('protein').in('meal_event_id', mealIds)
    const itemRows = (itemsRes.data ?? []) as Array<{ protein: number | null }>
    totalProtein = itemRows.reduce((s, r) => s + (r.protein ?? 0), 0)
  }

  const proteinGoal = 130
  const kcalLow = 2000
  const kcalHigh = 2300
  const proteinPct = proteinGoal ? Math.min(100, Math.round((totalProtein / proteinGoal) * 100)) : 0
  const kcalCenter = (kcalLow + kcalHigh) / 2
  const kcalPct = kcalCenter ? Math.min(100, Math.round((totalCalories / kcalCenter) * 100)) : 0

  const workoutSessions = workoutsRes.count ?? 0
  const workoutGoal = 4

  type SleepRow = { sleep_hours: number | null }
  const sleep = (sleepRes.data ?? []) as SleepRow[]
  const vals = sleep.map((s) => s.sleep_hours).filter((v): v is number => typeof v === 'number')
  const sleepHoursAvg = vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : 0

  return NextResponse.json({ proteinPct, kcalPct, workoutSessions, workoutGoal, sleepHoursAvg })
}


