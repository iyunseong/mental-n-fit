"use client"
import React, { useEffect, useState } from 'react'
import InbodyFormInner from '../internal/InbodyFormInner'
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

type InbodyRow = { weight_kg: number | null }
type PresetPayloadBody = { title?: string } | null
type PresetRow = { id: string; payload: PresetPayloadBody }

export default function InbodyForm({ onDataSaved, selectedDate = null }: Props) {
  const [weightDeltaPct, setWeightDeltaPct] = useState<number>(0)
  const [deltaKg, setDeltaKg] = useState<number>(0)
  const [recent, setRecent] = useState<Array<{ id: string; label: string; payload: PresetPayloadBody }>>([])
  const [userId, setUserId] = useState<string | null>(null)
  const dateISO = selectedDate || new Date().toISOString().slice(0, 10)

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
          .from('inbody_logs')
          .select('weight_kg')
          .eq('user_id', userId)
          .order('log_date', { ascending: false })
          .limit(2)
        const rows = (data ?? []) as InbodyRow[]
        if (rows.length >= 2) {
          const latest = rows[0]?.weight_kg ?? 0
          const prev = rows[1]?.weight_kg ?? 0
          const delta = Number(latest) - Number(prev)
          const TARGET_WEEKLY_KG = 0.5
          const pct = Math.min(100, Math.max(0, Math.round((Math.abs(delta) / TARGET_WEEKLY_KG) * 100)))
          setWeightDeltaPct(pct)
          setDeltaKg(delta)
        } else {
          setWeightDeltaPct(0)
          setDeltaKg(0)
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error('[InbodyForm] weight delta calc failed', e)
      }
    })()
  }, [userId])

  useEffect(() => {
    ;(async () => {
      try {
        if (!userId) return
        const { data } = await supabase
          .from('recent_presets')
          .select('id, payload')
          .eq('user_id', userId)
          .eq('kind', 'body')
          .order('updated_at', { ascending: false })
          .limit(3)
        const rows = (data ?? []) as PresetRow[]
        setRecent(rows.map((r) => ({ id: r.id, label: r.payload?.title ?? '프리셋', payload: r.payload })))
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error('[InbodyForm] recent presets failed', e)
      }
    })()
  }, [userId])

  const handleSaved = async () => {
    const keys = [swrKeys.summary(dateISO), swrKeys.kpiToday, swrKeys.missions(dateISO), swrKeys.recent('body')]
    await Promise.all(keys.map((k) => safeMutate(k)))
    if (onDataSaved) onDataSaved()
  }

  const applyPreset = (payload: PresetPayloadBody) => {
    console.warn('프리셋 적용은 곧 지원됩니다:', payload)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ProgressRing value={weightDeltaPct} label="체중 변화" />
        <div className="text-sm text-gray-600 dark:text-gray-300">
          최근 변화량 <span className="font-semibold dark:text-white">{deltaKg >= 0 ? '+' : ''}{deltaKg.toFixed(1)} kg</span>
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">최근 프리셋</div>
        <div className="flex flex-wrap gap-2">
          {recent.map((p) => (
            <button key={p.id} type="button" onClick={() => applyPreset(p.payload)} className="px-2.5 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400">
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {/* ✅ 내부 폼에 선택 날짜 전달 */}
      <InbodyFormInner onDataSaved={handleSaved} selectedDate={dateISO} />
    </div>
  )
}
