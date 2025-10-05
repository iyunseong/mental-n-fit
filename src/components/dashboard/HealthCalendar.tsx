"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { supabase, auth } from '@/lib/supabase'
import { toDateKey } from '@/lib/date/toLocalDateISO'
import { useRouter } from 'next/navigation'

type Props = {
  /** 선택 시 외부 사이드바 등 갱신용 콜백(선택) */
  onDateSelect?: (dateISO: string) => void
  /** 컴팩트 모드(카드 내부 작은 캘린더) */
  compact?: boolean
}

type DayBadge = {
  hasWorkout?: boolean
  hasMeal?: boolean
  hasInbody?: boolean
  hasCondition?: boolean
}

const HealthCalendar: React.FC<Props> = ({ onDateSelect, compact = false }) => {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dayBadges, setDayBadges] = useState<Record<string, DayBadge>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [legendOpen, setLegendOpen] = useState(true)

  const fetchMonth = useCallback(async (date: Date) => {
    try {
      if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1') {
        setDayBadges({})
        return
      }
      setIsLoading(true)
      setError('')

      const u = await auth.getCurrentUser()
      if (!u) throw new Error('로그인이 필요합니다.')

      // 월의 1일 ~ 말일(로컬) 범위
      const y = date.getFullYear()
      const m = date.getMonth()
      const firstKey = toDateKey(new Date(y, m, 1))
      const lastKey  = toDateKey(new Date(y, m + 1, 0))

      // 뷰에서 user_id = auth.uid() 필터가 이미 있다면 eq는 생략 가능
      const qWorkout = supabase.from('vw_workout_trend')
        .select('date').gte('date', firstKey).lte('date', lastKey)
      const qMeal = supabase.from('vw_meal_trend')
        .select('date').gte('date', firstKey).lte('date', lastKey)
      const qInbody = supabase.from('vw_inbody_trend')
        .select('date').gte('date', firstKey).lte('date', lastKey)
      const qCondition = supabase.from('vw_daily_conditions_trend')
        .select('date').gte('date', firstKey).lte('date', lastKey)

      const [{ data: w, error: we },
             { data: mdata, error: me },
             { data: i, error: ie },
             { data: c, error: ce }] = await Promise.all([qWorkout, qMeal, qInbody, qCondition])

      if (we) throw we; if (me) throw me; if (ie) throw ie; if (ce) throw ce

      const badges: Record<string, DayBadge> = {}
      ;(w ?? []).forEach((r: any) => { const k = r.date as string; badges[k] = { ...(badges[k]||{}), hasWorkout:   true }})
      ;(mdata ?? []).forEach((r: any) => { const k = r.date as string; badges[k] = { ...(badges[k]||{}), hasMeal:     true }})
      ;(i ?? []).forEach((r: any) => { const k = r.date as string; badges[k] = { ...(badges[k]||{}), hasInbody:   true }})
      ;(c ?? []).forEach((r: any) => { const k = r.date as string; badges[k] = { ...(badges[k]||{}), hasCondition:true }})

      setDayBadges(badges)
    } catch (err: any) {
      setError(err?.message ?? '달력 데이터를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonth(selectedDate)
  }, [selectedDate, fetchMonth])

  const onActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date }) => {
    if (activeStartDate) fetchMonth(activeStartDate)
  }

  type ValuePiece = Date | null
  type CalendarValue = ValuePiece | [ValuePiece, ValuePiece]
  const handleDateChange = (value: CalendarValue) => {
    const date = Array.isArray(value) ? value[0] : value
    if (!date) return
    setSelectedDate(date)

    const key = toDateKey(date)
    // 외부 콜백(사이드바 등)도 유지
    if (typeof onDateSelect === 'function') onDateSelect(key)
    // ✅ 상세 페이지로 이동
    router.push(`/records/${key}`)
  }

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    const key = toDateKey(date)
    const b = dayBadges[key]
    if (!b) return null
    return (
      <div className="mt-1 flex items-center justify-center gap-1">
        {b.hasWorkout   && <span title="운동"    className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-indigo-500 inline-block`} />}
        {b.hasMeal      && <span title="식단"    className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-emerald-500 inline-block`} />}
        {b.hasInbody    && <span title="인바디"  className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-amber-500 inline-block`} />}
        {b.hasCondition && <span title="컨디션"  className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-sky-500 inline-block`} />}
      </div>
    )
  }

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return undefined
    const key = toDateKey(date)
    const classes: string[] = []
    if (dayBadges[key]) classes.push('rc-has-data')
    return classes.join(' ')
  }

  return (
    <div className={`${compact ? 'p-4' : 'max-w-4xl mx-auto p-6'} bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800`}>
      {/* 범례 + 토글 */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">범례</h2>
        <button
          type="button"
          onClick={() => setLegendOpen((v) => !v)}
          className="px-2 py-1 text-xs border rounded-md hover:bg-gray-50"
        >
          {legendOpen ? '범례 숨기기' : '범례 보기'}
        </button>
      </div>

      {legendOpen && (
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />운동 기록</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />식단 기록</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />인바디 기록</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />컨디션 기록</div>
        </div>
      )}

      {error && (
        <div className={`${compact ? 'mb-4 p-3' : 'mb-6 p-4'} bg-red-50 border border-red-200 rounded-lg`}>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className={`${compact ? 'mb-4' : 'mb-6'} text-center`}>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      )}

      <div className="mb-2">
        <Calendar
          onChange={handleDateChange}
          onActiveStartDateChange={onActiveStartDateChange as any}
          value={selectedDate}
          tileContent={getTileContent as any}
          tileClassName={getTileClassName as any}
          locale="ko-KR"
          formatDay={(locale, date) => date.getDate().toString()}
          showNeighboringMonth={false}
          className="w-full border-none"
        />
      </div>

      <style jsx>{`
        :global(.react-calendar) { border: none !important; font-family: inherit; width: 100% !important; margin: 0 auto; display: block; }
        :global(.react-calendar__viewContainer), :global(.react-calendar__month-view) { width: 100% !important; }
        :global(.react-calendar__tile) { position: relative; height: ${compact ? '72px' : '92px'}; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 6px 4px; border-radius: 10px; cursor: pointer; }
        :global(.react-calendar__tile:enabled:hover), :global(.react-calendar__tile:enabled:focus) { background-color: #f1f5f9; }
        /* 선택(파란) 배경 제거 */
        :global(.react-calendar__tile--active) { background: transparent !important; color: inherit !important; }
        /* 오늘=노란색 강조 (내일은 표시 없음) */
        :global(.react-calendar__tile--now) { background-color: #FEF3C7 !important; box-shadow: inset 0 0 0 2px #F59E0B; }
        :global(.rc-has-data) { background-color: ${compact ? '#f8fafc' : '#f8fafc'}; box-shadow: inset 0 0 0 1px #e5e7eb; }
        :global(.rc-has-data:hover) { background-color: #eef2ff; }
        :global(.react-calendar__month-view__weekdays) { text-transform: none; font-weight: bold; font-size: ${compact ? '0.75rem' : '0.875rem'}; }
        :global(.react-calendar__navigation) { margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; }
        :global(.react-calendar__navigation button) { font-size: ${compact ? '0.875rem' : '1rem'}; color: #374151; }
        :global(.react-calendar__navigation button:enabled:hover), :global(.react-calendar__navigation button:enabled:focus) { background: #f3f4f6; border-radius: 8px; }
      `}</style>
    </div>
  )
}

export default HealthCalendar
