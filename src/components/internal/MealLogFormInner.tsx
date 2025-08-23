"use client"
import React, { useState } from 'react'

type Props = {
  onDataSaved?: () => void
  selectedDate?: string
  onSave?: () => void
  onCancel?: () => void
}

export default function MealLogFormInner({ onDataSaved, selectedDate, onSave, onCancel }: Props){
  const [logDate, setLogDate] = useState<string>(selectedDate ?? new Date().toISOString().slice(0,10))
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (onDataSaved) onDataSaved()
      if (onSave) onSave()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
        <input
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div className="flex gap-2 justify-end">
        {typeof onCancel === 'function' && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border text-gray-700">취소</button>
        )}
        <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-md bg-orange-500 text-white disabled:bg-gray-400">
          {isSaving ? '저장 중...' : '식사 기록 저장'}
        </button>
      </div>
    </form>
  )
}


