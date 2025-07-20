// src/components/WorkoutLogForm.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Calendar, Dumbbell } from 'lucide-react';

interface WorkoutLogFormProps {
  onDataSaved?: () => void;
}

const WorkoutLogForm: React.FC<WorkoutLogFormProps> = ({ onDataSaved }) => {
  // 메인 상태
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState([
    {
      id: 1,
      name: '',
      sets: [{ id: 1, reps: '', weight_kg: '' }]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 운동 추가
  const addExercise = () => {
    const newExerciseId = Math.max(...exercises.map(ex => ex.id)) + 1;
    const newExercise = {
      id: newExerciseId,
      name: '',
      sets: [{ id: 1, reps: '', weight_kg: '' }]
    };
    setExercises([...exercises, newExercise]);
  };

  // 운동 제거
  const removeExercise = (exerciseId: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(ex => ex.id !== exerciseId));
    }
  };

  // 운동명 업데이트
  const updateExerciseName = (exerciseId: number, name: string) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, name } : ex
    ));
  };

  // 세트 추가 (직전 세트 값 복사)
  const addSet = (exerciseId: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSetId = ex.sets.length > 0 ? Math.max(...ex.sets.map(set => set.id)) + 1 : 1;
        
        // 직전 세트의 값을 가져오기 (마지막 세트)
        const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;
        const newSet = {
          id: newSetId,
          reps: lastSet ? lastSet.reps : '',
          weight_kg: lastSet ? lastSet.weight_kg : ''
        };
        
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      }
      return ex;
    }));
  };

  // 세트 제거
  const removeSet = (exerciseId: number, setId: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId && ex.sets.length > 1) {
        return {
          ...ex,
          sets: ex.sets.filter(set => set.id !== setId)
        };
      }
      return ex;
    }));
  };

  // 세트 데이터 업데이트
  const updateSet = (exerciseId: number, setId: number, field: 'reps' | 'weight_kg', value: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => 
            set.id === setId ? { ...set, [field]: value } : set
          )
        };
      }
      return ex;
    }));
  };

  // 폼 제출
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setMessage('');

      // 데이터 유효성 검사
      const validExercises = exercises.filter(ex => {
        const hasValidName = ex.name.trim();
        const hasValidSets = ex.sets.some(set => set.reps && set.weight_kg);
        return hasValidName && hasValidSets;
      });

      if (validExercises.length === 0) {
        setMessage('최소 하나의 유효한 운동과 세트를 입력해주세요.');
        return;
      }

      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('로그인이 필요합니다.');
        return;
      }

      // 데이터 구조 변환
      const workoutData = validExercises.map(ex => ({
        name: ex.name.trim(),
        sets: ex.sets
          .filter(set => set.reps && set.weight_kg)
          .map(set => ({
            reps: parseInt(set.reps),
            weight_kg: parseFloat(set.weight_kg)
          }))
      }));

      // 데이터베이스에 저장
      const { error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          log_date: logDate,
          workout_data: workoutData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessage('운동 로그가 성공적으로 저장되었습니다!');
      
      // 부모 컴포넌트에 데이터 저장 완료 알림
      if (onDataSaved) {
        onDataSaved();
      }
      
      // 폼 초기화
      setLogDate(new Date().toISOString().split('T')[0]);
      setExercises([
        {
          id: 1,
          name: '',
          sets: [{ id: 1, reps: '', weight_kg: '' }]
        }
      ]);
      
    } catch (error) {
      console.error('Error saving workout log:', error);
      setMessage('운동 로그 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-6">
        <Dumbbell className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">운동 로그 기록</h2>
      </div>
      
      {message && (
        <div className={`p-3 mb-6 rounded-lg ${
          message.includes('성공') 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* 날짜 입력 */}
      <div className="mb-6">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4" />
          <span>운동 날짜</span>
        </label>
        <input
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 운동 목록 */}
      <div className="space-y-6 mb-6">
        {exercises.map((exercise, exerciseIndex) => (
          <div key={exercise.id} className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
            {/* 운동 헤더 */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                운동 {exerciseIndex + 1}
              </h3>
              {exercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExercise(exercise.id)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>운동 제거</span>
                </button>
              )}
            </div>
            
            {/* 운동명 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                운동명
              </label>
              <input
                type="text"
                value={exercise.name}
                onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 스쿼트, 벤치프레스, 데드리프트"
              />
            </div>

            {/* 세트 목록 */}
            <div className="space-y-3 mb-4">
              <h4 className="text-md font-medium text-gray-700">세트</h4>
              {exercise.sets.map((set, setIndex) => (
                <div key={set.id} className="flex items-center space-x-3 p-3 bg-white rounded-md border">
                  <span className="text-sm font-medium text-gray-600 w-12">
                    #{setIndex + 1}
                  </span>
                  
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">반복 횟수</label>
                    <input
                      type="number"
                      min="1"
                      value={set.reps}
                      onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="12"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">무게 (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={set.weight_kg}
                      onChange={(e) => updateSet(exercise.id, set.id, 'weight_kg', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="80"
                    />
                  </div>
                  
                  {exercise.sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSet(exercise.id, set.id)}
                      className="flex items-center justify-center w-8 h-8 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 세트 추가 버튼 */}
            <button
              type="button"
              onClick={() => addSet(exercise.id)}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>세트 추가</span>
            </button>
          </div>
        ))}
      </div>

      {/* 컨트롤 버튼들 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={addExercise}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>운동 추가</span>
        </button>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-colors"
        >
          <Dumbbell className="w-4 h-4" />
          <span>{isLoading ? '저장 중...' : '운동 로그 저장'}</span>
        </button>
      </div>
    </div>
  );
};

export default WorkoutLogForm; 