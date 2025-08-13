// src/components/DailySummarySidebar.jsx
import React, { useState, useEffect } from 'react';
import { supabase, auth } from '@/lib/supabase';
import { 
  Heart, 
  Weight, 
  Activity, 
  Utensils, 
  Plus, 
  RefreshCw, 
  AlertCircle,
  Calendar 
} from 'lucide-react';

const DailySummarySidebar = ({ 
  selectedDate, 
  onEditCondition, 
  onEditWorkout, 
  onEditMeal, 
  onEditInbody,
  refreshTrigger 
}) => {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 데이터 상태
  const [conditionData, setConditionData] = useState(null);
  const [inbodyData, setInbodyData] = useState(null);
  const [workoutData, setWorkoutData] = useState([]);
  const [mealData, setMealData] = useState([]);

  // 기분 이모지 매핑
  const moodEmojis = {
    great: '🤩',
    good: '😊',
    normal: '😐',
    bad: '😔',
    awful: '😵'
  };

  // 피로도 이모지 매핑
  const fatigueEmojis = {
    low: '⚡',
    medium: '🔋',
    high: '🪫'
  };

  // 수면 이모지 매핑
  const sleepEmojis = {
    good: '😴',
    normal: '😌',
    bad: '😵‍💫'
  };

  // 모든 데이터 가져오기
  const fetchAllData = async (date) => {
    if (!date || date === '') {
      console.log('유효하지 않은 날짜:', date);
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');

      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      console.log('데이터 가져오기 시작:', { date, userId: currentUser.id });

      // 각 쿼리를 개별적으로 실행하여 어떤 부분에서 에러가 발생하는지 파악
      let conditionResult, inbodyResult, workoutResult, mealResult;

      try {
        // 컨디션 데이터
        console.log('컨디션 데이터 조회 시작...');
        conditionResult = await supabase
          .from('daily_conditions')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('log_date', date)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (conditionResult.error) {
          console.error('컨디션 데이터 에러:', conditionResult.error);
          console.error('컨디션 에러 상세:', JSON.stringify(conditionResult.error, null, 2));
          conditionResult = { data: [], error: null };
        } else {
          // 배열에서 첫 번째 항목 추출 (단일 객체로 변환)
          const singleRecord = conditionResult.data && conditionResult.data.length > 0 ? conditionResult.data[0] : null;
          conditionResult = { data: singleRecord, error: null };
          console.log('✅ 컨디션 데이터 조회 성공:', singleRecord ? '데이터 있음' : '데이터 없음');
        }
      } catch (err) {
        console.error('컨디션 쿼리 예외:', err);
        conditionResult = { data: null, error: null };
      }

      try {
        // InBody 데이터 - 가장 최근 기록 가져오기
        console.log('InBody 데이터 조회 시작...');
        inbodyResult = await supabase
          .from('inbody_logs')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('log_date', date)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (inbodyResult.error) {
          console.error('InBody 데이터 에러:', inbodyResult.error);
          console.error('InBody 에러 상세:', JSON.stringify(inbodyResult.error, null, 2));
          console.error('InBody 에러 코드:', inbodyResult.error.code);
          console.error('InBody 에러 메시지:', inbodyResult.error.message);
          
          // 빈 에러 객체 또는 테이블 관련 에러 처리
          const errorMessage = inbodyResult.error.message || '';
          const errorCode = inbodyResult.error.code || '';
          
          if (
            !errorMessage && !errorCode || // 빈 에러 객체
            errorCode === 'PGRST116' || // 다중 행 반환 에러 (이제 해결됨)
            errorMessage.includes('does not exist') ||
            errorMessage.includes('relation') ||
            errorMessage.includes('table') ||
            Object.keys(inbodyResult.error).length === 0 // 완전히 빈 객체
          ) {
            console.warn('⚠️ InBody 데이터 조회 실패. 쿼리를 조정합니다.');
            inbodyResult = { data: [], error: null };
          } else {
            console.error('🚨 예상치 못한 InBody 에러:', inbodyResult.error);
            inbodyResult = { data: [], error: null };
          }
        } else {
          // 배열에서 첫 번째 항목 추출 (단일 객체로 변환)
          const singleRecord = inbodyResult.data && inbodyResult.data.length > 0 ? inbodyResult.data[0] : null;
          inbodyResult = { data: singleRecord, error: null };
          console.log('✅ InBody 데이터 조회 성공:', singleRecord ? '데이터 있음' : '데이터 없음');
          
          if (inbodyResult.data && inbodyResult.data.length > 1) {
            console.warn('⚠️ 같은 날짜에 여러 InBody 기록이 발견되었습니다. 가장 최근 기록을 사용합니다.');
          }
        }
      } catch (err) {
        console.error('InBody 쿼리 예외:', err);
        console.warn('⚠️ InBody 테이블 접근 실패.');
        inbodyResult = { data: null, error: null };
      }

      try {
        // 운동 데이터
        console.log('운동 데이터 조회 시작...');
        workoutResult = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('log_date', date);
        
        if (workoutResult.error) {
          console.error('운동 데이터 에러:', workoutResult.error);
          console.error('운동 에러 상세:', JSON.stringify(workoutResult.error, null, 2));
        }
      } catch (err) {
        console.error('운동 쿼리 예외:', err);
        workoutResult = { data: [], error: null };
      }

      try {
        // 식사 데이터 - 단순화된 쿼리로 먼저 시도
        console.log('식사 데이터 조회 시작...');
        mealResult = await supabase
          .from('meal_events')
          .select('*')
          .eq('user_id', currentUser.id)
          .gte('ate_at', `${date}T00:00:00.000Z`)
          .lt('ate_at', `${date}T23:59:59.999Z`)
          .order('ate_at', { ascending: true });
        
        if (mealResult.error) {
          console.error('식사 데이터 에러:', mealResult.error);
          console.error('식사 에러 상세:', JSON.stringify(mealResult.error, null, 2));
        } else if (mealResult.data && mealResult.data.length > 0) {
          // 식사 데이터가 있으면 meal_items도 가져오기
          try {
            console.log('식사 아이템 조회 시작...');
            const mealIds = mealResult.data.map(meal => meal.id);
            
            const mealItemsResult = await supabase
              .from('meal_items')
              .select('*')
              .in('meal_event_id', mealIds);

            if (mealItemsResult.error) {
              console.error('식사 아이템 데이터 에러:', mealItemsResult.error);
              console.error('식사 아이템 에러 상세:', JSON.stringify(mealItemsResult.error, null, 2));
            } else {
              // meal_items를 각 meal_event에 연결
              const itemsByMealId = {};
              mealItemsResult.data?.forEach(item => {
                if (!itemsByMealId[item.meal_event_id]) {
                  itemsByMealId[item.meal_event_id] = [];
                }
                itemsByMealId[item.meal_event_id].push(item);
              });

              mealResult.data = mealResult.data.map(meal => ({
                ...meal,
                meal_items: itemsByMealId[meal.id] || []
              }));
            }

            // food_db 조인은 선택사항으로 처리
            try {
              if (mealItemsResult.data && mealItemsResult.data.length > 0) {
                console.log('음식 DB 조회 시작...');
                const foodIds = mealItemsResult.data.map(item => item.food_id).filter(Boolean);
                
                if (foodIds.length > 0) {
                  const foodResult = await supabase
                    .from('food_db')
                    .select('id, name')
                    .in('id', foodIds);

                  if (foodResult.error) {
                    console.error('음식 DB 에러:', foodResult.error);
                  } else {
                    const foodMap = {};
                    foodResult.data?.forEach(food => {
                      foodMap[food.id] = food;
                    });

                    // 음식 정보를 meal_items에 추가
                    mealResult.data = mealResult.data.map(meal => ({
                      ...meal,
                      meal_items: meal.meal_items?.map(item => ({
                        ...item,
                        food_db: item.food_id ? foodMap[item.food_id] : null
                      })) || []
                    }));
                  }
                }
              }
            } catch (foodErr) {
              console.warn('음식 DB 조회 실패 (선택사항):', foodErr);
            }
          } catch (itemsErr) {
            console.error('식사 아이템 가져오기 에러:', itemsErr);
            // 메인 식사 데이터는 유지하되 아이템만 빈 배열로 설정
            mealResult.data = mealResult.data.map(meal => ({
              ...meal,
              meal_items: []
            }));
          }
        }
      } catch (err) {
        console.error('식사 쿼리 예외:', err);
        mealResult = { data: [], error: null };
      }

      console.log('데이터 가져오기 완료:', {
        condition: conditionResult.data ? '있음' : '없음',
        inbody: inbodyResult.data ? '있음' : '없음', 
        workout: workoutResult.data?.length || 0,
        meal: mealResult.data?.length || 0
      });

      // 상태 업데이트
      setConditionData(conditionResult.data);
      setInbodyData(inbodyResult.data);
      setWorkoutData(workoutResult.data || []);
      setMealData(mealResult.data || []);

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
    }
  }, [selectedDate]);

  // Quick Log 버튼 클릭 핸들러
  const handleQuickLog = (category) => {
    switch (category) {
      case 'condition':
        if (onEditCondition) onEditCondition();
        break;
      case 'workout':
        if (onEditWorkout) onEditWorkout();
        break;
      case 'meal':
        if (onEditMeal) onEditMeal();
        break;
      case 'inbody':
        if (onEditInbody) onEditInbody();
        break;
      default:
        console.log(`Quick logging ${category} for ${selectedDate}`);
    }
  };

  // 요약 섹션 클릭 핸들러
  const handleSectionClick = (category) => {
    switch (category) {
      case 'condition':
        if (onEditCondition) onEditCondition();
        break;
      case 'workout':
        if (onEditWorkout) onEditWorkout();
        break;
      case 'meal':
        if (onEditMeal) onEditMeal();
        break;
      case 'inbody':
        // InBody는 탭 이동만 필요하도록 신호 전달
        if (onEditInbody) onEditInbody();
        break;
      default:
        // no-op
        break;
    }
  };

  // 총 운동 볼륨 계산
  const calculateTotalVolume = (workouts) => {
    return workouts.reduce((total, workout) => {
      const exercises = workout.exercises || [];
      const workoutVolume = exercises.reduce((exerciseTotal, exercise) => {
        const sets = exercise.sets || [];
        const exerciseVolume = sets.reduce((setTotal, set) => {
          return setTotal + ((set.reps || 0) * (set.weight_kg || 0));
        }, 0);
        return exerciseTotal + exerciseVolume;
      }, 0);
      return total + workoutVolume;
    }, 0);
  };

  // 총 칼로리 계산
  const calculateTotalCalories = (meals) => {
    return meals.reduce((total, meal) => total + (meal.total_calories || 0), 0);
  };

  // 데이터 새로고침 함수 (외부에서 호출 가능)
  const refreshData = () => {
    if (selectedDate) {
      fetchAllData(selectedDate);
    }
  };

  // refreshTrigger가 변경될 때마다 데이터 새로고침
  useEffect(() => {
    if (refreshTrigger > 0 && selectedDate) {
      refreshData();
    }
  }, [refreshTrigger, selectedDate]);

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">날짜를 선택하세요</h5>
            <p className="text-sm text-gray-500">
              캘린더에서 날짜를 선택하면<br />
              해당 날짜의 기록을 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 헤더 */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {new Date(selectedDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="mb-4 text-center py-4">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-500" />
          <p className="text-sm text-gray-600">데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 빠른 기록 버튼 섹션 제거 */}

      {/* 요약 섹션들 */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-gray-700 mb-3">오늘의 기록</h5>
        
        {/* 컨디션 요약 */}
        <button
          onClick={() => handleSectionClick('condition')}
          className="w-full p-3 text-left bg-pink-50 hover:bg-pink-100 rounded-lg border border-pink-200 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-pink-600" />
              <span className="text-sm font-medium text-gray-800">컨디션</span>
            </div>
            {conditionData ? (
              <div className="text-right">
                <div className="text-sm text-gray-700">
                  {moodEmojis[conditionData.overall_mood]} {conditionData.overall_mood === 'great' ? '최고' : 
                   conditionData.overall_mood === 'good' ? '좋음' : 
                   conditionData.overall_mood === 'normal' ? '보통' : 
                   conditionData.overall_mood === 'bad' ? '나쁨' : '최악'}
                </div>
                <div className="text-xs text-gray-500">
                  {fatigueEmojis[conditionData.fatigue_level]} {sleepEmojis[conditionData.sleep_quality]}
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-500">기록 없음</span>
            )}
          </div>
        </button>

        {/* InBody 요약 */}
        <button
          onClick={() => handleSectionClick('inbody')}
          className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Weight className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-800">InBody</span>
            </div>
            {inbodyData ? (
              <div className="text-right">
                <div className="text-sm text-gray-700">
                  {inbodyData.weight_kg}kg
                </div>
                <div className="text-xs text-gray-500">
                  체지방 {inbodyData.body_fat_percentage}%
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-500">기록 없음</span>
            )}
          </div>
        </button>

        {/* 운동 요약 */}
        <button
          onClick={() => handleSectionClick('workout')}
          className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-800">운동</span>
            </div>
            {workoutData && workoutData.length > 0 ? (
              <div className="text-right">
                <div className="text-sm text-gray-700">
                  {workoutData.length}개 운동
                </div>
                <div className="text-xs text-gray-500">
                  총 볼륨: {calculateTotalVolume(workoutData)}kg
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-500">기록 없음</span>
            )}
          </div>
        </button>

        {/* 식사 요약 */}
        <button
          onClick={() => handleSectionClick('meal')}
          className="w-full p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Utensils className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-800">식사</span>
            </div>
            {mealData && mealData.length > 0 ? (
              <div className="text-right">
                <div className="text-sm text-gray-700">
                  {mealData.length}회 식사
                </div>
                <div className="text-xs text-gray-500">
                  총 {calculateTotalCalories(mealData)} kcal
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-500">기록 없음</span>
            )}
          </div>
        </button>
      </div>

      {/* 기록하기 버튼 섹션 제거 */}
    </div>
  );
};

export default DailySummarySidebar; 