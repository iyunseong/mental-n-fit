"use client"
import React, { useEffect, useState } from 'react'
import InbodyFormInner from '@/components/InbodyForm'
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

export default function InbodyForm({ onDataSaved, selectedDate = null, onSave, onCancel }: Props) {
  const [weightDeltaPct, setWeightDeltaPct] = useState<number>(0)
  const [recent, setRecent] = useState<Array<{ id: string; label: string; payload: any }>>([])
  const dateISO = selectedDate || new Date().toISOString().slice(0, 10)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('inbody_logs')
          .select('weight_kg')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2)
        if ((data ?? []).length >= 2) {
          const latest = data![0]?.weight_kg ?? 0
          const prev = data![1]?.weight_kg ?? 0
          const delta = latest - prev
          const pct = Math.min(100, Math.round(Math.abs(delta) * 100) / 100)
          setWeightDeltaPct(pct)
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('recent_presets')
          .select('id, payload')
          .eq('user_id', user.id)
          .eq('kind', 'body')
          .order('updated_at', { ascending: false })
          .limit(3)
        setRecent((data ?? []).map((r: any) => ({ id: r.id, label: r.payload?.title ?? '프리셋', payload: r.payload })))
      } catch {}
    })()
  }, [])

  const handleSaved = async () => {
    const keys = [swrKeys.summary(dateISO), swrKeys.kpiToday, swrKeys.missions(dateISO), swrKeys.recent('body')]
    await Promise.all(keys.map((k) => safeMutate(k)))
    if (onDataSaved) onDataSaved()
  }

  const applyPreset = (payload: any) => {
    console.warn('프리셋 적용은 곧 지원됩니다:', payload)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ProgressRing value={weightDeltaPct} label="체중 변화" />
        <div className="text-sm text-gray-600">최근 변화량</div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">최근 프리셋</div>
        <div className="flex flex-wrap gap-2">
          {recent.map((p) => (
            <button key={p.id} type="button" onClick={() => applyPreset(p.payload)} className="px-2.5 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200 text-gray-800">
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <InbodyFormInner onDataSaved={handleSaved} selectedDate={selectedDate} onSave={onSave} onCancel={onCancel} />
    </div>
  )
}


