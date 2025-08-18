// component/forms/WorkoutLogForm.tsx
"use client"
import React, { useEffect, useMemo, useState } from 'react'
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

type WorkoutPresetPayload = { label?: string; exercise?: string; template?: string; minutes?: number; sets?: Array<{ reps?: number; weight_kg?: number }> }
type WorkoutPreset = { id?: string; label: string; payload: WorkoutPresetPayload }

export default function WorkoutLogForm({ onDataSaved, selectedDate = null, onSave, onCancel }: Props) {
  const [volumePct, setVolumePct] = useState<number>(0)
  const [recent, setRecent] = useState<WorkoutPreset[]>([])
  const [recommend, setRecommend] = useState<WorkoutPreset | null>(null)
  const [initialValue, setInitialValue] = useState<WorkoutPresetPayload | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const dateISO = useMemo(() => {
    const d = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date()
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    return local.toISOString().slice(0, 10)
  }, [selectedDate])

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        if (!userId) return
        const { data } = await supabase
          .from('workout_logs')
          .select('workout_data')
          .eq('user_id', userId)
          .eq('log_date', dateISO)
        // 대략적 볼륨 합산 → 목표 대비 비율 (예: 10000)
        type Row = { workout_data: Array<{ sets?: Array<{ reps?: number; weight_kg?: number }> }> }
        const rows = (data ?? []) as Row[]
        const total = rows.reduce((sum: number, row) => {
          const exercises = Array.isArray(row.workout_data) ? row.workout_data : []
          const v = exercises.reduce((a: number, ex) => a + (ex.sets || []).reduce((s: number, st) => s + (Number(st.reps) || 0) * (Number(st.weight_kg) || 0), 0), 0)
          return sum + v
        }, 0)
        const goal = 10000
        setVolumePct(goal ? Math.min(100, Math.round((total / goal) * 100)) : 0)
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('volume calc failed', e)
      }
    })()
  }, [dateISO, userId])

  useEffect(() => {
    ;(async () => {
      try {
        if (!userId) return
        const { data } = await supabase
          .from('recent_presets')
          .select('id, payload')
          .eq('user_id', userId)
          .eq('kind', 'workout')
          .order('updated_at', { ascending: false })
          .limit(3)
        type RecentRow = { id: string; payload: WorkoutPresetPayload | null }
        const rows = (data ?? []) as RecentRow[]
        setRecent(rows.map((r) => ({ id: r.id, label: r.payload?.label ?? r.payload?.exercise ?? '프리셋', payload: r.payload ?? {} })))
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('recent presets failed', e)
      }
    })()
  }, [userId])

  useEffect(() => {
    ;(async () => {
      try {
        if (!userId) return
        const { data: prof } = await supabase
          .from('profiles')
          .select('meta_type')
          .eq('user_id', userId)
          .maybeSingle()
        const mt: string | undefined = (prof as { meta_type?: string } | null)?.meta_type
        if (mt?.includes('P')) setRecommend({ label: '파워 5×3 템플릿', payload: { label: '스쿼트 5×3', exercise: '스쿼트', template: '5x3' } })
        else if (mt?.includes('A')) setRecommend({ label: '유산소 35분 steady', payload: { label: '사이클 35분', exercise: '사이클', minutes: 35 } })
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('metatype recommend failed', e)
      }
    })()
  }, [userId])

  const handleSaved = async () => {
    const keys = [swrKeys.summary(dateISO), swrKeys.kpiToday, swrKeys.missions(dateISO), swrKeys.recent('workout')]
    await Promise.all(keys.map((k) => safeMutate(k)))
    if (onDataSaved) onDataSaved()
  }

  const applyPreset = (payload: WorkoutPresetPayload) => {
    setInitialValue(payload)
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
      <WorkoutLogFormInner
        key={JSON.stringify(initialValue) || 'empty'}
        initialValue={initialValue}
        onDataSaved={handleSaved}
        selectedDate={selectedDate ?? undefined}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  )
}


