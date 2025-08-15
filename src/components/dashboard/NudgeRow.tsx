"use client"
import React, { useCallback, useEffect, useState } from 'react'
import NudgeCard from './NudgeCard'

type Mission = {
  id: string
  code: string
  title: string
  detail?: string | null
  status: 'pending' | 'done' | 'expired'
}

export default function NudgeRow() {
  const [dateISO, setDateISO] = useState<string>('')
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [executingId, setExecutingId] = useState<string>('')

  useEffect(() => {
    const d = new Date()
    const localISO = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)
    setDateISO(localISO)
  }, [])

  const fetchMissions = useCallback(async (date: string) => {
    if (!date) return
    const ctrl = new AbortController()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/missions?date=${encodeURIComponent(date)}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error('미션 조회 실패')
      const data = await res.json()
      setMissions(Array.isArray(data) ? data : [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : '오류가 발생했습니다'
      setError(msg)
    } finally {
      setLoading(false)
    }
    return () => ctrl.abort()
  }, [])

  useEffect(() => {
    if (dateISO) fetchMissions(dateISO)
  }, [dateISO, fetchMissions])

  const handlePrimary = async (mission: Mission) => {
    if (mission.status !== 'pending') return
    try {
      setExecutingId(mission.id)
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: mission.id, action: 'execute' }),
      })
      if (!res.ok) throw new Error('미션 실행 실패')
      if (dateISO) fetchMissions(dateISO)
    } catch (e) {
      console.error(e)
    } finally {
      setExecutingId('')
    }
  }

  if (loading) return <div className="text-sm text-gray-500">미션 불러오는 중…</div>
  if (error) return <div className="text-sm text-red-600">{error}</div>
  if (!missions?.length) {
    return <div className="text-sm text-gray-500">오늘은 표시할 미션이 없어요.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {missions.map((m) => (
        <NudgeCard
          key={m.id}
          title={m.title}
          detail={m.detail || undefined}
          primaryLabel={m.status === 'pending' ? '실행' : m.status === 'done' ? '완료됨' : '만료'}
          onPrimary={() => handlePrimary(m)}
          isLoading={executingId === m.id}
          disabled={m.status !== 'pending'}
          variant={m.status === 'pending' ? 'info' : m.status === 'done' ? 'success' : 'warning'}
        />
      ))}
    </div>
  )
}


