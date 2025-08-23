import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Calendar, Dumbbell, X } from 'lucide-react'

export interface WorkoutLogFormInnerProps {
  onDataSaved?: () => void
  selectedDate?: string
  onSave?: () => void
  onCancel?: () => void
  initialValue?: {
    exercise?: string
    template?: string
    sets?: Array<{ reps?: number; weight_kg?: number }>
  } | null
}

const WorkoutLogFormInner = ({ onDataSaved, selectedDate = null as unknown as string | undefined, onSave, onCancel, initialValue = null }: WorkoutLogFormInnerProps) => {
  const isEditMode = selectedDate != null

  const [logDate, setLogDate] = useState<string>(selectedDate || new Date().toISOString().split('T')[0])

  const buildExercisesFromInitial = useMemo(() => {
    return (iv: WorkoutLogFormInnerProps['initialValue']) => {
      if (iv?.sets && iv.sets.length > 0) {
        return [
          {
            id: 1,
            name: iv.exercise || '',
            sets: iv.sets.map((s, idx) => ({ id: idx + 1, reps: String(s.reps ?? ''), weight_kg: String(s.weight_kg ?? '') })),
          },
        ]
      }
      if (iv?.template === '5x3') {
        return [
          {
            id: 1,
            name: iv.exercise || '스쿼트',
            sets: Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, reps: '3', weight_kg: '' })),
          },
        ]
      }
      return [
        { id: 1, name: iv?.exercise || '', sets: [{ id: 1, reps: '', weight_kg: '' }] },
      ]
    }
  }, [])

  const [exercises, setExercises] = useState<Array<{ id: number; name: string; sets: Array<{ id: number; reps: string; weight_kg: string }> }>>(buildExercisesFromInitial(initialValue))
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setExercises(buildExercisesFromInitial(initialValue))
  }, [initialValue, buildExercisesFromInitial])

  const addExercise = () => {
    const newExerciseId = Math.max(...exercises.map(ex => ex.id)) + 1
    const newExercise = { id: newExerciseId, name: '', sets: [{ id: 1, reps: '', weight_kg: '' }] }
    setExercises([...exercises, newExercise])
  }

  const removeExercise = (exerciseId: number) => {
    if (exercises.length > 1) setExercises(exercises.filter(ex => ex.id !== exerciseId))
  }

  const updateExerciseName = (exerciseId: number, name: string) => {
    setExercises(exercises.map(ex => (ex.id === exerciseId ? { ...ex, name } : ex)))
  }

  const addSet = (exerciseId: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSetId = Math.max(...ex.sets.map(set => set.id)) + 1
        const lastSet = ex.sets[ex.sets.length - 1]
        const newSet = { id: newSetId, reps: lastSet.reps, weight_kg: lastSet.weight_kg }
        return { ...ex, sets: [...ex.sets, newSet] }
      }
      return ex
    }))
  }

  const removeSet = (exerciseId: number, setId: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId && ex.sets.length > 1) {
        return { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
      }
      return ex
    }))
  }

  const updateSet = (exerciseId: number, setId: number, field: string, value: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, sets: ex.sets.map(set => (set.id === setId ? { ...set, [field]: value } : set)) }
      }
      return ex
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const hasEmpty = exercises.some(ex => !ex.name.trim() || ex.sets.some(s => !s.reps || !s.weight_kg))
    if (hasEmpty) {
      setMessage('모든 운동명과 세트 정보를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage('로그인이 필요합니다.')
        return
      }
      for (const exercise of exercises) {
        const workoutData = exercise.sets.map(set => ({ reps: parseInt(set.reps), weight_kg: parseFloat(set.weight_kg) }))
        const { error } = await supabase
          .from('workout_logs')
          .insert({ user_id: user.id, log_date: logDate, exercise_name: exercise.name, workout_data: workoutData })
        if (error) throw error
      }
      setMessage('운동 기록이 성공적으로 저장되었습니다!')
      setExercises([{ id: 1, name: '', sets: [{ id: 1, reps: '', weight_kg: '' }] }])
      if (onSave) setTimeout(() => onSave(), 1000)
      if (onDataSaved) onDataSaved()
    } catch (error) {
      console.error('운동 기록 저장 오류:', error)
      setMessage('운동 기록 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 내부에서 사용하지 않으므로 제거해 린트 통과
  // const handleCancel = () => { if (onCancel) onCancel() }

  return (
    <div className={`${isEditMode ? '' : 'max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md'}`}>
      {!isEditMode && (
        <div className="flex items-center space-x-2 mb-6">
          <Dumbbell className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-800">운동 기록</h2>
        </div>
      )}
      {message && (
        <div className={`p-3 mb-6 rounded-lg border ${message.includes('성공') ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4" />
            <span>운동 날짜</span>
          </label>
          <input type="date" value={logDate} onChange={(e) => !isEditMode && setLogDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" disabled={isEditMode} readOnly={isEditMode} />
        </div>
        <div className="space-y-4">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <input type="text" placeholder="운동명 (예: 벤치프레스)" value={exercise.name} onChange={(e) => updateExerciseName(exercise.id, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                {exercises.length > 1 && (
                  <button type="button" onClick={() => removeExercise(exercise.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {exercise.sets.map((set, setIndex) => (
                  <div key={set.id} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-12">{setIndex + 1}세트</span>
                    <input type="number" placeholder="횟수" value={set.reps} onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded text-center" min="1" />
                    <span className="text-sm text-gray-600">회</span>
                    <input type="number" placeholder="무게" value={set.weight_kg} onChange={(e) => updateSet(exercise.id, set.id, 'weight_kg', e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded text-center" min="0" step="0.5" />
                    <span className="text-sm text-gray-600">kg</span>
                    {exercise.sets.length > 1 && (
                      <button type="button" onClick={() => removeSet(exercise.id, set.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addSet(exercise.id)} className="mt-2 flex items-center space-x-1 text-sm text-green-600 hover:text-green-700">
                <Plus className="w-4 h-4" />
                <span>세트 추가</span>
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addExercise} className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors">
          <Plus className="w-5 h-5" />
          <span>운동 추가</span>
        </button>
        <div className={`flex ${isEditMode ? 'justify-between' : 'justify-end'} pt-4`}>
          {isEditMode && onCancel && (
            <button type="button" onClick={onCancel} className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
              <X className="w-4 h-4" />
              <span>취소</span>
            </button>
          )}
          <button type="submit" disabled={isLoading} className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-colors">
            <Dumbbell className="w-4 h-4" />
            <span>{isLoading ? '저장 중...' : '운동 기록 저장'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default WorkoutLogFormInner


