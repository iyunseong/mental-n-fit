// src/components/dashboard/HealthCalendar.tsx
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

const HealthCalendar: React.FC<Props> = ({ onDateSelect = undefined, compact = false }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  interface MoodRecord {
    log_date: string
    overall_mood: 'great' | 'good' | 'normal' | 'bad' | 'awful'
    fatigue_level: 'low' | 'medium' | 'high'
    sleep_quality: 'good' | 'normal' | 'bad'
    diary_entry?: string | null
  }
  const [monthlyMoods, setMonthlyMoods] = useState<Record<string, MoodRecord>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [legendOpen, setLegendOpen] = useState(!compact)

  const moodEmojis: Record<string, string> = {
    great: '🤩',
    good: '😊',
    normal: '😐',
    bad: '😔',
    awful: '😵'
  }

  const fatigueColors: Record<string, string> = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444'
  }

  const sleepColors: Record<string, string> = {
    good: '#3B82F6',
    normal: '#6B7280',
    bad: '#8B5CF6'
  }

  const fetchMonthlyMoods = useCallback(async (date: Date) => {
    try {
      if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1') {
        setMonthlyMoods({})
        return
      }
      setIsLoading(true)
      setError('')

      const currentUser = await auth.getCurrentUser()
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.')
      }

      const year = date.getFullYear()
      const month = date.getMonth()
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]

      const { data, error: fetchError } = await supabase
        .from('daily_conditions')
        .select('log_date, overall_mood, fatigue_level, sleep_quality, diary_entry')
        .eq('user_id', currentUser.id)
        .gte('log_date', firstDay)
        .lte('log_date', lastDay)

      if (fetchError) throw fetchError

      const moodMap: Record<string, MoodRecord> = {}
      data?.forEach((record: any) => {
        moodMap[record.log_date] = record
      })
      setMonthlyMoods(moodMap)
    } catch (err: any) {
      const msg = err && typeof err === 'object' && 'message' in err ? err.message : JSON.stringify(err || {})
      console.warn('월별 컨디션 데이터 가져오기 오류:', msg)
      setError(msg || '데이터를 가져오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonthlyMoods(selectedDate)
  }, [selectedDate, fetchMonthlyMoods])

  const onActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date }) => {
    if (activeStartDate) fetchMonthlyMoods(activeStartDate)
  }

  const loggedDaysCount = useMemo(() => Object.keys(monthlyMoods || {}).length, [monthlyMoods])

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

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    const dateString = date.toISOString().split('T')[0]
    const moodData = monthlyMoods[dateString]
    if (!moodData) return null
    const moodEmoji = moodEmojis[moodData.overall_mood]
    const hasDiary = moodData.diary_entry && moodData.diary_entry.trim().length > 0
    return (
      <div className="flex flex-col items-center justify-center">
        <span className={`${compact ? 'text-base' : 'text-lg'}`}>{moodEmoji}</span>
        <div className="flex items-center space-x-1 mt-0.5">
          <div 
            className={`${compact ? 'w-1 h-1' : 'w-2 h-2'} rounded-full`}
            style={{ backgroundColor: fatigueColors[moodData.fatigue_level] }}
          />
          <div 
            className={`${compact ? 'w-1 h-1' : 'w-2 h-2'} rounded-full`}
            style={{ backgroundColor: sleepColors[moodData.sleep_quality] }}
          />
          {hasDiary && (
            <div className={`${compact ? 'text-xs' : 'text-xs'}`}>📖</div>
          )}
        </div>
      </div>
    )
  }

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return undefined
    const dateString = date.toISOString().split('T')[0]
    const moodData = monthlyMoods[dateString]
    const classes: string[] = []
    if (moodData) classes.push('rc-has-data')
    if (dateString === new Date().toISOString().split('T')[0]) classes.push('rc-today')
    return classes.join(' ')
  }

  const selectedDateString = selectedDate.toISOString().split('T')[0]
  const moodData = monthlyMoods[selectedDateString]
  const hasDiary = moodData?.diary_entry && moodData.diary_entry.trim().length > 0

  return (
    <div className={`${compact ? 'p-4' : 'max-w-4xl mx-auto p-6'} bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800`}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">건강 캘린더</h2>
            <p className="text-sm text-gray-600">날짜를 클릭하여 해당 날의 상세 기록을 확인하세요</p>
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
          <h3 className="text-sm font-medium text-gray-700 mb-2">📖 범례</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <h4 className="font-medium text-gray-600 mb-1">기분</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2"><span>🤩</span><span>최고</span></div>
                <div className="flex items-center space-x-2"><span>😊</span><span>좋음</span></div>
                <div className="flex items-center space-x-2"><span>😐</span><span>보통</span></div>
                <div className="flex items-center space-x-2"><span>😔</span><span>나쁨</span></div>
                <div className="flex items-center space-x-2"><span>😵</span><span>최악</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-600 mb-1">피로도</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>낮음</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span>보통</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>높음</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-600 mb-1">수면의 질</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>좋음</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-gray-500"></div><span>보통</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span>나쁨</span></div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">일기</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2"><span>📖</span><span>일기 있음</span></div>
              </div>
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
          {moodData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl mb-1">{moodEmojis[moodData.overall_mood]}</div>
                  <div className="font-medium">기분: {
                    moodData.overall_mood === 'great' ? '최고' :
                    moodData.overall_mood === 'good' ? '좋음' :
                    moodData.overall_mood === 'normal' ? '보통' :
                    moodData.overall_mood === 'bad' ? '나쁨' : '최악'
                  }</div>
                </div>
                <div className="text-center">
                  <div 
                    className="w-6 h-6 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: fatigueColors[moodData.fatigue_level] }}
                  />
                  <div className="font-medium">피로도: {
                    moodData.fatigue_level === 'low' ? '낮음' :
                    moodData.fatigue_level === 'medium' ? '보통' : '높음'
                  }</div>
                </div>
                <div className="text-center">
                  <div 
                    className="w-6 h-6 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: sleepColors[moodData.sleep_quality] }}
                  />
                  <div className="font-medium">수면의 질: {
                    moodData.sleep_quality === 'good' ? '좋음' :
                    moodData.sleep_quality === 'normal' ? '보통' : '나쁨'
                  }</div>
                </div>
              </div>
              {hasDiary && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">📖</span>
                    <h4 className="font-medium text-amber-800">오늘의 일기</h4>
                  </div>
                  <p className="text-amber-700 leading-relaxed whitespace-pre-wrap">
                    {moodData.diary_entry}
                  </p>
                </div>
              )}
              <div className="mt-4">
                <p className="text-blue-700 text-sm">💡 이 날의 모든 건강 기록(운동, 식사, 인바디 등)을 보려면 날짜를 클릭하세요.</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>이 날의 컨디션 기록이 없습니다.</p>
              <p className="text-sm mt-1">컨디션 기록 탭에서 기록을 추가해보세요.</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        :global(.react-calendar) { border: none !important; font-family: inherit; width: 100% !important; margin: 0 auto; display: block; }
        :global(.react-calendar__viewContainer), :global(.react-calendar__month-view) { width: 100% !important; }
        :global(.react-calendar__tile) { position: relative; height: ${compact ? '72px' : '92px'}; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 6px 4px; border-radius: 10px; }
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


