"use client"
import React, { useEffect, useState } from 'react'
import DailyConditionFormInner from '../internal/DailyConditionFormInner'
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

type ConditionRow = { sleep_hours: number | null; log_date: string }
type PresetRow = { id: string; payload: { title?: string } | null }
type ConditionPreset = { id: string; label: string; payload: { title?: string } | null }

export default function DailyConditionForm({ onDataSaved, selectedDate = null, onSave, onCancel }: Props) {
  const [sleepPct, setSleepPct] = useState<number>(0)
  const [recent, setRecent] = useState<ConditionPreset[]>([])
  const [recommend, setRecommend] = useState<ConditionPreset | null>(null)
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
        // 최근 3일 평균 수면 대비 오늘 목표 비율 조회 예시
        const today = dateISO
        const threeAgo = new Date(`${today}T00:00:00`)
        threeAgo.setDate(threeAgo.getDate() - 2)
        const threeAgoStr = threeAgo.toISOString().split('T')[0]
        const { data } = await supabase
          .from('daily_conditions')
          .select('sleep_hours, log_date')
          .eq('user_id', userId)
          .gte('log_date', threeAgoStr)
          .lte('log_date', today)
        const rows = (data ?? []) as ConditionRow[]
        const vals = rows.map((r) => r.sleep_hours).filter((n): n is number => typeof n === 'number')
        const avg = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0
        const goal = 7
        const todayVal = rows.find((r) => r.log_date === today)?.sleep_hours ?? null
        const base = todayVal ?? avg
        const pct = goal ? Math.min(100, Math.round(((base || 0) / goal) * 100)) : 0
        setSleepPct(pct)
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('[DailyConditionForm] sleep% calc failed', e)
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
          .eq('kind', 'condition')
          .order('updated_at', { ascending: false })
          .limit(3)
        const mapped = ((data ?? []) as PresetRow[]).map((r) => ({ id: r.id, label: r.payload?.title ?? '프리셋', payload: r.payload }))
        setRecent(mapped)
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('[DailyConditionForm] recent presets failed', e)
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
        if (mt?.includes('I')) setRecommend({ id: 'rec', label: '호흡/안정 모드 ON', payload: { title: 'calm' } })
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('[DailyConditionForm] metatype recommend failed', e)
      }
    })()
  }, [userId])

  const handleSaved = async () => {
    const keys = [swrKeys.summary(dateISO), swrKeys.kpiToday, swrKeys.missions(dateISO), swrKeys.recent('condition')]
    await Promise.all(keys.map((k) => safeMutate(k)))
    if (onDataSaved) onDataSaved()
  }

  const applyPreset = (payload: { title?: string } | null) => {
    console.warn('프리셋 적용은 곧 지원됩니다:', payload)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ProgressRing value={sleepPct} label="수면" />
        <div className="text-sm text-gray-600">오늘 수면 목표</div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">최근 프리셋</div>
        <div className="flex flex-wrap gap-2">
          {recent.map((p) => (
            <button key={p.id} type="button" onClick={() => applyPreset(p.payload)} className="px-2.5 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400">
              {p.label}
            </button>
          ))}
          {recommend && (
            <button type="button" onClick={() => applyPreset(recommend.payload)} className="px-2.5 py-1.5 rounded-md text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400">
              ⭐ {recommend.label}
            </button>
          )}
        </div>
      </div>
      <DailyConditionFormInner onDataSaved={handleSaved} onSave={onSave} onCancel={onCancel} />
    </div>
  )
}


