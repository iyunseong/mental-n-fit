'use client'

import { useEffect, useState } from 'react'
import { supabase, auth } from '@/lib/supabase'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'

type Props = {
  from: string
  to: string
  /** 각 그래프 높이(px) - 오른쪽 그래프들과 동일하게 맞추기 */
  sectionHeight?: number
  /** 섹션 사이 간격(px) - 오른쪽과 동일하게 */
  sectionGap?: number
}

type Row = {
  date: string
  // 에너지/스트레스 시간대별
  energy_morning_1_5?: number | null
  energy_noon_1_5?: number | null
  energy_evening_1_5?: number | null
  stress_morning_1_5?: number | null
  stress_noon_1_5?: number | null
  stress_evening_1_5?: number | null
  // 기분 MA
  mood_ma7?: number | null
}

export default function ConditionTrendChart({
  from,
  to,
  sectionHeight = 260,
  sectionGap = 24,
}: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true); setErr(null)
        if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1') { setRows([]); return }
        const u = await auth.getCurrentUser(); if (!u) throw new Error('no-auth')

        const { data, error } = await supabase
          .from('vw_daily_conditions_trend')
          .select('date,energy_morning_1_5,energy_noon_1_5,energy_evening_1_5,stress_morning_1_5,stress_noon_1_5,stress_evening_1_5,mood_ma7')
          .gte('date', from).lte('date', to)
          .order('date', { ascending: true })

        if (error) throw error
        if (mounted) setRows((data ?? []) as Row[])
      } catch (e: any) {
        if (mounted) setErr(e?.message ?? 'error')
      } finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [from, to])

  if (loading) return <div className="text-sm text-gray-500">불러오는 중…</div>
  if (err) return <div className="text-sm text-red-600">로딩 실패</div>
  if (!rows.length) return <div className="text-sm text-gray-500">표시할 데이터가 없습니다.</div>

  return (
    <div
      className="grid"
      style={{ rowGap: sectionGap }}
    >
      {/* 1) 에너지 */}
      <div style={{ height: sectionHeight }}>
        <div className="text-xs font-medium text-gray-600 mb-1">에너지 (1–5)</div>
        <div className="w-full h-[calc(100%-1.25rem)]">
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 6, right: 16, left: 8, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0.5, 5.5]} width={30} />
              <Tooltip />
              <Legend />
              {/* 아침=파랑, 점심=호박, 저녁=초록 */}
              <Line type="monotone" dataKey="energy_morning_1_5" name="아침" dot={false} stroke="#2563EB" strokeWidth={2.2} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="energy_noon_1_5"    name="점심" dot={false} stroke="#F59E0B" strokeWidth={2.2} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="energy_evening_1_5" name="저녁" dot={false} stroke="#10B981" strokeWidth={2.2} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2) 스트레스 */}
      <div style={{ height: sectionHeight }}>
        <div className="text-xs font-medium text-gray-600 mb-1">스트레스 (1–5)</div>
        <div className="w-full h-[calc(100%-1.25rem)]">
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 6, right: 16, left: 8, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0.5, 5.5]} width={30} />
              <Tooltip />
              <Legend />
              {/* 아침=빨강, 점심=주황, 저녁=보라 */}
              <Line type="monotone" dataKey="stress_morning_1_5" name="아침" dot={false} stroke="#EF4444" strokeWidth={2.2} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="stress_noon_1_5"    name="점심" dot={false} stroke="#F97316" strokeWidth={2.2} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="stress_evening_1_5" name="저녁" dot={false} stroke="#8B5CF6" strokeWidth={2.2} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3) 기분 */}
      <div style={{ height: sectionHeight }}>
        <div className="text-xs font-medium text-gray-600 mb-1">기분 (0–10, 7일 이동평균)</div>
        <div className="w-full h-[calc(100%-1.25rem)]">
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 6, right: 16, left: 8, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis width={30} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="mood_ma7" name="기분 7d MA" dot={false} stroke="#0EA5E9" strokeWidth={2.6} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
