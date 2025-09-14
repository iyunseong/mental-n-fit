'use client'

import React, { useMemo } from 'react'
import useSWR from 'swr'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { swrKeys } from '@/lib/swrKeys'
import { getRange } from '@/lib/date/getRange'

type Props = {
  refreshTrigger?: number
  from?: Date | string
  to?: Date | string
}

type Row = {
  date: string
  weight_kg: number | null
  weight_ma7: number | null
  body_fat_percentage: number | null
  skeletal_muscle_mass_kg: number | null
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
    데이터가 없습니다. InBody를 기록해 보세요.
  </div>
)

export default function InbodyTrendChart({ refreshTrigger = 0, from, to }: Props) {
  const fallback = getRange(30, 'Asia/Seoul')
  const fromISO = ensureISO(from) || fallback.fromISO
  const toISO = ensureISO(to) || fallback.toISO

  const key = [...swrKeys.trend('inbody', fromISO, toISO), String(refreshTrigger)] as const
  const { data, error, isLoading } = useSWR<Row[]>(
    key,
    () => fetcher(`/api/trend/inbody?from=${fromISO}&to=${toISO}`),
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  const rows = useMemo(() => (data ?? []).sort((a, b) => a.date.localeCompare(b.date)), [data])

  if (isLoading) return <div className="h-56 animate-pulse bg-gray-50 rounded-lg" />
  if (!rows?.length) return <EmptyState />

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickMargin={8} />
          <YAxis yAxisId="left" tickMargin={8} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="weight_kg" name="체중(kg)" strokeWidth={1.5} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="weight_ma7" name="체중(7d MA)" strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
