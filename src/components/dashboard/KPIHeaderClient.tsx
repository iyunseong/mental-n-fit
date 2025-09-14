'use client'

import useSWR from 'swr'
import { Utensils, Activity, Bed, Scale } from 'lucide-react'
import { swrKeys } from '@/lib/swrKeys'
import { getRange } from '@/lib/date/getRange'
import React from 'react'

type Props = {
  from?: Date | string
  to?: Date | string
}

type KPIResponse = {
  kcal7d: number | null
  volume7d: number | null
  sleep7d: number | null
  weightDelta7d: number | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

const ensureISO = (d?: Date | string): string => {
  if (!d) return ''
  if (typeof d === 'string') return d.slice(0, 10)
  // YYYY-MM-DD in local TZ
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10)
}

const Skeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="h-4 w-24 bg-gray-100 animate-pulse rounded mb-3" />
        <div className="h-6 w-16 bg-gray-100 animate-pulse rounded" />
      </div>
    ))}
  </div>
)

export default function KPIHeaderClient({ from, to }: Props) {
  // 기본값: 최근 30일 (서버에서 from/to를 안 넘긴 경우)
  const fallback = getRange(30, 'Asia/Seoul')
  const fromISO = ensureISO(from) || fallback.fromISO
  const toISO = ensureISO(to) || fallback.toISO

  const key = swrKeys.kpi(fromISO, toISO)
  const { data, error, isLoading } = useSWR<KPIResponse>(
    key,
    () => fetcher(`/api/kpi?from=${fromISO}&to=${toISO}`),
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  if (isLoading) return <Skeleton />

  const fmt0 = (v: number | null | undefined) =>
    v == null || Number.isNaN(v) ? '—' : Math.round(v).toString()

  const fmt1 = (v: number | null | undefined) =>
    v == null || Number.isNaN(v) ? '—' : (Math.round(v * 10) / 10).toString()

  const deltaBadge = (v: number | null | undefined) => {
    if (v == null || Number.isNaN(v)) return <span className="text-gray-400">—</span>
    const sign = v > 0 ? '+' : ''
    const color = v > 0 ? 'text-rose-600' : v < 0 ? 'text-emerald-600' : 'text-gray-600'
    return <span className={`text-xs ${color}`}>{sign}{fmt1(v)} kg</span>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <Utensils className="w-4 h-4" />
          최근 7일 평균 칼로리
        </div>
        <div className="text-2xl font-semibold">{fmt0(data?.kcal7d)} kcal</div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <Activity className="w-4 h-4" />
          최근 7일 근력 볼륨 MA
        </div>
        <div className="text-2xl font-semibold">{fmt0(data?.volume7d)}</div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <Bed className="w-4 h-4" />
          최근 7일 수면 MA
        </div>
        <div className="text-2xl font-semibold">{fmt0(data?.sleep7d)} 분</div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <Scale className="w-4 h-4" />
          체중 MA Δ
        </div>
        <div className="text-2xl font-semibold flex items-baseline gap-2">
          {deltaBadge(data?.weightDelta7d)}
        </div>
      </div>
    </div>
  )
}
