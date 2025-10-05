'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase, auth } from '@/lib/supabase'

type Props = { from: string; to: string }

type MealRow = { date: string; kcal: number | null; kcal_ma7: number | null }
type WorkoutRow = { date: string; volume: number | null; volume_ma7: number | null }
type CondRow = { date: string; sleep_minutes?: number | null; sleep_ma7?: number | null }
type BodyRow = { date: string; weight_kg: number | null; weight_ma7: number | null }

export default function KPIHeaderClient({ from, to }: Props) {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [kcal7, setKcal7] = useState<number | null>(null)
  const [vol7, setVol7] = useState<number | null>(null)
  const [sleep7, setSleep7] = useState<number | null>(null)
  const [weightDelta, setWeightDelta] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true); setErr(null)

        if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1') {
          // 테스트 모드: 빈값
          if (!mounted) return
          setKcal7(null); setVol7(null); setSleep7(null); setWeightDelta(null)
          return
        }

        const user = await auth.getCurrentUser()
        if (!user) throw new Error('no-auth')

        // 병렬 조회
        const [meal, workout, cond, body] = await Promise.all([
          supabase.from('vw_meal_trend')
            .select('date,kcal,kcal_ma7')
            .gte('date', from).lte('date', to).order('date', { ascending: true }),
          supabase.from('vw_workout_trend')
            .select('date,volume,volume_ma7')
            .gte('date', from).lte('date', to).order('date', { ascending: true }),
          supabase.from('vw_daily_conditions_trend')
            .select('date,sleep_ma7')
            .gte('date', from).lte('date', to).order('date', { ascending: true }),
          supabase.from('vw_inbody_trend')
            .select('date,weight_kg,weight_ma7')
            .gte('date', from).lte('date', to).order('date', { ascending: true }),
        ])

        const mealRows = (meal.data ?? []) as MealRow[]
        const workoutRows = (workout.data ?? []) as WorkoutRow[]
        const condRows = (cond.data ?? []) as CondRow[]
        const bodyRows = (body.data ?? []) as BodyRow[]

        // KPI 계산
        const last = <T,>(rows: T[]) => rows.length ? rows[rows.length - 1] : undefined

        setKcal7(last(mealRows)?.kcal_ma7 ?? null)
        setVol7(last(workoutRows)?.volume_ma7 ?? null)
        setSleep7(last(condRows)?.sleep_ma7 ?? null)

        // 체중 MA Δ: 범위 내 첫 MA7과 마지막 MA7 차이
        const firstMA = bodyRows.find(r => r.weight_ma7 != null)?.weight_ma7 ?? null
        const lastMA = last(bodyRows)?.weight_ma7 ?? null
        setWeightDelta((firstMA != null && lastMA != null) ? (lastMA - firstMA) : null)

      } catch (e: any) {
        console.warn(e)
        if (mounted) setErr(e?.message ?? 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [from, to])

  const fmtK = (n: number | null) => n == null ? '—' : `${Math.round(n)} kcal`
  const fmtM = (n: number | null) => n == null ? '—' : `${Math.round(n)} 분`
  const fmtVol = (n: number | null) => n == null ? '—' : `${Math.round(n)}`
  const fmtDelta = (n: number | null) => {
    if (n == null) return '—'
    const sign = n > 0 ? '+' : ''
    return `${sign}${n.toFixed(1)} kg`
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KPI title="최근 7일 평균 kcal" value={fmtK(kcal7)} loading={loading} error={err} />
      <KPI title="최근 7일 근력 볼륨 MA" value={fmtVol(vol7)} loading={loading} error={err} />
      <KPI title="최근 7일 수면 MA" value={fmtM(sleep7)} loading={loading} error={err} />
      <KPI title="체중 MA Δ" value={fmtDelta(weightDelta)} loading={loading} error={err} />
    </div>
  )
}

function KPI({ title, value, loading, error }: { title: string; value: string; loading: boolean; error: string | null }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">
        {loading ? <span className="text-gray-400">불러오는 중…</span> : error ? <span className="text-red-600">오류</span> : value}
      </div>
    </div>
  )
}
