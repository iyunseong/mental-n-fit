"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { supabase, auth } from '@/lib/supabase'

type Props = {
  onDateSelect?: (dateISO: string) => void
  compact?: boolean
  from?: Date|string
  to?: Date|string
}

/**
 * 변경 요약
 * - 과거 DailyCondition(기분/피로도/수면) 시각화 제거
 * - 날짜 셀에 "기록 존재 여부"만 4색 점으로 표기 (Condition/Workout/Meal/InBody)
 * - 월 단위로 4개 테이블의 존재 여부만 병렬 조회 (경량)
 * - 선택한 날짜 영역에서도 간략히 “있음/없음”만 표기
 */
const HealthCalendar: React.FC<Props> = ({ onDateSelect = undefined, compact = false }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // 날짜별 존재 여부 맵
  type BoolMap = Record<string, true>
  const [conditionDays, setConditionDays] = useState<BoolMap>({})
  const [workoutDays, setWorkoutDays] = useState<BoolMap>({})
  const [mealDays, setMealDays] = useState<BoolMap>({})
  const [inbodyDays, setInbodyDays] = useState<BoolMap>({})

  // 상태
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [legendOpen, setLegendOpen] = useState(!compact)

  // 색상 매핑
  const presenceColors = {
    condition: '#0EA5E9', // sky-500
    workout:   '#10B981', // emerald-500
    meal:      '#F59E0B', // amber-500
    inbody:    '#8B5CF6', // violet-500
  }

  // 월 범위 데이터 병렬 조회 (존재 여부만)
  const fetchMonthlyPresence = useCallback(async (date: Date) => {
    try {
      if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1') {
        setConditionDays({})
        setWorkoutDays({})
        setMealDays({})
        setInbodyDays({})
        return
      }
      setIsLoading(true)
      setError('')

      const currentUser = await auth.getCurrentUser()
      if (!currentUser) throw new Error('로그인이 필요합니다.')

      const year = date.getFullYear()
      const month = date.getMonth()
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
      const lastDay  = new Date(year, month + 1, 0).toISOString().split('T')[0]

      const [condRes, wRes, mRes, bRes] = await Promise.all([
        supabase.from('daily_conditions')
          .select('log_date')
          .eq('user_id', currentUser.id)
          .gte('log_date', firstDay)
          .lte('log_date', lastDay),
        supabase.from('workout_sessions')
          .select('date')
          .eq('user_id', currentUser.id)
          .gte('date', firstDay)
          .lte('date', lastDay),
        supabase.from('meal_events')
          .select('date')
          .eq('user_id', currentUser.id)
          .gte('date', firstDay)
          .lte('date', lastDay),
        supabase.from('inbody_logs')
          .select('log_date')
          .eq('user_id', currentUser.id)
          .gte('log_date', firstDay)
          .lte('log_date', lastDay),
      ])

      const err = condRes.error || wRes.error || mRes.error || bRes.error
      if (err) throw err

      const cMap: BoolMap = {}
      const wMap: BoolMap = {}
      const mMap: BoolMap = {}
      const bMap: BoolMap = {}

      ;(condRes.data ?? []).forEach((r: any) => { if (r?.log_date) cMap[r.log_date] = true })
      ;(wRes.data ?? []).forEach((r: any) =>   { if (r?.date)     wMap[r.date]     = true })
      ;(mRes.data ?? []).forEach((r: any) =>   { if (r?.date)     mMap[r.date]     = true })
      ;(bRes.data ?? []).forEach((r: any) =>   { if (r?.log_date) bMap[r.log_date] = true })

      setConditionDays(cMap)
      setWorkoutDays(wMap)
      setMealDays(mMap)
      setInbodyDays(bMap)

    } catch (err: any) {
      const msg = err?.message ?? JSON.stringify(err || {})
      console.warn('월별 존재 여부 조회 오류:', msg)
      setError(msg || '데이터를 가져오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 최초 및 선택 월 변경 시 로드
  useEffect(() => {
    fetchMonthlyPresence(selectedDate)
  }, [selectedDate, fetchMonthlyPresence])

  // 달 전환 시 재조회
  const onActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date }) => {
    if (activeStartDate) fetchMonthlyPresence(activeStartDate)
  }

  // "기록된 날" 간단 카운트 (4종 중 하나라도 있으면 기록된 날)
  const loggedDaysCount = useMemo(() => {
    const days = new Set<string>()
    Object.keys(conditionDays).forEach(d => days.add(d))
    Object.keys(workoutDays).forEach(d => days.add(d))
    Object.keys(mealDays).forEach(d => days.add(d))
    Object.keys(inbodyDays).forEach(d => days.add(d))
    return days.size
  }, [conditionDays, workoutDays, mealDays, inbodyDays])

  // 날짜 선택
  type ValuePiece = Date | null
  type CalendarValue = ValuePiece | [ValuePiece, ValuePiece]
  const handleDateChange = (value: CalendarValue) => {
    const date = Array.isArray(value) ? value[0] : value
    if (!date) return
    setSelectedDate(date)
    if (typeof onDateSelect === 'function') {
      onDateSelect(date.toISOString().split('T')[0])
    }
  }

  // 타일 컨텐츠: 4색 점만 렌더
  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    const dateString = date.toISOString().split('T')[0]

    const hasCondition = !!conditionDays[dateString]
    const hasWorkout   = !!workoutDays[dateString]
    const hasMeal      = !!mealDays[dateString]
    const hasInbody    = !!inbodyDays[dateString]

    return (
      <div className="flex flex-col items-center justify-center">
        {/* 날짜 숫자는 formatDay로 렌더됨 → 공간 맞춤용 빈 줄 */}
        <div className="h-4" />
        {/* 기록 존재 점 */}
        <div className="flex items-center gap-1 mt-1" aria-label="기록 존재 여부">
          <span
            className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full ${hasCondition ? '' : 'opacity-20'}`}
            style={{ backgroundColor: presenceColors.condition }}
            title="컨디션 기록"
          />
          <span
            className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full ${hasWorkout ? '' : 'opacity-20'}`}
            style={{ backgroundColor: presenceColors.workout }}
            title="운동 기록"
          />
          <span
            className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full ${hasMeal ? '' : 'opacity-20'}`}
            style={{ backgroundColor: presenceColors.meal }}
            title="식단 기록"
          />
          <span
            className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full ${hasInbody ? '' : 'opacity-20'}`}
            style={{ backgroundColor: presenceColors.inbody }}
            title="인바디 기록"
          />
        </div>
      </div>
    )
  }

  // 오늘/데이터 여부 클래스 (배경 살짝)
  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return undefined
    const dateString = date.toISOString().split('T')[0]
    const hasAny = !!conditionDays[dateString] || !!workoutDays[dateString] || !!mealDays[dateString] || !!inbodyDays[dateString]
    const classes: string[] = []
    if (hasAny) classes.push('rc-has-data')
    if (dateString === new Date().toISOString().split('T')[0]) classes.push('rc-today')
    return classes.join(' ')
  }

  const selectedDateString = selectedDate.toISOString().split('T')[0]
  const hasC = !!conditionDays[selectedDateString]
  const hasW = !!workoutDays[selectedDateString]
  const hasM = !!mealDays[selectedDateString]
  const hasB = !!inbodyDays[selectedDateString]

  return (
    <div className={`${compact ? 'p-4' : 'max-w-4xl mx-auto p-6'} bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800`}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">건강 캘린더</h2>
            <p className="text-sm text-gray-600">날짜를 클릭하면 해당 날의 기록을 확인/편집할 수 있어요.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">기록된 날: <strong className="text-gray-700">{loggedDaysCount}</strong></span>
            <button
              type="button"
              onClick={() => setLegendOpen(!legendOpen)}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              {legendOpen ? '범례 숨기기' : '범례 보기'}
            </button>
          </div>
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

      {!compact && legendOpen && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">📌 기록 존재 표시</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: presenceColors.condition }}></div>
              <span>컨디션</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: presenceColors.workout }}></div>
              <span>운동</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: presenceColors.meal }}></div>
              <span>식단</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: presenceColors.inbody }}></div>
              <span>인바디</span>
            </div>
          </div>
        </div>
      )}

      <div className={`mb-4`}>
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

      {!compact && selectedDate && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-3">
            {selectedDate.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </h3>

          {/* 선택 날짜 간단 요약 (존재 여부만) */}
          <div className="mb-1 text-sm text-blue-900 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: presenceColors.condition }} />
              <span>컨디션 {hasC ? '있음' : '없음'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: presenceColors.workout }} />
              <span>운동 {hasW ? '있음' : '없음'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: presenceColors.meal }} />
              <span>식단 {hasM ? '있음' : '없음'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: presenceColors.inbody }} />
              <span>인바디 {hasB ? '있음' : '없음'}</span>
            </div>
          </div>

          <div className="text-xs text-blue-700">
            💡 날짜를 클릭하면 해당 날의 기록을 우측 패널에서 확인/편집할 수 있어요.
          </div>
        </div>
      )}

      {/* 스타일 */}
      <style jsx>{`
        :global(.react-calendar) { border: none !important; font-family: inherit; width: 100% !important; margin: 0 auto; display: block; }
        :global(.react-calendar__viewContainer), :global(.react-calendar__month-view) { width: 100% !important; }
        :global(.react-calendar__tile) {
          position: relative;
          height: ${compact ? '76px' : '104px'};
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          padding: 6px 4px; border-radius: 10px;
        }
        :global(.react-calendar__tile:enabled:hover), :global(.react-calendar__tile:enabled:focus) { background-color: #f1f5f9; }
        :global(.react-calendar__tile--active) { background-color: #0ea5e9 !important; color: white !important; }
        :global(.react-calendar__tile--now) { background-color: #fef3c7; }
        :global(.rc-has-data) { background-color: ${compact ? '#f8fafc' : '#f8fafc'}; box-shadow: inset 0 0 0 1px #e5e7eb; }
        :global(.rc-has-data:hover) { background-color: #eef2ff; }
        :global(.rc-today) { box-shadow: inset 0 0 0 2px #93c5fd; }
        :global(.react-calendar__month-view__weekdays) { text-transform: none; font-weight: bold; font-size: ${compact ? '0.75rem' : '0.875rem'}; }
        :global(.react-calendar__navigation) { margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; }
        :global(.react-calendar__navigation button) { font-size: ${compact ? '0.875rem' : '1rem'}; color: #374151; }
        :global(.react-calendar__navigation button:enabled:hover), :global(.react-calendar__navigation button:enabled:focus) { background: #f3f4f6; border-radius: 8px; }
      `}</style>
    </div>
  )
}

export default HealthCalendar
