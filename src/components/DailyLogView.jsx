// src/components/DailyLogView.jsx
import React, { useState, useEffect } from 'react';
import { supabase, auth } from '@/lib/supabase';
import { 
  Heart, 
  Weight, 
  Activity, 
  Utensils, 
  Edit3, 
  Calendar,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Battery,
  Moon,
  X
} from 'lucide-react';
import DailyConditionForm from './DailyConditionForm';
import WorkoutLogForm from './WorkoutLogForm';
import MealLogForm from './MealLogForm';

const DailyLogView = ({ selectedDate }) => {
  // 데이터 상태
  const [conditionData, setConditionData] = useState(null);
  const [inbodyData, setInbodyData] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [mealData, setMealData] = useState(null);
  
  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 편집 모드 상태
  const [isEditingCondition, setIsEditingCondition] = useState(false);
  const [isEditingWorkout, setIsEditingWorkout] = useState(false);
  const [isEditingMeal, setIsEditingMeal] = useState(false);

  // 기분 이모지 매핑
  const moodEmojis = {
    great: '🤩',
    good: '😊',
    normal: '😐',
    bad: '😔',
    awful: '😵'
  };

  // 컨디션 데이터 가져오기
  const fetchConditionData = async (date, userId) => {
    const { data, error } = await supabase
      .from('daily_conditions')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data;
  };

  // 인바디 데이터 가져오기
  const fetchInbodyData = async (date, userId) => {
    const { data, error } = await supabase
      .from('inbody_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    return data.length > 0 ? data[0] : null;
  };

  // 운동 데이터 가져오기
  const fetchWorkoutData = async (date, userId) => {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data;
  };

  // 식사 데이터 가져오기
  const fetchMealData = async (date, userId) => {
    // ate_at 컬럼을 사용하여 해당 날짜의 식사들을 가져오기
    const startDate = `${date}T00:00:00.000Z`;
    const endDate = `${date}T23:59:59.999Z`;
    
    const { data: mealEvents, error: mealError } = await supabase
      .from('meal_events')
      .select(`
        *,
        meal_items (
          *,
          food_db (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
        )
      `)
      .eq('user_id', userId)
      .gte('ate_at', startDate)
      .lte('ate_at', endDate)
      .order('ate_at', { ascending: true });
    
    if (mealError) {
      throw mealError;
    }
    
    return mealEvents;
  };

  // 모든 데이터 가져오기
  const fetchAllData = async (date) => {
    try {
      setIsLoading(true);
      setError('');

      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // 모든 데이터를 병렬로 가져오기
      const [condition, inbody, workout, meal] = await Promise.all([
        fetchConditionData(date, currentUser.id),
        fetchInbodyData(date, currentUser.id),
        fetchWorkoutData(date, currentUser.id),
        fetchMealData(date, currentUser.id)
      ]);

      setConditionData(condition);
      setInbodyData(inbody);
      setWorkoutData(workout);
      setMealData(meal);

    } catch (err) {
      console.error('데이터 가져오기 오류:', err);
      setError(err.message || '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // selectedDate가 변경될 때마다 데이터 가져오기
  useEffect(() => {
    if (selectedDate) {
      fetchAllData(selectedDate);
      // 날짜가 변경되면 편집 모드 해제
      setIsEditingCondition(false);
      setIsEditingWorkout(false);
      setIsEditingMeal(false);
    }
  }, [selectedDate]);

  // 컨디션 편집 관련 핸들러
  const handleEditCondition = () => {
    setIsEditingCondition(true);
  };

  const handleConditionSave = () => {
    setIsEditingCondition(false);
    fetchAllData(selectedDate);
  };

  const handleConditionCancel = () => {
    setIsEditingCondition(false);
  };

  // 운동 편집 관련 핸들러
  const handleEditWorkout = () => {
    setIsEditingWorkout(true);
  };

  const handleWorkoutSave = () => {
    setIsEditingWorkout(false);
    fetchAllData(selectedDate);
  };

  const handleWorkoutCancel = () => {
    setIsEditingWorkout(false);
  };

  // 식단 편집 관련 핸들러
  const handleEditMeal = () => {
    setIsEditingMeal(true);
  };

  const handleMealSave = () => {
    setIsEditingMeal(false);
    fetchAllData(selectedDate);
  };

  const handleMealCancel = () => {
    setIsEditingMeal(false);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">데이터를 불러오는 중...</h3>
          <p className="text-gray-600">선택된 날짜의 모든 기록을 가져오고 있습니다.</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => fetchAllData(selectedDate)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* 헤더 */}
      <div className="flex items-center space-x-3 mb-8">
        <Calendar className="w-7 h-7 text-blue-500" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedDate ? new Date(selectedDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            }) : '날짜를 선택해주세요'}
          </h2>
          <p className="text-gray-600">이 날의 모든 건강 기록을 한눈에 확인하세요</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘의 컨디션 섹션 */}
        <div className="bg-pink-50 p-6 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-semibold text-pink-800">오늘의 컨디션</h3>
            </div>
            {!isEditingCondition ? (
              <button 
                onClick={handleEditCondition}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded-md hover:bg-pink-200 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>수정</span>
              </button>
            ) : (
              <button 
                onClick={handleConditionCancel}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>취소</span>
              </button>
            )}
          </div>
          
          {isEditingCondition ? (
            // 편집 모드: DailyConditionForm 렌더링
            <div className="bg-white p-4 rounded-lg border border-pink-200">
              <DailyConditionForm
                logToEdit={conditionData}
                selectedDate={selectedDate}
                onSave={handleConditionSave}
                onCancel={handleConditionCancel}
              />
            </div>
          ) : (
            // 보기 모드: 요약 정보 표시
            conditionData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{moodEmojis[conditionData.overall_mood]}</div>
                    <div className="text-xs text-gray-600">기분</div>
                    <div className="text-sm font-medium">
                      {conditionData.overall_mood === 'great' ? '최고' :
                       conditionData.overall_mood === 'good' ? '좋음' :
                       conditionData.overall_mood === 'normal' ? '보통' :
                       conditionData.overall_mood === 'bad' ? '나쁨' : '최악'}
                    </div>
                  </div>
                  <div className="text-center">
                    <Battery className={`w-6 h-6 mx-auto mb-1 ${
                      conditionData.fatigue_level === 'low' ? 'text-green-500' :
                      conditionData.fatigue_level === 'medium' ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                    <div className="text-xs text-gray-600">피로도</div>
                    <div className="text-sm font-medium">
                      {conditionData.fatigue_level === 'low' ? '낮음' :
                       conditionData.fatigue_level === 'medium' ? '보통' : '높음'}
                    </div>
                  </div>
                  <div className="text-center">
                    <Moon className={`w-6 h-6 mx-auto mb-1 ${
                      conditionData.sleep_quality === 'good' ? 'text-blue-500' :
                      conditionData.sleep_quality === 'normal' ? 'text-gray-500' : 'text-purple-500'
                    }`} />
                    <div className="text-xs text-gray-600">수면의 질</div>
                    <div className="text-sm font-medium">
                      {conditionData.sleep_quality === 'good' ? '좋음' :
                       conditionData.sleep_quality === 'normal' ? '보통' : '나쁨'}
                    </div>
                  </div>
                </div>
                
                {conditionData.diary_entry && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">오늘의 일기</span>
                    </div>
                    <p className="text-amber-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {conditionData.diary_entry}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>이 날의 컨디션 기록이 없습니다.</p>
              </div>
            )
          )}
        </div>

        {/* 인바디 기록 섹션 */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Weight className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">인바디 기록</h3>
            </div>
            <button className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
              <Edit3 className="w-4 h-4" />
              <span>수정</span>
            </button>
          </div>
          
          {inbodyData ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{inbodyData.weight_kg}</div>
                <div className="text-xs text-gray-600">체중 (kg)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{inbodyData.skeletal_muscle_mass_kg}</div>
                <div className="text-xs text-gray-600">골격근량 (kg)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{inbodyData.body_fat_percentage}</div>
                <div className="text-xs text-gray-600">체지방률 (%)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{inbodyData.bmi}</div>
                <div className="text-xs text-gray-600">BMI</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Weight className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>이 날의 인바디 기록이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 운동 기록 섹션 */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">운동 기록</h3>
            </div>
            {!isEditingWorkout ? (
              <button 
                onClick={handleEditWorkout}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>추가</span>
              </button>
            ) : (
              <button 
                onClick={handleWorkoutCancel}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>취소</span>
              </button>
            )}
          </div>
          
          {isEditingWorkout ? (
            // 편집 모드: WorkoutLogForm 렌더링
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <WorkoutLogForm
                selectedDate={selectedDate}
                onSave={handleWorkoutSave}
                onCancel={handleWorkoutCancel}
              />
            </div>
          ) : (
            // 보기 모드: 운동 기록 리스트
            workoutData && workoutData.length > 0 ? (
              <div className="space-y-3">
                {workoutData.map((workout, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800">{workout.exercise_name}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(workout.created_at).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {workout.workout_data && workout.workout_data.map((set, setIndex) => (
                        <div key={setIndex} className="flex justify-between text-sm text-gray-600">
                          <span>세트 {setIndex + 1}</span>
                          <span>{set.reps}회 × {set.weight_kg}kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>이 날의 운동 기록이 없습니다.</p>
              </div>
            )
          )}
        </div>

        {/* 식사 기록 섹션 */}
        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Utensils className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-800">식사 기록</h3>
            </div>
            {!isEditingMeal ? (
              <button 
                onClick={handleEditMeal}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>추가</span>
              </button>
            ) : (
              <button 
                onClick={handleMealCancel}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>취소</span>
              </button>
            )}
          </div>
          
          {isEditingMeal ? (
            // 편집 모드: MealLogForm 렌더링
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <MealLogForm
                selectedDate={selectedDate}
                onSave={handleMealSave}
                onCancel={handleMealCancel}
              />
            </div>
          ) : (
            // 보기 모드: 식사 기록 리스트
            mealData && mealData.length > 0 ? (
              <div className="space-y-3">
                {mealData.map((meal, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-800">
                        {new Date(meal.ate_at).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} 식사
                      </span>
                      <span className="text-sm text-orange-600">{meal.total_calories} kcal</span>
                    </div>
                    <div className="space-y-1">
                      {meal.meal_items && meal.meal_items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between text-sm text-gray-600">
                          <span>
                            {item.food_db ? item.food_db.name : item.custom_food_name} 
                            ({item.quantity}g)
                          </span>
                          <span>{item.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                    {(meal.hunger_level || meal.mood_before) && (
                      <div className="mt-2 pt-2 border-t border-orange-100 flex space-x-4 text-xs text-gray-500">
                        {meal.hunger_level && (
                          <span>배고픔: {
                            meal.hunger_level === 'low' ? '매우 배고픔' :
                            meal.hunger_level === 'medium' ? '배고픔' :
                            meal.hunger_level === 'high' ? '조금 배고픔' : '배고프지 않음'
                          }</span>
                        )}
                        {meal.mood_before && (
                          <span>기분: {
                            meal.mood_before === 'fresh' ? '상쾌함' :
                            meal.mood_before === 'calm' ? '평온함' :
                            meal.mood_before === 'tired' ? '피곤함' : '불안함'
                          }</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Utensils className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>이 날의 식사 기록이 없습니다.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyLogView; 