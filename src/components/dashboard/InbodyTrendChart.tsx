'use client'

import { useEffect, useState } from 'react'
import { supabase, auth } from '@/lib/supabase'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'

type Props = { from: string; to: string; height?: number }
type Row = {
  date: string
  weight_kg?: number | null
  weight_ma7?: number | null
  skeletal_muscle_mass_kg?: number | null
  body_fat_percentage?: number | null
}

export default function InbodyTrendChart({ from, to, height = 260 }: Props) {
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
          .from('vw_inbody_trend')
          .select('date,weight_kg,weight_ma7,skeletal_muscle_mass_kg,body_fat_percentage')
          .gte('date', from).lte('date', to).order('date', { ascending: true })
        if (error) throw error
        if (mounted) setRows((data ?? []) as Row[])
      } catch (e: any) { if (mounted) setErr(e?.message ?? 'error') }
      finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [from, to])

  if (loading) return <div className="text-sm text-gray-500">불러오는 중…</div>
  if (err) return <div className="text-sm text-red-600">로딩 실패</div>
  if (!rows.length) return <div className="text-sm text-gray-500">표시할 데이터가 없습니다.</div>

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="l" width={40} />
          <YAxis yAxisId="r" orientation="right" width={40} />
          <Tooltip />
          <Legend />
          <Line yAxisId="l" type="monotone" dataKey="weight_kg"               name="체중(kg)"     dot={false} stroke="#2563EB" strokeWidth={2.2} activeDot={{ r: 4 }} />
          <Line yAxisId="l" type="monotone" dataKey="weight_ma7"              name="체중 7d MA"   dot={false} stroke="#1E40AF" strokeWidth={2.6} activeDot={{ r: 4 }} />
          <Line yAxisId="l" type="monotone" dataKey="skeletal_muscle_mass_kg" name="골격근량(kg)" dot={false} stroke="#10B981" strokeWidth={2.0} activeDot={{ r: 4 }} />
          <Line yAxisId="r" type="monotone" dataKey="body_fat_percentage"     name="체지방(%)"    dot={false} stroke="#EF4444" strokeWidth={2.0} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
