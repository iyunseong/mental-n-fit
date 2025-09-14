'use client'

import React, { useMemo } from 'react'
import useSWR from 'swr'
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { swrKeys } from '@/lib/swrKeys'
import { getRange } from '@/lib/date/getRange'

type Props = {
  refreshTrigger?: number
  from?: Date | string
  to?: Date | string
}

type Row = {
  date: string
  kcal: number | null
  kcal_ma7: number | null
  carb_g: number | null
  protein_g: number | null
  fat_g: number | null
  fiber_g: number | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

const ensureISO = (d?: Date | string): string => {
  if (!d) return ''
  if (typeof d === 'string') return d.slice(0, 10)
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10)
}

const EmptyState = () => (
  <div className="h-56 flex items-center justify-center text-sm text-gray-500">
    데이터가 없습니다. 식단을 기록해 보세요.
  </div>
)

export default function MealTrendChart({ refreshTrigger = 0, from, to }: Props) {
  const fallback = getRange(30, 'Asia/Seoul')
  const fromISO = ensureISO(from) || fallback.fromISO
  const toISO = ensureISO(to) || fallback.toISO

  const key = [...swrKeys.trend('meal', fromISO, toISO), String(refreshTrigger)] as const
  const { data, error, isLoading } = useSWR<Row[]>(
    key,
    () => fetcher(`/api/trend/meal?from=${fromISO}&to=${toISO}`),
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  const rows = useMemo(() => (data ?? []).sort((a, b) => a.date.localeCompare(b.date)), [data])

  if (isLoading) return <div className="h-56 animate-pulse bg-gray-50 rounded-lg" />
  if (!rows?.length) return <EmptyState />

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickMargin={8} />
          <YAxis tickMargin={8} />
          <Tooltip />
          <Legend />
          {/* 매크로 스택 영역 (g) */}
          <Area type="monotone" dataKey="carb_g" name="탄수화물(g)" stackId="1" />
          <Area type="monotone" dataKey="protein_g" name="단백질(g)" stackId="1" />
          <Area type="monotone" dataKey="fat_g" name="지방(g)" stackId="1" />
          {/* 총칼로리 & 7d MA 라인 */}
          <Line type="monotone" dataKey="kcal" name="칼로리(kcal)" strokeWidth={1.4} dot={false} />
          <Line type="monotone" dataKey="kcal_ma7" name="칼로리(7d MA)" strokeWidth={2.2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
