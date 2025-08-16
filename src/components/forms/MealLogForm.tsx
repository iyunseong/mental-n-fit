"use client"
import React, { useEffect, useMemo, useState } from 'react'
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
  const [proteinPct, setProteinPct] = useState<number>(0)
  const [recent, setRecent] = useState<Array<{ id: string; label: string; payload: any }>>([])
  const [recommend, setRecommend] = useState<{ label: string; payload: any } | null>(null)
  const dateISO = selectedDate || new Date().toISOString().slice(0, 10)

  // KPI: 오늘 단백질 달성률
  useEffect(() => {
    ;(async () => {
      try {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('meal_events')
          .select('total_protein')
          .eq('user_id', user.id)
          .gte('ate_at', start.toISOString())
          .lt('ate_at', end.toISOString())
        const totalProtein = (data ?? []).reduce((s: number, r: any) => s + (r.total_protein ?? 0), 0)
        const goal = 130
        setProteinPct(goal ? Math.min(100, Math.round((totalProtein / goal) * 100)) : 0)
      } catch {}
    })()
  }, [selectedDate])

  // 최근 프리셋 3개
  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('recent_presets')
          .select('id, payload')
          .eq('user_id', user.id)
          .eq('kind', 'meal')
          .order('updated_at', { ascending: false })
          .limit(3)
        const mapped = (data ?? []).map((r: any) => ({ id: r.id, label: r.payload?.name ?? '프리셋', payload: r.payload }))
        setRecent(mapped)
      } catch {}
    })()
  }, [])

  // 메타타입 추천 1개 (B/P 우선 로직 샘플)
  useEffect(() => {
    ;(async () => {
      try {
        const { data: prof } = await supabase.from('profiles').select('meta_type').limit(1).maybeSingle()
        const mt: string | undefined = (prof as any)?.meta_type
        if (mt?.includes('B')) setRecommend({ label: '단백질/지방 위주 식사', payload: { name: '스테이크 200g' } })
        else if (mt?.includes('P')) setRecommend({ label: '통곡물/섬유질 식사', payload: { name: '퀴노아샐러드' } })
      } catch {}
    })()
  }, [])

  // 저장 이후 SWR 키들 갱신 및 토스트 메시지
  const handleSaved = async () => {
    const keys = [swrKeys.summary(dateISO), swrKeys.kpiToday, swrKeys.missions(dateISO), swrKeys.recent('meal')]
    await Promise.all(keys.map((k) => safeMutate(k)))
    if (onDataSaved) onDataSaved()
  }

  // 프리셋 적용: 기존 내부 폼에 직접 주입은 현재 구조상 미지원 → 안내
  const applyPreset = (payload: any) => {
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
      <MealLogFormInner onDataSaved={handleSaved} selectedDate={selectedDate} onSave={onSave} onCancel={onCancel} />
    </div>
  )
}


