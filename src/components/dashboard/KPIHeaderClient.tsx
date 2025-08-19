'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProgressRing } from '@/lib/ui/rings'

type Kpi = {
  proteinPct: number
  kcalPct: number
  workoutSessions: number
  workoutGoal: number
  sleepHoursAvg: number
}

export default function KPIHeaderClient() {
  const [kpi, setKpi] = useState<Kpi | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const now = new Date()
        const startOfTodayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const endOfTodayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
        const startISO = startOfTodayLocal.toISOString()
        const endISO = endOfTodayLocal.toISOString()

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
          supabase
            .from('meal_events')
            .select('total_calories, total_protein')
            .eq('user_id', user.id)
            .gte('ate_at', startISO)
            .lt('ate_at', endISO),
          supabase
            .from('workout_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('log_date', ws)
            .lte('log_date', weStr),
          supabase
            .from('daily_conditions')
            .select('sleep_hours')
            .eq('user_id', user.id)
            .gte('log_date', sevenAgoStr)
            .lte('log_date', todayLocalStr),
        ])

        type MealRow = { total_calories: number | null; total_protein: number | null }
        type SleepRow = { sleep_hours: number | null }

        const meals = (mealsRes.data ?? []) as MealRow[]
        const totalCalories = meals.reduce((s, m) => s + (m.total_calories ?? 0), 0)
        const totalProtein = meals.reduce((s, m) => s + (m.total_protein ?? 0), 0)

        const proteinGoal = 130
        const kcalLow = 2000
        const kcalHigh = 2300
        const proteinPct = proteinGoal ? Math.min(100, Math.round((totalProtein / proteinGoal) * 100)) : 0
        const kcalCenter = (kcalLow + kcalHigh) / 2
        const kcalPct = kcalCenter ? Math.min(100, Math.round((totalCalories / kcalCenter) * 100)) : 0

        const workoutSessions = workoutsRes.count ?? 0
        const workoutGoal = 4

        const sleep = (sleepRes.data ?? []) as SleepRow[]
        const vals = sleep.map((s) => s.sleep_hours).filter((v): v is number => typeof v === 'number')
        const sleepHoursAvg = vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : 0

        setKpi({ proteinPct, kcalPct, workoutSessions, workoutGoal, sleepHoursAvg })
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error('[KPIHeaderClient] fetch failed', e)
      }
    })()
  }, [])

  if (!kpi) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <ProgressRing value={kpi.proteinPct} label="단백질" />
        <div>
          <div className="text-sm text-gray-500">오늘 단백질</div>
          <div className="text-lg font-semibold text-gray-900">{kpi.proteinPct}%</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <ProgressRing value={kpi.kcalPct} label="칼로리" />
        <div>
          <div className="text-sm text-gray-500">권장 범위 대비</div>
          <div className="text-lg font-semibold text-gray-900">{kpi.kcalPct}%</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-800 text-lg font-semibold">{kpi.workoutSessions}/{kpi.workoutGoal}</div>
        <div>
          <div className="text-sm text-gray-500">주간 운동 세션</div>
          <div className="text-lg font-semibold text-gray-900">목표 {kpi.workoutGoal}회</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-800 text-lg font-semibold">{kpi.sleepHoursAvg}h</div>
        <div>
          <div className="text-sm text-gray-500">최근 7일 평균 수면</div>
          <div className="text-lg font-semibold text-gray-900">{kpi.sleepHoursAvg}시간</div>
        </div>
      </div>
      <div className="col-span-full">
        <div className="w-full h-10 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
          ConfidenceMeter 자리 (추가 예정)
        </div>
      </div>
    </div>
  )
}


