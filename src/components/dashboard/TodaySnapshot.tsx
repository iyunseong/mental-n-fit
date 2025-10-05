'use client'

import { useEffect, useState } from 'react'
import { supabase, auth } from '@/lib/supabase'
import { toLocalDateISO } from '@/lib/date/toLocalDateISO'
import CircleProgress from '@/components/ui/CircleProgress'

type MealRow = { date: string; protein_g: number | null }
type WorkoutRow = { date: string; volume: number | null }
type SleepRow = { sleep_minutes: number | null }
type BodyRow = { weight_kg: number | null }

export default function TodaySnapshot() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [proteinG, setProteinG] = useState<number>(0)
  const [proteinGoalG, setProteinGoalG] = useState<number>(0)
  const [volume, setVolume] = useState<number>(0)
  const [sleepMin, setSleepMin] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true); setError(null)

        if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1') {
          if (!mounted) return
          setProteinG(0); setProteinGoalG(0); setVolume(0); setSleepMin(0)
          return
        }

        const u = await auth.getCurrentUser()
        if (!u) throw new Error('no-auth')

        const today = toLocalDateISO(new Date())

        // 병렬 로드
        const [meal, workout, sleep, body] = await Promise.all([
          // 오늘 섭취 단백질 (뷰에서 집계)
          supabase.from('vw_meal_trend')
            .select('date,protein_g').eq('date', today).maybeSingle(),
          // 오늘 운동 볼륨 (뷰)
          supabase.from('vw_workout_trend')
            .select('date,volume').eq('date', today).maybeSingle(),
          // 오늘 수면 분 (원천 테이블)
          supabase.from('daily_conditions')
            .select('sleep_minutes').eq('user_id', u.id).eq('log_date', today).maybeSingle(),
          // 최근 체중 (오늘 포함 직전값)
          supabase.from('inbody_logs')
            .select('weight_kg').eq('user_id', u.id)
            .lte('log_date', today).order('log_date', { ascending: false }).limit(1).maybeSingle(),
        ])

        if (!mounted) return
        setProteinG(Math.max(0, Math.round(meal.data?.protein_g || 0)))
        const weight = body.data?.weight_kg || 0
        setProteinGoalG(weight > 0 ? Math.round(weight * 1.6) : 0)
        setVolume(Math.max(0, Math.round(workout.data?.volume || 0)))
        setSleepMin(Math.max(0, Math.round(sleep.data?.sleep_minutes || 0)))
      } catch (e: any) {
        console.warn(e); if (mounted) setError(e?.message ?? 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const proteinPct = proteinGoalG > 0 ? proteinG / proteinGoalG : 0
  const sleepGoal = 7 * 60
  const sleepPct = sleepMin > 0 ? Math.min(1, sleepMin / sleepGoal) : 0
  const hh = Math.floor(sleepMin / 60)
  const mm = sleepMin % 60

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 오늘 섭취 단백질 */}
      <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-4">
        <CircleProgress
          progress={proteinPct}
          color="#10B981"
          trackColor="#E5E7EB"
          size={96}
          stroke={10}
          center={
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">단백질</div>
              <div className="text-sm font-semibold">{proteinG}g</div>
            </div>
          }
          ariaLabel="오늘 섭취 단백질 진행도"
        />
        <div>
          <div className="text-sm text-gray-600">오늘 섭취 단백질</div>
          <div className="text-xl font-semibold">{proteinG} g</div>
          <div className="text-xs text-gray-500">목표 {proteinGoalG > 0 ? `${proteinGoalG} g` : '— (최근 체중 필요)'}</div>
        </div>
      </div>

      {/* 오늘 운동 볼륨 */}
      <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
          ⚡
        </div>
        <div>
          <div className="text-sm text-gray-600">오늘 운동 볼륨</div>
          <div className="text-2xl font-semibold">{volume}</div>
          <div className="text-xs text-gray-500">무게×반복수 합</div>
        </div>
      </div>

      {/* 오늘 수면 시간 */}
      <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-4">
        <CircleProgress
          progress={sleepPct}
          color="#3B82F6"
          trackColor="#E5E7EB"
          size={96}
          stroke={10}
          center={
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">수면</div>
              <div className="text-sm font-semibold">{hh}h {mm}m</div>
            </div>
          }
          ariaLabel="오늘 수면 시간 진행도"
        />
        <div>
          <div className="text-sm text-gray-600">오늘 수면 시간</div>
          <div className="text-xl font-semibold">{hh}시간 {mm}분</div>
          <div className="text-xs text-gray-500">목표 7시간</div>
        </div>
      </div>
    </div>
  )
}
