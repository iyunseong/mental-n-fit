// src/components/internal/InbodyFormInner.tsx
"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toLocalDateISO } from "@/lib/date/toLocalDateISO"

export type InbodyFormInnerProps = {
  onDataSaved?: () => void
  selectedDate?: string
  onSave?: () => void
  onCancel?: () => void
}

type InbodyRow = {
  weight_kg: number | null
  body_fat_percentage: number | null
  skeletal_muscle_mass_kg: number | null
}

export default function InbodyFormInner({
  onDataSaved,
  selectedDate,
  onSave,
  onCancel,
}: InbodyFormInnerProps) {
  // 날짜(YYYY-MM-DD)
  const [date, setDate] = useState<string>(
    selectedDate && selectedDate.length >= 10
      ? selectedDate.slice(0, 10)
      : toLocalDateISO()
  )

  // 입력값
  const [weightKg, setWeightKg] = useState<string>("")
  const [bodyFatPct, setBodyFatPct] = useState<string>("")
  const [skeletalMuscleKg, setSkeletalMuscleKg] = useState<string>("")

  // UI 상태
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [message, setMessage] = useState<string>("")

  // 숫자 문자열 → number | null
  const toNumOrNull = (v: string): number | null => {
    if (v.trim() === "") return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  // 날짜 변경 시 해당 날짜 기록 로드
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      setMessage("")
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setMessage("로그인이 필요합니다.")
          return
        }

        const { data, error } = await supabase
          .from("inbody_logs")
          .select("weight_kg, body_fat_percentage, skeletal_muscle_mass_kg")
          .eq("user_id", user.id)
          .eq("log_date", date)
          .maybeSingle<InbodyRow>()

        if (cancelled) return
        if (error) {
          setMessage("기록 조회 중 오류가 발생했습니다.")
          return
        }

        if (!data) {
          setWeightKg("")
          setBodyFatPct("")
          setSkeletalMuscleKg("")
        } else {
          setWeightKg(data.weight_kg == null ? "" : String(data.weight_kg))
          setBodyFatPct(
            data.body_fat_percentage == null ? "" : String(data.body_fat_percentage)
          )
          setSkeletalMuscleKg(
            data.skeletal_muscle_mass_kg == null ? "" : String(data.skeletal_muscle_mass_kg)
          )
        }
      } catch {
        setMessage("기록 조회 중 오류가 발생했습니다.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [date])

  // 저장: 해당 날짜 기존 레코드 삭제 → 새 레코드 삽입 (Replace)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (weightKg.trim() === "") {
      setMessage("체중을 입력해주세요.")
      return
    }

    setIsSaving(true)
    setMessage("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage("로그인이 필요합니다.")
        return
      }

      // 기존 삭제
      const { error: delErr } = await supabase
        .from("inbody_logs")
        .delete()
        .eq("user_id", user.id)
        .eq("log_date", date)
      if (delErr) {
        setMessage("기존 기록 삭제에 실패했습니다.")
        return
      }

      // 새 삽입
      const payload = {
        user_id: user.id,
        log_date: date,
        weight_kg: Number(weightKg),
        body_fat_percentage: toNumOrNull(bodyFatPct),
        skeletal_muscle_mass_kg: toNumOrNull(skeletalMuscleKg),
      }
      const { error: insErr } = await supabase.from("inbody_logs").insert(payload)
      if (insErr) {
        setMessage("새 기록 저장에 실패했습니다.")
        return
      }

      setMessage("저장되었습니다!")
      onDataSaved?.()
      onSave?.()
    } catch (err) {
      console.error("[InbodyFormInner] save error", err)
      setMessage("저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center px-4 bg-gray-50 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-6 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">인바디 기록</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              날짜를 선택하면 해당 날짜에 저장된 기록을 불러옵니다.
            </p>
          </div>

          {message && (
            <div className="mb-4 p-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-200">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 날짜 */}
            <label className="block">
              <div className="text-[11px] mb-1 text-gray-600 dark:text-gray-400">날짜 *</div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus:border-sky-400 transition dark:bg-neutral-900 dark:text-white dark:border-neutral-700"
                aria-label="기록 날짜"
              />
            </label>

            {/* 체중 */}
            <label className="block">
              <div className="text-[11px] mb-1 text-gray-600 dark:text-gray-400">체중(kg) *</div>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="예: 72.4"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus:border-sky-400 transition placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:bg-neutral-900 dark:text-white dark:border-neutral-700"
                aria-label="체중(kg)"
                required
              />
            </label>

            {/* 체지방률 */}
            <label className="block">
              <div className="text-[11px] mb-1 text-gray-600 dark:text-gray-400">체지방률(%)</div>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0}
                max={80}
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(e.target.value)}
                placeholder="예: 18.4"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus:border-sky-400 transition placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:bg-neutral-900 dark:text-white dark:border-neutral-700"
                aria-label="체지방률(%)"
              />
            </label>

            {/* 골격근량 */}
            <label className="block">
              <div className="text-[11px] mb-1 text-gray-600 dark:text-gray-400">골격근량(kg)</div>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0}
                value={skeletalMuscleKg}
                onChange={(e) => setSkeletalMuscleKg(e.target.value)}
                placeholder="예: 34.7"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus:border-sky-400 transition placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:bg-neutral-900 dark:text-white dark:border-neutral-700"
                aria-label="골격근량(kg)"
              />
            </label>

            <div className="pt-2 flex items-center justify-end gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg border text-sm text-gray-700 border-gray-300 hover:bg-gray-50 transition dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  disabled={isSaving || isLoading}
                >
                  취소
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90 disabled:opacity-50 transition dark:bg-white dark:text-black"
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
