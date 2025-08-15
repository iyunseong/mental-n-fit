"use client"
import React, { useCallback, useEffect, useState } from 'react'

type PayloadMap = {
  meal: { name: string; calories?: number }
  workout: { exercise: string; reps?: number; weight_kg?: number }
  condition: { title: string }
  body: { title: string }
}

type Kind = keyof PayloadMap

type Preset =
  | { id: string; kind: 'meal'; payload: PayloadMap['meal'] }
  | { id: string; kind: 'workout'; payload: PayloadMap['workout'] }
  | { id: string; kind: 'condition'; payload: PayloadMap['condition'] }
  | { id: string; kind: 'body'; payload: PayloadMap['body'] }

type PresetByKind<K extends Kind> = Extract<Preset, { kind: K }>

type PresetsState = { [K in Kind]: PresetByKind<K>[] }

export default function QuickAddRail({ dateISO }: { dateISO: string }) {
  const [presets, setPresets] = useState<PresetsState>({
    meal: [],
    workout: [],
    condition: [],
    body: [],
  })
  const [error, setError] = useState<string>("")

  const fetchKind = useCallback(async <K extends Kind>(kind: K, signal?: AbortSignal): Promise<PresetByKind<K>[]> => {
    try {
      const res = await fetch(`/api/recent?kind=${kind}` as const, { signal })
      if (!res.ok) return []
      const data = await res.json()
      return (Array.isArray(data) ? data.slice(0, 6) : []) as PresetByKind<K>[]
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return []
      return []
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const [meal, workout, condition, body] = await Promise.all([
          fetchKind('meal', ac.signal),
          fetchKind('workout', ac.signal),
          fetchKind('condition', ac.signal),
          fetchKind('body', ac.signal),
        ])
        if (!ac.signal.aborted) setPresets({ meal, workout, condition, body })
      } catch {
        if (!ac.signal.aborted) setError('빠른 추가 프리셋을 불러오지 못했습니다.')
      }
    })()
    return () => ac.abort()
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

  function getLabel(p: Preset): string {
    switch (p.kind) {
      case 'meal':
        return p.payload.name
      case 'workout':
        return p.payload.exercise
      case 'condition':
      case 'body':
        return p.payload.title
      default:
        return '빠른 추가'
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
              type="button"
              onClick={() => postLog(kind, p)}
              className="px-2.5 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              title={getLabel(p)}
            >
              {getLabel(p)}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-gray-200 p-3 bg-white">
      <div className="text-sm font-semibold text-gray-800 mb-3">빠른 추가</div>
      {error && (
        <div className="mb-2 text-xs text-red-600">{error}</div>
      )}
      {presets.meal.length + presets.workout.length + presets.condition.length + presets.body.length === 0 ? (
        <div className="text-xs text-gray-500">최근 프리셋이 없습니다.</div>
      ) : (
      <div className="space-y-3">
        <Section kind="meal" title="식사" />
        <Section kind="workout" title="운동" />
        <Section kind="condition" title="컨디션" />
        <Section kind="body" title="체성분" />
      </div>
      )}
    </div>
  )
}


