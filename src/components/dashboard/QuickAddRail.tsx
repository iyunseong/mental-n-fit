"use client"
import React, { useCallback, useEffect, useState } from 'react'

type Preset = {
  id: string
  kind: 'meal' | 'workout' | 'condition' | 'body'
  payload: any
}

export default function QuickAddRail({ dateISO }: { dateISO: string }) {
  const [presets, setPresets] = useState<Record<Preset['kind'], Preset[]>>({
    meal: [],
    workout: [],
    condition: [],
    body: [],
  })

  const fetchKind = useCallback(async (kind: Preset['kind']) => {
    try {
      const res = await fetch(`/api/recent?kind=${kind}`)
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data.slice(0, 6) : []
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      const [meal, workout, condition, body] = await Promise.all([
        fetchKind('meal'),
        fetchKind('workout'),
        fetchKind('condition'),
        fetchKind('body'),
      ])
      setPresets({ meal, workout, condition, body })
    })()
  }, [fetchKind])

  const postLog = async (kind: Preset['kind'], p: Preset) => {
    try {
      await fetch('/api/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateISO, kind, payload: p.payload }),
      })
      // afterLogSave placeholder (no-op for now)
    } catch (e) {
      console.error(e)
    }
  }

  const Section = ({ kind, title }: { kind: Preset['kind']; title: string }) => {
    const list = presets[kind] || []
    if (!list.length) return null
    return (
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">{title}</div>
        <div className="flex flex-wrap gap-2">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => postLog(kind, p)}
              className="px-2.5 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200 text-gray-800"
              title={typeof p.payload?.name === 'string' ? p.payload.name : undefined}
            >
              {p.payload?.name || p.payload?.exercise || p.payload?.title || '빠른 추가'}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-gray-200 p-3 bg-white">
      <div className="text-sm font-semibold text-gray-800 mb-3">빠른 추가</div>
      <div className="space-y-3">
        <Section kind="meal" title="식사" />
        <Section kind="workout" title="운동" />
        <Section kind="condition" title="컨디션" />
        <Section kind="body" title="체성분" />
      </div>
    </div>
  )
}


