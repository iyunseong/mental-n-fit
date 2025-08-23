"use client"
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

export type InbodyFormInnerProps = {
  onDataSaved?: () => void
  selectedDate?: string
  onSave?: () => void
  onCancel?: () => void
}

export default function InbodyFormInner({ onDataSaved, selectedDate, onSave, onCancel }: InbodyFormInnerProps) {
  const [weightKg, setWeightKg] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weightKg) {
      setMessage('체중을 입력해주세요.')
      return
    }
    setIsSaving(true)
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage('로그인이 필요합니다.')
        return
      }
      const logDate = (selectedDate && selectedDate.length >= 10)
        ? selectedDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10)

      const payload = {
        user_id: user.id,
        log_date: logDate,
        weight_kg: Number(weightKg),
      }
      const { error } = await supabase.from('inbody_logs').insert(payload)
      if (error) throw error

      setMessage('저장되었습니다!')
      setWeightKg('')
      if (onDataSaved) onDataSaved()
      if (onSave) onSave()
    } catch (err) {
      console.error('[InbodyFormInner] save error', err)
      setMessage('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className="p-2 text-sm rounded border border-gray-200 bg-gray-50 text-gray-700">{message}</div>
      )}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700 min-w-16">체중(kg)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 72.4"
        />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border text-gray-700">
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:bg-gray-400"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}


