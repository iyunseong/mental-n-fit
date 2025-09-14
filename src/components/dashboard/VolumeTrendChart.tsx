'use client'

import React, { useMemo } from 'react'
import useSWR from 'swr'
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { swrKeys } from '@/lib/swrKeys'
import { getRange } from '@/lib/date/getRange'

type Props = {
  refreshTrigger?: number
  from?: Date | string
  to?: Date | string
}

type Row = {
  date: string
  volume: number | null
  volume_ma7: number | null
  cardio_min: number | null
  cardio_min_ma7: number | null
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
    데이터가 없습니다. 운동 세트 또는 유산소 시간을 기록해 보세요.
  </div>
)

export default function VolumeTrendChart({ refreshTrigger = 0, from, to }: Props) {
  const fallback = getRange(30, 'Asia/Seoul')
  const fromISO = ensureISO(from) || fallback.fromISO
  const toISO = ensureISO(to) || fallback.toISO

  const key = [...swrKeys.trend('workout', fromISO, toISO), String(refreshTrigger)] as const
  const { data, error, isLoading } = useSWR<Row[]>(
    key,
    () => fetcher(`/api/trend/workout?from=${fromISO}&to=${toISO}`),
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  const rows = useMemo(() => (data ?? []).sort((a, b) => a.date.localeCompare(b.date)), [data])

  if (isLoading) return <div className="h-56 animate-pulse bg-gray-50 rounded-lg" />
  if (!rows?.length) return <EmptyState />

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickMargin={8} />
          <YAxis yAxisId="left" tickMargin={8} />
          <YAxis yAxisId="right" orientation="right" tickMargin={8} />
          <Tooltip />
          <Legend />
          {/* 일별 근력 볼륨 막대 */}
          <Bar yAxisId="left" dataKey="volume" name="볼륨(일별)" />
          {/* 7일 이동평균 라인 */}
          <Line yAxisId="left" type="monotone" dataKey="volume_ma7" name="볼륨(7d MA)" strokeWidth={2.2} dot={false} />
          {/* 유산소 분(선택) */}
          <Line yAxisId="right" type="monotone" dataKey="cardio_min" name="유산소(분)" strokeWidth={1.2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="cardio_min_ma7" name="유산소(7d MA)" strokeWidth={1.8} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
