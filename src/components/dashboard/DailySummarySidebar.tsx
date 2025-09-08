"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { supabase, auth } from '@/lib/supabase'
import { 
  Heart, 
  Weight, 
  Activity, 
  Utensils, 
  RefreshCw, 
  AlertCircle,
  Calendar 
} from 'lucide-react'

type Props = {
  selectedDate?: string
  onEditCondition?: () => void
  onEditWorkout?: () => void
  onEditMeal?: () => void
  onEditInbody?: () => void
  refreshTrigger?: number
}

const DailySummarySidebar: React.FC<Props> = ({ 
  selectedDate, 
  onEditCondition, 
  onEditWorkout, 
  onEditMeal, 
  onEditInbody,
  refreshTrigger = 0,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  type DailyCondition = {
    overall_mood: 'great' | 'good' | 'normal' | 'bad' | 'awful'
    fatigue_level: 'low' | 'medium' | 'high'
    sleep_quality: 'good' | 'normal' | 'bad'
  } | null

  type InbodyLog = {
    weight_kg?: number
    body_fat_percentage?: number
  } | null

  type WorkoutSet = { reps?: number; weight_kg?: number }
  type WorkoutLog = { exercises?: { sets?: WorkoutSet[] }[] }
  type MealItem = { meal_event_id: string }
  type MealEvent = { id: string; total_calories?: number; meal_items?: MealItem[] }

  const [conditionData, setConditionData] = useState<DailyCondition>(null)
  const [inbodyData, setInbodyData] = useState<InbodyLog>(null)
  const [workoutData, setWorkoutData] = useState<WorkoutLog[]>([])
  const [mealData, setMealData] = useState<MealEvent[]>([])

  const moodEmojis: Record<string, string> = {
    great: '🤩',
    good: '😊',
    normal: '😐',
    bad: '😔',
    awful: '😵'
  }

  const fatigueEmojis: Record<string, string> = {
    low: '⚡',
    medium: '🔋',
    high: '🪫'
  }

  const sleepEmojis: Record<string, string> = {
    good: '😴',
    normal: '😌',
    bad: '😵‍💫'
  }

  const fetchAllData = useCallback(async (date: string) => {
    if (!date || date === '') {
      return
    }
    try {
      setIsLoading(true)
      setError('')
      const currentUser = await auth.getCurrentUser()
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.')
      }

      let conditionResult: { data: DailyCondition } = { data: null }
      let inbodyResult: { data: InbodyLog } = { data: null }
      let workoutResult: { data: WorkoutLog[] } = { data: [] }
      let mealResult: { data: MealEvent[] } = { data: [] }

      try {
        const res = await supabase
          .from('daily_conditions')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('log_date', date)
          .order('created_at', { ascending: false })
          .limit(1)
        if ((res as unknown as { error?: unknown }).error) {
          conditionResult = { data: null }
        } else {
          const rows = ((res as unknown as { data?: DailyCondition[] }).data) || []
          const singleRecord = rows && rows.length > 0 ? rows[0] : null
          conditionResult = { data: singleRecord }
        }
      } catch {}

      try {
        const res = await supabase
          .from('inbody_logs')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('log_date', date)
          .order('created_at', { ascending: false })
          .limit(1)
        if ((res as unknown as { error?: unknown }).error) {
          inbodyResult = { data: null }
        } else {
          const rows = ((res as unknown as { data?: InbodyLog[] }).data) || []
          const singleRecord = rows && rows.length > 0 ? rows[0] : null
          inbodyResult = { data: singleRecord }
        }
      } catch {}

      try {
        const res = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('log_date', date)
        workoutResult = { data: ((res as unknown as { data?: WorkoutLog[] }).data) || [] }
      } catch { workoutResult = { data: [] } }

      try {
        const res = await supabase
          .from('meal_events')
          .select('*')
          .eq('user_id', currentUser.id)
          .gte('ate_at', `${date}T00:00:00.000Z`)
          .lt('ate_at', `${date}T23:59:59.999Z`)
          .order('ate_at', { ascending: true })
        mealResult = { data: ((res as unknown as { data?: MealEvent[] }).data) || [] }
        if (mealResult.data && mealResult.data.length > 0) {
          try {
            const mealIds = mealResult.data.map((m) => m.id)
            const mealItemsResult = await supabase
              .from('meal_items')
              .select('*')
              .in('meal_event_id', mealIds)
            const itemsByMealId: Record<string, MealItem[]> = {}
            mealItemsResult.data?.forEach((it: MealItem) => {
              if (!itemsByMealId[it.meal_event_id]) itemsByMealId[it.meal_event_id] = []
              itemsByMealId[it.meal_event_id].push(it)
            })
            mealResult.data = mealResult.data.map((meal) => ({
              ...meal,
              meal_items: itemsByMealId[meal.id] || []
            }))
          } catch {}
        }
      } catch { mealResult = { data: [] } }

      setConditionData(conditionResult.data)
      setInbodyData(inbodyResult.data)
      setWorkoutData(workoutResult.data || [])
      setMealData(mealResult.data || [])
    } catch (err) {
      const msg = (err as { message?: string })?.message || '데이터를 가져오는 중 오류가 발생했습니다.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAllData(selectedDate)
    }
  }, [selectedDate, fetchAllData])

  useEffect(() => {
    if (refreshTrigger > 0 && selectedDate) {
      fetchAllData(selectedDate)
    }
  }, [refreshTrigger, selectedDate, fetchAllData])

  const handleSectionClick = (category: 'condition' | 'workout' | 'meal' | 'inbody') => {
    switch (category) {
      case 'condition':
        if (onEditCondition) onEditCondition(); break
      case 'workout':
        if (onEditWorkout) onEditWorkout(); break
      case 'meal':
        if (onEditMeal) onEditMeal(); break
      case 'inbody':
        if (onEditInbody) onEditInbody(); break
      default:
        break
    }
  }

  const calculateTotalVolume = (workouts: WorkoutLog[]) => {
    return (workouts || []).reduce((total: number, workout: WorkoutLog) => {
      const exercises = workout.exercises || []
      const workoutVolume = exercises.reduce((exerciseTotal: number, exercise: { sets?: WorkoutSet[] }) => {
        const sets = exercise.sets || []
        const exerciseVolume = sets.reduce((setTotal: number, set: WorkoutSet) => {
          return setTotal + ((set.reps || 0) * (set.weight_kg || 0))
        }, 0)
        return exerciseTotal + exerciseVolume
      }, 0)
      return total + workoutVolume
    }, 0)
  }

  const calculateTotalCalories = (meals: MealEvent[]) => {
    return (meals || []).reduce((total: number, meal: MealEvent) => total + (meal.total_calories || 0), 0)
  }

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">날짜를 선택하세요</h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              캘린더에서 날짜를 선택하면<br />
              해당 날짜의 기록을 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6">
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(selectedDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="mb-4 text-center py-4">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">데이터를 불러오는 중...</p>
        </div>
      )}

      <div className="space-y-3">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">오늘의 기록</h5>

        <button
          data-testid="summary-condition"
          onClick={() => handleSectionClick('condition')}
          className="w-full p-3 text-left bg-pink-50 hover:bg-pink-100 rounded-lg border border-pink-200 transition-colors dark:bg-gray-900 dark:border-pink-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-pink-600" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">컨디션</span>
            </div>
            {conditionData ? (
              <div className="text-right">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {moodEmojis[conditionData.overall_mood]} {conditionData.overall_mood === 'great' ? '최고' : 
                   conditionData.overall_mood === 'good' ? '좋음' : 
                   conditionData.overall_mood === 'normal' ? '보통' : 
                   conditionData.overall_mood === 'bad' ? '나쁨' : '최악'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {fatigueEmojis[conditionData.fatigue_level]} {sleepEmojis[conditionData.sleep_quality]}
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">기록 없음</span>
            )}
          </div>
        </button>

        <button
          data-testid="summary-inbody"
          onClick={() => handleSectionClick('inbody')}
          className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors dark:bg-gray-900 dark:border-blue-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Weight className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">InBody</span>
            </div>
            {inbodyData ? (
              <div className="text-right">
                <div className="text-sm text-gray-700 dark:text-gray-300">{inbodyData.weight_kg}kg</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">체지방 {inbodyData.body_fat_percentage}%</div>
              </div>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">기록 없음</span>
            )}
          </div>
        </button>

        <button
          data-testid="summary-workout"
          onClick={() => handleSectionClick('workout')}
          className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors dark:bg-gray-900 dark:border-green-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">운동</span>
            </div>
            {workoutData && workoutData.length > 0 ? (
              <div className="text-right">
                <div className="text-sm text-gray-700 dark:text-gray-300">{workoutData.length}개 운동</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">총 볼륨: {calculateTotalVolume(workoutData)}kg</div>
              </div>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">기록 없음</span>
            )}
          </div>
        </button>

        <button
          data-testid="summary-meal"
          onClick={() => handleSectionClick('meal')}
          className="w-full p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors dark:bg-gray-900 dark:border-orange-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Utensils className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">식사</span>
            </div>
            {mealData && mealData.length > 0 ? (
              <div className="text-right">
                <div className="text-sm text-gray-700 dark:text-gray-300">{mealData.length}회 식사</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">총 {calculateTotalCalories(mealData)} kcal</div>
              </div>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">기록 없음</span>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}

export default DailySummarySidebar


