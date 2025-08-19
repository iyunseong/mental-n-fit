// component/forms/WorkoutLogForm.tsx
"use client"
import React, { useEffect, useMemo, useState } from 'react'
import WorkoutLogFormInner from '@/components/internal/WorkoutLogFormInner'
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

type SetRow = { reps?: number | null; weight_kg?: number | null }
type ExerciseRow = { sets?: SetRow[] | null }
type WorkoutLogRow = { workout_data: ExerciseRow[] | null }

type WorkoutPresetPayload = {
  label?: string
  exercise?: string
  template?: '5x3' | '5x5' | 'emom' | string
  minutes?: number
  sets?: Array<{ reps?: number; weight_kg?: number }>
}
type WorkoutPreset = { id?: string; label: string; payload: WorkoutPresetPayload }
type RecentRow = { id: string; payload: WorkoutPresetPayload | null }

function calcVolume(rows: WorkoutLogRow[]): number {
  return rows.reduce((sum, row) => {
    const exs = Array.isArray(row.workout_data) ? row.workout_data : []
    const v = exs.reduce((a, ex) => {
      const sets = Array.isArray(ex.sets) ? ex.sets : []
      return a + sets.reduce((s, st) => s + (Number(st.reps) || 0) * (Number(st.weight_kg) || 0), 0)
    }, 0)
    return sum + v
  }, 0)
}

export default function WorkoutLogForm({ onDataSaved, selectedDate = null, onSave, onCancel }: Props) {
  const [volumePct, setVolumePct] = useState<number>(0)
  const [totalVolume, setTotalVolume] = useState<number>(0)
  const [recent, setRecent] = useState<WorkoutPreset[]>([])
  const [recommend, setRecommend] = useState<WorkoutPreset | null>(null)
  const [initialValue, setInitialValue] = useState<WorkoutPresetPayload | null>(null)
  const [formKey, setFormKey] = useState<number>(0)
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
        const rows = (data ?? []) as WorkoutLogRow[]
        const total = calcVolume(rows)
        setTotalVolume(total)
        const goal = 10000 // TODO: 개인화 목표로 대체
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
        const [presetsRes, profRes] = await Promise.all([
          supabase
            .from('recent_presets')
            .select('id, payload')
            .eq('user_id', userId)
            .eq('kind', 'workout')
            .order('updated_at', { ascending: false })
            .limit(3),
          supabase
            .from('profiles')
            .select('meta_type')
            .eq('user_id', userId)
            .maybeSingle(),
        ])

        const presetRows = (presetsRes.data ?? []) as RecentRow[]
        setRecent(presetRows.map((r) => ({ id: r.id, label: r.payload?.label ?? r.payload?.exercise ?? '프리셋', payload: r.payload ?? {} })))

        const mt: string | undefined = (profRes.data as { meta_type?: string } | null)?.meta_type
        if (mt?.includes('P')) setRecommend({ label: '파워 5×3 템플릿', payload: { label: '스쿼트 5×3', exercise: '스쿼트', template: '5x3' } })
        else if (mt?.includes('A')) setRecommend({ label: '유산소 35분 steady', payload: { label: '사이클 35분', exercise: '사이클', minutes: 35 } })
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error('presets/profile fetch failed', e)
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
    setFormKey((k) => k + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ProgressRing value={volumePct} label="볼륨" />
        <div className="text-sm text-gray-600">
          오늘 운동 볼륨 <span className="font-semibold">{totalVolume.toLocaleString()} pt</span>
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">최근 프리셋</div>
        <div className="flex flex-wrap gap-2">
          {recent.length === 0 && (
            <div className="text-xs text-gray-500">최근 프리셋이 없어요.</div>
          )}
          {recent.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.payload)}
              className="px-2.5 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
            >
              {p.label}
            </button>
          ))}
          {recommend && (
            <button
              type="button"
              onClick={() => applyPreset(recommend.payload)}
              className="px-2.5 py-1.5 rounded-md text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
            >
              ⭐ {recommend.label}
            </button>
          )}
        </div>
      </div>
      <WorkoutLogFormInner
        key={formKey}
        initialValue={initialValue}
        onDataSaved={handleSaved}
        selectedDate={selectedDate ?? undefined}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  )
}


