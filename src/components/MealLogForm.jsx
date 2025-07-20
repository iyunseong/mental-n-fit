// src/components/MealLogForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase, auth } from '@/lib/supabase';
import { Calendar, Search, Plus, Trash2, Coffee, Sun, Moon, Cookie } from 'lucide-react';

const MealLogForm = ({ onDataSaved }) => {
  // 메인 상태
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeMeal, setActiveMeal] = useState('breakfast'); // 'breakfast', 'lunch', 'dinner', 'snack'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // 각 식사별 추가된 음식들
  const [meals, setMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  });
  
  // 폼 상태
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 식사 탭 설정
  const mealTabs = [
    { key: 'breakfast', label: '아침', icon: Coffee, color: 'orange' },
    { key: 'lunch', label: '점심', icon: Sun, color: 'yellow' },
    { key: 'dinner', label: '저녁', icon: Moon, color: 'purple' },
    { key: 'snack', label: '간식', icon: Cookie, color: 'pink' }
  ];

  // 음식 검색 함수
  const searchFoods = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      
      // Supabase에서 음식 데이터 검색 (ilike 사용)
      const { data, error } = await supabase
        .from('food_db')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) {
        console.error('음식 검색 오류:', error);
        return;
      }

      setSearchResults(data || []);
    } catch (err) {
      console.error('검색 중 오류:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // 검색어 변경 시 실시간 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFoods(searchQuery);
    }, 300); // 300ms 디바운스

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 음식을 현재 식사에 추가
  const addFoodToMeal = (food) => {
    const newItem = {
      id: Date.now() + Math.random(), // 임시 ID
      food_id: food.id,
      name: food.name,
      calories_per_100g: food.calories_per_100g || 0,
      protein_per_100g: food.protein_per_100g || 0,
      carbs_per_100g: food.carbs_per_100g || 0,
      fat_per_100g: food.fat_per_100g || 0,
      quantity: 100 // 기본 100g
    };

    setMeals(prev => ({
      ...prev,
      [activeMeal]: [...prev[activeMeal], newItem]
    }));

    // 검색 결과 초기화
    setSearchQuery('');
    setSearchResults([]);
  };

  // 음식 제거
  const removeFoodFromMeal = (itemId) => {
    setMeals(prev => ({
      ...prev,
      [activeMeal]: prev[activeMeal].filter(item => item.id !== itemId)
    }));
  };

  // 수량 변경
  const updateQuantity = (itemId, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    
    setMeals(prev => ({
      ...prev,
      [activeMeal]: prev[activeMeal].map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    }));
  };

  // 칼로리 계산
  const calculateCalories = (item) => {
    return Math.round((item.calories_per_100g * item.quantity) / 100);
  };

  // 전체 칼로리 계산
  const getTotalCalories = (mealItems) => {
    return mealItems.reduce((total, item) => total + calculateCalories(item), 0);
  };

  // 식사 로그 저장
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');
      setMessage('');

      // 현재 사용자 확인
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // 모든 식사에서 음식이 있는지 확인
      const allMeals = Object.values(meals).flat();
      if (allMeals.length === 0) {
        setError('최소 하나의 음식을 추가해주세요.');
        return;
      }

      // 각 식사별로 저장
      for (const [mealType, mealItems] of Object.entries(meals)) {
        if (mealItems.length === 0) continue;

        // meal_events 테이블에 식사 이벤트 저장
        const { data: mealEvent, error: mealEventError } = await supabase
          .from('meal_events')
          .insert({
            user_id: currentUser.id,
            log_date: logDate,
            meal_type: mealType,
            total_calories: getTotalCalories(mealItems),
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (mealEventError) throw mealEventError;

        // meal_items 테이블에 각 음식 아이템 저장
        const mealItemsData = mealItems.map(item => ({
          meal_event_id: mealEvent.id,
          food_id: item.food_id,
          quantity: item.quantity,
          calories: calculateCalories(item)
        }));

        const { error: mealItemsError } = await supabase
          .from('meal_items')
          .insert(mealItemsData);

        if (mealItemsError) throw mealItemsError;
      }

      setMessage('식사 로그가 성공적으로 저장되었습니다!');
      
      // 부모 컴포넌트에 데이터 저장 완료 알림
      if (onDataSaved) {
        onDataSaved();
      }

      // 폼 초기화
      setMeals({
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
      });
      setLogDate(new Date().toISOString().split('T')[0]);
      setActiveMeal('breakfast');

    } catch (err) {
      console.error('식사 로그 저장 오류:', err);
      setError(err.message || '식사 로그 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-6">
        <Calendar className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">식사 기록</h2>
      </div>

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

      {/* 날짜 입력 */}
      <div className="mb-6">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4" />
          <span>식사 날짜</span>
        </label>
        <input
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* 식사 탭 */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {mealTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveMeal(tab.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeMeal === tab.key
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
                {meals[tab.key].length > 0 && (
                  <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                    {meals[tab.key].length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 음식 검색 */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="음식을 검색하세요..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
            </div>
          )}
        </div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((food) => (
              <button
                key={food.id}
                onClick={() => addFoodToMeal(food)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{food.name}</div>
                    <div className="text-sm text-gray-500">
                      {food.calories_per_100g}kcal/100g
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-green-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 현재 식사 목록 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {mealTabs.find(tab => tab.key === activeMeal)?.label} 목록 
          <span className="text-sm font-normal text-gray-500 ml-2">
            (총 {getTotalCalories(meals[activeMeal])}kcal)
          </span>
        </h3>

        {meals[activeMeal].length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>아직 추가된 음식이 없습니다.</p>
            <p className="text-sm">위에서 음식을 검색하여 추가해보세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals[activeMeal].map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {calculateCalories(item)}kcal
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, e.target.value)}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-500">g</span>
                </div>
                
                <button
                  onClick={() => removeFoodFromMeal(item.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isLoading || Object.values(meals).flat().length === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          <span>{isLoading ? '저장 중...' : '식사 로그 저장'}</span>
        </button>
      </div>
    </div>
  );
};

export default MealLogForm; 