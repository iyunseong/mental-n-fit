'use client'
import React, { useEffect, useState } from 'react'
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
        const res = await fetch('/api/kpi-today', { cache: 'no-store' })
        if (!res.ok) throw new Error('kpi api failed')
        const data = await res.json()
        setKpi(data)
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error('[KPIHeaderClient] fetch failed', e)
      }
    })()
  }, [])

  if (!kpi) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
          <ProgressRing value={0} label="단백질" />
          <div>
            <div className="text-sm text-gray-500">오늘 단백질</div>
            <div className="text-lg font-semibold text-gray-400">…</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
          <ProgressRing value={0} label="칼로리" />
          <div>
            <div className="text-sm text-gray-500">권장 범위 대비</div>
            <div className="text-lg font-semibold text-gray-400">…</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 text-lg font-semibold">…</div>
          <div>
            <div className="text-sm text-gray-500">주간 운동 세션</div>
            <div className="text-lg font-semibold text-gray-400">…</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 text-lg font-semibold">…</div>
          <div>
            <div className="text-sm text-gray-500">최근 7일 평균 수면</div>
            <div className="text-lg font-semibold text-gray-400">…</div>
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


