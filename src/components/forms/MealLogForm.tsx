"use client"
import React, { useEffect, useState } from 'react'
import MealLogFormInner from '@/components/MealLogForm'
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

export default function MealLogForm({ onDataSaved, selectedDate = null, onSave, onCancel }: Props) {
  type MealRow = { total_protein: number | null }
  type MealPresetPayload = { name: string }
  type MealPreset = { id: string; label: string; payload: MealPresetPayload }

  const [proteinPct, setProteinPct] = useState<number>(0)
  const [recent, setRecent] = useState<MealPreset[]>([])
  const [recommend, setRecommend] = useState<{ label: string; payload: MealPresetPayload } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const dateISO = selectedDate || new Date().toISOString().slice(0, 10)

  // 사용자 1회 조회
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    })()
  }, [])

  // KPI: 오늘 단백질 달성률
  useEffect(() => {
    ;(async () => {
      try {
        const base = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date()
        const start = new Date(base.getFullYear(), base.getMonth(), base.getDate())
        const end = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1)
        if (!userId) return
        const { data } = await supabase
          .from('meal_events')
          .select('total_protein')
          .eq('user_id', userId)
          .gte('ate_at', start.toISOString())
          .lt('ate_at', end.toISOString())
        const rows = (data ?? []) as MealRow[]
        const totalProtein = rows.reduce((s, r) => s + (r.total_protein ?? 0), 0)
        const goal = 130
        setProteinPct(goal ? Math.min(100, Math.round((totalProtein / goal) * 100)) : 0)
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('[MealLogForm] KPI fetch failed', e)
      }
    })()
  }, [selectedDate, userId])

  // 최근 프리셋 3개
  useEffect(() => {
    ;(async () => {
      try {
        if (!userId) return
        const { data } = await supabase
          .from('recent_presets')
          .select('id, payload')
          .eq('user_id', userId)
          .eq('kind', 'meal')
          .order('updated_at', { ascending: false })
          .limit(3)
        type RecentRow = { id: string; payload: { name?: string } | null }
        const rows = (data ?? []) as RecentRow[]
        const mapped: MealPreset[] = rows.map((r) => ({ id: r.id, label: r.payload?.name ?? '프리셋', payload: { name: r.payload?.name ?? '프리셋' } }))
        setRecent(mapped)
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('[MealLogForm] recent presets failed', e)
      }
    })()
  }, [userId])

  // 메타타입 추천 1개 (B/P 우선 로직 샘플)
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
        if (mt?.includes('B')) setRecommend({ label: '단백질/지방 위주 식사', payload: { name: '스테이크 200g' } })
        else if (mt?.includes('P')) setRecommend({ label: '통곡물/섬유질 식사', payload: { name: '퀴노아샐러드' } })
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('[MealLogForm] meta-type fetch failed', e)
      }
    })()
  }, [userId])

  // 저장 이후 SWR 키들 갱신 및 토스트 메시지
  const handleSaved = async () => {
    const keys = [swrKeys.summary(dateISO), swrKeys.kpiToday, swrKeys.missions(dateISO), swrKeys.recent('meal')]
    await Promise.all(keys.map((k) => safeMutate(k)))
    if (onDataSaved) onDataSaved()
  }

  // 프리셋 적용: 기존 내부 폼에 직접 주입은 현재 구조상 미지원 → 안내
  const applyPreset = (payload: MealPresetPayload) => {
    console.warn('프리셋 적용은 곧 지원됩니다:', payload)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ProgressRing value={proteinPct} label="단백질" />
        <div className="text-sm text-gray-600">오늘 단백질 달성률</div>
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
      <MealLogFormInner onDataSaved={handleSaved} selectedDate={selectedDate ?? undefined} onSave={onSave} onCancel={onCancel} />
    </div>
  )
}


