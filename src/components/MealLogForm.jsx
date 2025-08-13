// src/components/MealLogForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase, auth } from '@/lib/supabase';
import { Plus, Utensils, Search, Clock, Save, X } from 'lucide-react';

const MealLogForm = ({ 
  onDataSaved, 
  selectedDate = null,
  onSave = null,
  onCancel = null
}) => {
  // 편집 모드인지 확인
  const isEditMode = selectedDate !== null;
  
  // 메인 상태
  const [logDate, setLogDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [mealTime, setMealTime] = useState('12:00');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentMealFoods, setCurrentMealFoods] = useState([]);
  const [hungerLevel, setHungerLevel] = useState('medium');
  const [moodBefore, setMoodBefore] = useState('calm');
  
  // UI 상태
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 배고픔 레벨 옵션
  const hungerOptions = [
    { value: 'low', label: '매우 배고픔', emoji: '😋' },
    { value: 'medium', label: '배고픔', emoji: '🙂' },
    { value: 'high', label: '조금 배고픔', emoji: '😐' },
    { value: 'not_hungry', label: '배고프지 않음', emoji: '😌' }
  ];

  // 식사 전 기분 옵션
  const moodOptions = [
    { value: 'fresh', label: '상쾌함', emoji: '😊' },
    { value: 'calm', label: '평온함', emoji: '😌' },
    { value: 'tired', label: '피곤함', emoji: '😴' },
    { value: 'anxious', label: '불안함', emoji: '😰' }
  ];

  // 음식 검색
  const searchFoods = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('food_db')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('음식 검색 오류:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 검색어 변경 시 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFoods(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 음식을 현재 식사에 추가
  const addFoodToMeal = (food) => {
    const existingFood = currentMealFoods.find(f => f.food_id === food.id);
    
    if (existingFood) {
      // 이미 있는 음식이면 수량 증가
      setCurrentMealFoods(currentMealFoods.map(f => 
        f.food_id === food.id 
          ? { ...f, quantity: f.quantity + 100 }
          : f
      ));
    } else {
      // 새 음식 추가
      const newFood = {
        food_id: food.id,
        food_name: food.name,
        quantity: 100,
        calories_per_100g: food.calories_per_100g,
        protein_per_100g: food.protein_per_100g || 0,
        carbs_per_100g: food.carbs_per_100g || 0,
        fat_per_100g: food.fat_per_100g || 0
      };
      setCurrentMealFoods([...currentMealFoods, newFood]);
    }
    
    setSearchQuery('');
    setSearchResults([]);
  };

  // 음식 수량 변경
  const updateFoodQuantity = (foodId, quantity) => {
    const numQuantity = Math.max(1, parseInt(quantity) || 1);
    setCurrentMealFoods(currentMealFoods.map(f => 
      f.food_id === foodId ? { ...f, quantity: numQuantity } : f
    ));
  };

  // 음식 제거
  const removeFoodFromMeal = (foodId) => {
    setCurrentMealFoods(currentMealFoods.filter(f => f.food_id !== foodId));
  };

  // 총 칼로리 계산
  const getTotalCalories = (foods) => {
    return Math.round(foods.reduce((total, food) => {
      return total + (food.calories_per_100g * food.quantity / 100);
    }, 0));
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (currentMealFoods.length === 0) {
      setError('최소 하나의 음식을 추가해주세요.');
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // ate_at 시간 생성 (TIMESTAMPTZ)
      const ateAt = new Date(`${logDate}T${mealTime}:00.000Z`).toISOString();

      // meal_events에 식사 이벤트 저장
      const { data: mealEvent, error: mealEventError } = await supabase
        .from('meal_events')
        .insert({
          user_id: currentUser.id,
          ate_at: ateAt,
          total_calories: getTotalCalories(currentMealFoods),
          hunger_level: hungerLevel,
          mood_before: moodBefore,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (mealEventError) throw mealEventError;

      // meal_items에 개별 음식 아이템들 저장
      const mealItemsData = currentMealFoods.map(food => ({
        meal_event_id: mealEvent.id,
        food_id: food.food_id,
        quantity: food.quantity,
        calories: Math.round(food.calories_per_100g * food.quantity / 100),
        protein: Math.round(food.protein_per_100g * food.quantity / 100),
        carbs: Math.round(food.carbs_per_100g * food.quantity / 100),
        fat: Math.round(food.fat_per_100g * food.quantity / 100)
      }));

      const { error: itemsError } = await supabase
        .from('meal_items')
        .insert(mealItemsData);

      if (itemsError) throw itemsError;

      setMessage('식사 기록이 성공적으로 저장되었습니다!');

      // 폼 초기화
      setCurrentMealFoods([]);
      setMealTime('12:00');
      setHungerLevel('medium');
      setMoodBefore('calm');
      setSearchQuery('');
      setSearchResults([]);

      // 편집 모드에서는 onSave 콜백 호출
      if (onSave) {
        setTimeout(() => {
          onSave();
        }, 1000);
      }

      // 기존 onDataSaved 콜백도 호출 (대시보드 호환성)
      if (onDataSaved) {
        onDataSaved();
      }

    } catch (err) {
      console.error('식사 기록 저장 오류:', err);
      setError(err.message || '식사 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 편집 취소 처리
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`${isEditMode ? '' : 'max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md'}`}>
      {!isEditMode && (
        <div className="flex items-center space-x-2 mb-6">
          <Utensils className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-800">식사 기록</h2>
        </div>
      )}

      {message && (
        <div className="p-3 mb-6 rounded-lg bg-green-100 text-green-700 border border-green-200">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 mb-6 rounded-lg bg-red-100 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* 날짜 및 시간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => !isEditMode && setLogDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={isEditMode}
              readOnly={isEditMode}
            />
          </div>
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              <span>시간</span>
            </label>
            <input
              type="time"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* 음식 검색 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Search className="w-4 h-4" />
            <span>음식 검색</span>
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="음식명을 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          {/* 검색 결과 */}
          {isSearching && <p className="text-sm text-gray-500 mt-2">검색 중...</p>}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => addFoodToMeal(food)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-sm text-gray-600">
                    {food.calories_per_100g} kcal/100g
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 현재 식사의 음식들 */}
        {currentMealFoods.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">이 식사의 음식들</h3>
            <div className="space-y-2">
              {currentMealFoods.map((food) => (
                <div key={food.food_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <span className="font-medium">{food.food_name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({Math.round(food.calories_per_100g * food.quantity / 100)} kcal)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={food.quantity}
                      onChange={(e) => updateFoodQuantity(food.food_id, e.target.value)}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">g</span>
                    <button
                      onClick={() => removeFoodFromMeal(food.food_id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="text-right font-semibold text-orange-600">
                총 칼로리: {getTotalCalories(currentMealFoods)} kcal
              </div>
            </div>
          </div>
        )}

        {/* 배고픔 레벨 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">배고픔 정도</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {hungerOptions.map((option) => (
              <label
                key={option.value}
                className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  hungerLevel === option.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="hungerLevel"
                  value={option.value}
                  checked={hungerLevel === option.value}
                  onChange={(e) => setHungerLevel(e.target.value)}
                  className="sr-only"
                />
                <span className="text-2xl mb-1">{option.emoji}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 식사 전 기분 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">식사 전 기분</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {moodOptions.map((option) => (
              <label
                key={option.value}
                className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  moodBefore === option.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="moodBefore"
                  value={option.value}
                  checked={moodBefore === option.value}
                  onChange={(e) => setMoodBefore(e.target.value)}
                  className="sr-only"
                />
                <span className="text-2xl mb-1">{option.emoji}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 저장/취소 버튼 */}
        <div className={`flex ${isEditMode ? 'justify-between' : 'justify-end'} pt-4`}>
          {isEditMode && onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>취소</span>
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={isSaving || currentMealFoods.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : '식사 기록 저장'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealLogForm; 