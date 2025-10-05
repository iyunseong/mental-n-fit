'use client'

import { useEffect, useState } from 'react'
import { supabase, auth } from '@/lib/supabase'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'

type Props = { from: string; to: string; height?: number }
type Row = { date: string; carb_g?: number | null; protein_g?: number | null; fat_g?: number | null }

export default function MealTrendChart({ from, to, height = 260 }: Props) {
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
          .from('vw_meal_trend')
          .select('date,carb_g,protein_g,fat_g')
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
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis width={40} />
          <Tooltip />
          <Legend />
          {/* 색상 통일: 탄=파랑 / 단백=초록 / 지=노랑 */}
          <Bar dataKey="carb_g"    name="탄수화물(g)" stackId="macro" fill="#60A5FA" barSize={18} />
          <Bar dataKey="protein_g" name="단백질(g)"   stackId="macro" fill="#34D399" barSize={18} />
          <Bar dataKey="fat_g"     name="지방(g)"     stackId="macro" fill="#FBBF24" barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
