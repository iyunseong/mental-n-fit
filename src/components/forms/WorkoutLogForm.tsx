"use client"
import React, { useEffect, useState } from 'react'
import WorkoutLogFormInner from '@/components/WorkoutLogForm'
import { ProgressRing } from '@/lib/ui/rings'
import { supabase } from '@/lib/supabase'
import { safeMutate } from '@/lib/swrSafe'
import { swrKeys } from '@/lib/swrKeys'

type Props = {
  onDataSaved?: () => void
  selectedDate?: string | null
  onSave?: () => void
  onCancel?: () => void
}

export default function WorkoutLogForm({ onDataSaved, selectedDate = null, onSave, onCancel }: Props) {
  const [volumePct, setVolumePct] = useState<number>(0)
  const [recent, setRecent] = useState<Array<{ id: string; label: string; payload: any }>>([])
  const [recommend, setRecommend] = useState<{ label: string; payload: any } | null>(null)
  const dateISO = selectedDate || new Date().toISOString().slice(0, 10)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('workout_logs')
          .select('workout_data')
          .eq('user_id', user.id)
          .eq('log_date', dateISO)
        // 대략적 볼륨 합산 → 목표 대비 비율 (예: 10000)
        const total = (data ?? []).reduce((sum: number, row: any) => {
          const exercises = Array.isArray(row.workout_data) ? row.workout_data : []
          const v = exercises.reduce((a: number, ex: any) => a + (ex.sets || []).reduce((s: number, st: any) => s + (st.reps || 0) * (st.weight_kg || 0), 0), 0)
          return sum + v
        }, 0)
        const goal = 10000
        setVolumePct(goal ? Math.min(100, Math.round((total / goal) * 100)) : 0)
      } catch {}
    })()
  }, [dateISO])

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('recent_presets')
          .select('id, payload')
          .eq('user_id', user.id)
          .eq('kind', 'workout')
          .order('updated_at', { ascending: false })
          .limit(3)
        setRecent((data ?? []).map((r: any) => ({ id: r.id, label: r.payload?.exercise ?? '프리셋', payload: r.payload })))
      } catch {}
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { data: prof } = await supabase.from('profiles').select('meta_type').limit(1).maybeSingle()
        const mt: string | undefined = (prof as any)?.meta_type
        if (mt?.includes('P')) setRecommend({ label: '파워 5×3 템플릿', payload: { exercise: '스쿼트', template: '5x3' } })
        else if (mt?.includes('A')) setRecommend({ label: '유산소 35분 steady', payload: { exercise: '사이클', minutes: 35 } })
      } catch {}
    })()
  }, [])

  const handleSaved = async () => {
    const keys = [swrKeys.summary(dateISO), swrKeys.kpiToday, swrKeys.missions(dateISO), swrKeys.recent('workout')]
    await Promise.all(keys.map((k) => safeMutate(k)))
    if (onDataSaved) onDataSaved()
  }

  const applyPreset = (payload: any) => {
    console.warn('프리셋 적용은 곧 지원됩니다:', payload)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ProgressRing value={volumePct} label="볼륨" />
        <div className="text-sm text-gray-600">오늘 운동 볼륨</div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">최근 프리셋</div>
        <div className="flex flex-wrap gap-2">
          {recent.map((p) => (
            <button key={p.id} type="button" onClick={() => applyPreset(p.payload)} className="px-2.5 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200 text-gray-800">
              {p.label}
            </button>
          ))}
          {recommend && (
            <button type="button" onClick={() => applyPreset(recommend.payload)} className="px-2.5 py-1.5 rounded-md text-xs bg-amber-100 hover:bg-amber-200 text-amber-800">
              ⭐ {recommend.label}
            </button>
          )}
        </div>
      </div>
      <WorkoutLogFormInner onDataSaved={handleSaved} selectedDate={selectedDate} onSave={onSave} onCancel={onCancel} />
    </div>
  )
}


