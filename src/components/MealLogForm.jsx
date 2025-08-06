// src/components/MealLogForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase, auth } from '@/lib/supabase';
import { Calendar, Search, Plus, Trash2, Clock, X, Save } from 'lucide-react';

const MealLogForm = ({ onDataSaved }) => {
  // 메인 상태
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState([]); // 시간순 식사 목록
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Add Meal 모달 상태
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [mealTime, setMealTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentMealFoods, setCurrentMealFoods] = useState([]); // 현재 추가중인 식사의 음식들
  
  // 직접 입력 모드 상태
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualFood, setManualFood] = useState({
    name: '',
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fat_per_100g: '',
    quantity: 100
  });
  
  // 컨텍스트 로깅 상태
  const [hungerLevel, setHungerLevel] = useState('medium');
  const [moodBefore, setMoodBefore] = useState('calm');

  // 기존 식사 데이터 가져오기
  const fetchMeals = async () => {
    try {
      setIsLoading(true);
      setError('');

      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // 선택된 날짜의 식사 이벤트들을 시간순으로 가져오기
      const { data: mealEvents, error: fetchError } = await supabase
        .from('meal_events')
        .select(`
          *,
          meal_items (
            *,
            food_db (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
          )
        `)
        .eq('user_id', currentUser.id)
        .gte('ate_at', `${logDate}T00:00:00.000Z`)
        .lt('ate_at', `${logDate}T23:59:59.999Z`)
        .order('ate_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setMeals(mealEvents || []);
    } catch (err) {
      console.error('식사 데이터 가져오기 오류:', err);
      setError(err.message || '식사 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 날짜 변경 시 데이터 새로고침
  useEffect(() => {
    fetchMeals();
  }, [logDate]);

  // 음식 검색 함수
  const searchFoods = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      
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
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 음식을 현재 식사에 추가
  const addFoodToCurrentMeal = (food) => {
    const newItem = {
      id: Date.now() + Math.random(),
      food_id: food.id || null,
      name: food.name,
      calories_per_100g: food.calories_per_100g || 0,
      protein_per_100g: food.protein_per_100g || 0,
      carbs_per_100g: food.carbs_per_100g || 0,
      fat_per_100g: food.fat_per_100g || 0,
      quantity: food.quantity || 100
    };

    setCurrentMealFoods(prev => [...prev, newItem]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // 현재 식사에서 음식 제거
  const removeFoodFromCurrentMeal = (itemId) => {
    setCurrentMealFoods(prev => prev.filter(item => item.id !== itemId));
  };

  // 수량 변경
  const updateQuantity = (itemId, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    
    setCurrentMealFoods(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  // 칼로리 계산
  const calculateCalories = (item) => {
    return Math.round((item.calories_per_100g * item.quantity) / 100);
  };

  // 전체 칼로리 계산
  const getTotalCalories = (mealItems) => {
    return mealItems.reduce((total, item) => total + calculateCalories(item), 0);
  };

  // 직접 입력 모드 토글
  const toggleManualEntry = () => {
    setIsManualEntry(!isManualEntry);
    setSearchQuery('');
    setSearchResults([]);
    if (!isManualEntry) {
      setManualFood(prev => ({
        ...prev,
        name: searchQuery
      }));
    } else {
      resetManualFood();
    }
  };

  // 직접 입력 폼 초기화
  const resetManualFood = () => {
    setManualFood({
      name: '',
      calories_per_100g: '',
      protein_per_100g: '',
      carbs_per_100g: '',
      fat_per_100g: '',
      quantity: 100
    });
  };

  // 직접 입력한 음식을 현재 식사에 추가
  const addManualFoodToCurrentMeal = () => {
    if (!manualFood.name.trim()) {
      alert('음식 이름을 입력해주세요.');
      return;
    }
    
    if (!manualFood.calories_per_100g || manualFood.calories_per_100g <= 0) {
      alert('칼로리 정보를 올바르게 입력해주세요.');
      return;
    }

    const foodToAdd = {
      name: manualFood.name.trim(),
      calories_per_100g: parseFloat(manualFood.calories_per_100g) || 0,
      protein_per_100g: parseFloat(manualFood.protein_per_100g) || 0,
      carbs_per_100g: parseFloat(manualFood.carbs_per_100g) || 0,
      fat_per_100g: parseFloat(manualFood.fat_per_100g) || 0,
      quantity: parseInt(manualFood.quantity) || 100
    };

    addFoodToCurrentMeal(foodToAdd);
    resetManualFood();
    setIsManualEntry(false);
  };

  // 수동 입력 필드 업데이트
  const updateManualFood = (field, value) => {
    setManualFood(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add Meal 모달 열기
  const openAddMealModal = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM 형식
    setMealTime(currentTime);
    setCurrentMealFoods([]);
    setHungerLevel('medium');
    setMoodBefore('calm');
    setShowAddMealModal(true);
  };

  // Add Meal 모달 닫기
  const closeAddMealModal = () => {
    setShowAddMealModal(false);
    setCurrentMealFoods([]);
    setSearchQuery('');
    setSearchResults([]);
    setIsManualEntry(false);
    resetManualFood();
  };

  // 새 식사 저장
  const handleSubmitNewMeal = async () => {
    try {
      setIsLoading(true);
      setError('');
      setMessage('');

      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      if (currentMealFoods.length === 0) {
        setError('최소 하나의 음식을 추가해주세요.');
        return;
      }

      if (!mealTime) {
        setError('식사 시간을 입력해주세요.');
        return;
      }

      // logDate와 mealTime을 합쳐서 ate_at TIMESTAMPTZ 생성
      const ateAt = new Date(`${logDate}T${mealTime}:00.000Z`).toISOString();

      // meal_events 테이블에 식사 이벤트 저장
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

      // meal_items 테이블에 각 음식 아이템 저장
      const mealItemsData = currentMealFoods.map(item => ({
        meal_event_id: mealEvent.id,
        food_id: item.food_id,
        quantity: item.quantity,
        calories: calculateCalories(item),
        custom_food_name: item.food_id ? null : item.name,
        custom_calories_per_100g: item.food_id ? null : item.calories_per_100g,
        custom_protein_per_100g: item.food_id ? null : item.protein_per_100g,
        custom_carbs_per_100g: item.food_id ? null : item.carbs_per_100g,
        custom_fat_per_100g: item.food_id ? null : item.fat_per_100g
      }));

      const { error: mealItemsError } = await supabase
        .from('meal_items')
        .insert(mealItemsData);

      if (mealItemsError) throw mealItemsError;

      setMessage('식사가 성공적으로 저장되었습니다!');
      
      // 부모 컴포넌트에 데이터 저장 완료 알림
      if (onDataSaved) {
        onDataSaved();
      }

      // 모달 닫기 및 데이터 새로고침
      closeAddMealModal();
      fetchMeals();

    } catch (err) {
      console.error('식사 저장 오류:', err);
      setError(err.message || '식사 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 기존 식사 삭제
  const deleteMeal = async (mealId) => {
    if (!confirm('이 식사를 삭제하시겠습니까?')) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('meal_events')
        .delete()
        .eq('id', mealId);

      if (error) throw error;

      setMessage('식사가 삭제되었습니다.');
      fetchMeals();
    } catch (err) {
      console.error('식사 삭제 오류:', err);
      setError(err.message || '식사 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">식사 기록</h2>
        </div>
        <button
          onClick={openAddMealModal}
          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>식사 추가</span>
        </button>
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

      {/* 날짜 선택 */}
      <div className="mb-6">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4" />
          <span>날짜 선택</span>
        </label>
        <input
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* 식사 목록 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">
          {new Date(logDate).toLocaleDateString('ko-KR')}의 식사 기록
        </h3>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            데이터를 불러오는 중...
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>아직 기록된 식사가 없습니다.</p>
            <p className="text-sm">위의 "식사 추가" 버튼을 클릭해서 식사를 기록해보세요.</p>
          </div>
        ) : (
          meals.map((meal) => (
            <div key={meal.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-lg">
                    {new Date(meal.ate_at).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span className="text-sm text-gray-500">
                    총 {meal.total_calories}kcal
                  </span>
                </div>
                <button
                  onClick={() => deleteMeal(meal.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 컨텍스트 정보 */}
              <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                <span>배고픔: {
                  {low: '매우 배고픔', medium: '배고픔', high: '조금 배고픔', craving: '갈망/욕구'}[meal.hunger_level]
                }</span>
                <span>기분: {
                  {fresh: '상쾌함', calm: '평온함', tired: '피곤함', stressed: '스트레스'}[meal.mood_before]
                }</span>
              </div>

              {/* 음식 목록 */}
              <div className="space-y-2">
                {meal.meal_items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">
                        {item.custom_food_name || item.food_db?.name}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {item.quantity}g
                      </span>
                    </div>
                    <span className="text-sm font-medium">{item.calories}kcal</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Meal 모달 */}
      {showAddMealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">새 식사 추가</h3>
              <button
                onClick={closeAddMealModal}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 시간 입력 */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                <span>식사 시간 *</span>
              </label>
              <input
                type="time"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* 음식 검색/추가 섹션 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-md font-medium text-gray-800">음식 추가</h4>
                  <p className="text-sm text-gray-500">여러 음식을 검색해서 이 식사에 추가하세요</p>
                </div>
                <button
                  onClick={toggleManualEntry}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    isManualEntry
                      ? 'bg-gray-500 text-white hover:bg-gray-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isManualEntry ? '검색 모드' : '직접 입력'}
                </button>
              </div>

              {!isManualEntry ? (
                <>
                  {/* 검색 입력 */}
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="음식을 검색하고 클릭해서 추가하세요..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {isSearching && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                      </div>
                    )}
                  </div>

                  {/* 검색 결과 */}
                  {searchQuery.length >= 2 && (
                    <div className="mb-3">
                      {searchResults.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          <div className="px-3 py-2 bg-green-50 border-b text-sm text-green-700 font-medium">
                            💡 클릭해서 이 식사에 음식을 추가하세요
                          </div>
                          {searchResults.map((food) => (
                            <button
                              key={food.id}
                              onClick={() => {
                                addFoodToCurrentMeal(food);
                                // 성공 피드백을 위한 일시적 하이라이트
                                const button = document.activeElement;
                                button?.classList.add('bg-green-100');
                                setTimeout(() => {
                                  button?.classList.remove('bg-green-100');
                                }, 500);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900">{food.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {food.calories_per_100g}kcal/100g
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-green-600 font-medium">추가하기</span>
                                  <Plus className="w-4 h-4 text-green-500" />
                                </div>
                              </div>
                            </button>
                          ))}
                          <button
                            onClick={toggleManualEntry}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-t border-blue-200 text-blue-600 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">"{searchQuery}" 직접 입력</div>
                                <div className="text-sm">영양정보를 직접 입력합니다</div>
                              </div>
                              <Plus className="w-4 h-4" />
                            </div>
                          </button>
                        </div>
                      ) : !isSearching && (
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-4">
                          <div className="text-center text-gray-500">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="mb-2">검색 결과가 없습니다.</p>
                            <button
                              onClick={toggleManualEntry}
                              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                              "{searchQuery}" 직접 입력하기
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* 직접 입력 모드 */
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-3">
                  <h5 className="font-medium text-blue-800 mb-3">음식 정보 직접 입력</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 음식명 */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        음식명 *
                      </label>
                      <input
                        type="text"
                        value={manualFood.name}
                        onChange={(e) => updateManualFood('name', e.target.value)}
                        placeholder="음식 이름을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 칼로리 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        칼로리 (100g당) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={manualFood.calories_per_100g}
                        onChange={(e) => updateManualFood('calories_per_100g', e.target.value)}
                        placeholder="예: 250"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 단백질 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        단백질 (100g당)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={manualFood.protein_per_100g}
                        onChange={(e) => updateManualFood('protein_per_100g', e.target.value)}
                        placeholder="예: 20"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 탄수화물 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        탄수화물 (100g당)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={manualFood.carbs_per_100g}
                        onChange={(e) => updateManualFood('carbs_per_100g', e.target.value)}
                        placeholder="예: 30"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 지방 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        지방 (100g당)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={manualFood.fat_per_100g}
                        onChange={(e) => updateManualFood('fat_per_100g', e.target.value)}
                        placeholder="예: 10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 수량 */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        섭취량 (g)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={manualFood.quantity}
                        onChange={(e) => updateManualFood('quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* 예상 칼로리 표시 */}
                  {manualFood.calories_per_100g && manualFood.quantity && (
                    <div className="mt-3 p-2 bg-white rounded border">
                      <span className="text-sm text-gray-600">예상 칼로리: </span>
                      <span className="font-medium text-green-600">
                        {Math.round((parseFloat(manualFood.calories_per_100g) * parseInt(manualFood.quantity)) / 100)}kcal
                      </span>
                    </div>
                  )}

                  {/* 추가 버튼 */}
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={addManualFoodToCurrentMeal}
                      disabled={!manualFood.name.trim() || !manualFood.calories_per_100g}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>이 식사에 추가</span>
                    </button>
                    <button
                      onClick={() => setIsManualEntry(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 현재 추가된 음식들 - 항상 표시 */}
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-800 flex items-center space-x-2">
                  <span>🍽️</span>
                  <span>이 식사의 음식들</span>
                </h4>
                {currentMealFoods.length > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">총 {currentMealFoods.length}개 음식</div>
                    <div className="text-lg font-bold text-green-600">{getTotalCalories(currentMealFoods)}kcal</div>
                  </div>
                )}
              </div>

              {currentMealFoods.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="font-medium">아직 추가된 음식이 없습니다</p>
                  <p className="text-sm">위에서 음식을 검색해서 추가해보세요</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {currentMealFoods.map((item, index) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-white rounded-md shadow-sm border">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-green-600">{calculateCalories(item)}kcal</span>
                          <span className="mx-1">•</span>
                          <span>{item.calories_per_100g}kcal/100g</span>
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
                        onClick={() => removeFoodFromCurrentMeal(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="이 음식 제거"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 식사 컨텍스트 로깅 */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">식사 컨텍스트</h4>
              
              {/* 배고픔 정도 */}
              <div className="mb-4">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <span>식사 전 배고픔 정도</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'low', label: '매우 배고픔', emoji: '😋' },
                    { value: 'medium', label: '배고픔', emoji: '🙂' },
                    { value: 'high', label: '조금 배고픔', emoji: '😐' },
                    { value: 'not_hungry', label: '배고프지 않음', emoji: '😌' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                        hungerLevel === option.value
                          ? 'border-green-500 bg-green-50 text-green-700'
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
                      <span className="text-sm">{option.emoji}</span>
                      <span className="text-xs font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 식사 전 기분 */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <span>식사 전 기분</span>
                </label>
                <div className="text-xs text-gray-500 mb-2">
                  💡 피곤함이나 스트레스로 인한 가짜 배고픔을 구분해보세요
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'fresh', label: '상쾌함', emoji: '😊' },
                    { value: 'calm', label: '평온함', emoji: '😌' },
                    { value: 'tired', label: '피곤함', emoji: '😴' },
                    { value: 'anxious', label: '불안함', emoji: '😰' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                        moodBefore === option.value
                          ? 'border-green-500 bg-green-50 text-green-700'
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
                      <span className="text-sm">{option.emoji}</span>
                      <span className="text-xs font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 모달 버튼들 */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeAddMealModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmitNewMeal}
                disabled={isLoading || currentMealFoods.length === 0 || !mealTime}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? '저장 중...' : '식사 저장'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealLogForm; 