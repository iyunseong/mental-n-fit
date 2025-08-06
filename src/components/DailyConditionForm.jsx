// src/components/DailyConditionForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase, auth } from '@/lib/supabase';
import { Calendar, Heart, Battery, Moon, Save, RefreshCw } from 'lucide-react';

const DailyConditionForm = ({ onDataSaved }) => {
  // 메인 상태
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [overallMood, setOverallMood] = useState('normal');
  const [fatigueLevel, setFatigueLevel] = useState('medium');
  const [sleepQuality, setSleepQuality] = useState('normal');
  
  // 폼 상태
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [existingRecord, setExistingRecord] = useState(null);

  // 기분 옵션
  const moodOptions = [
    { value: 'great', label: '최고', emoji: '🤩', color: 'text-green-600' },
    { value: 'good', label: '좋음', emoji: '😊', color: 'text-blue-600' },
    { value: 'normal', label: '보통', emoji: '😐', color: 'text-gray-600' },
    { value: 'bad', label: '나쁨', emoji: '😔', color: 'text-orange-600' },
    { value: 'awful', label: '최악', emoji: '😵', color: 'text-red-600' }
  ];

  // 피로도 옵션
  const fatigueOptions = [
    { value: 'low', label: '낮음', emoji: '⚡', color: 'text-green-600' },
    { value: 'medium', label: '보통', emoji: '🔋', color: 'text-yellow-600' },
    { value: 'high', label: '높음', emoji: '🪫', color: 'text-red-600' }
  ];

  // 수면의 질 옵션
  const sleepOptions = [
    { value: 'good', label: '좋음', emoji: '😴', color: 'text-green-600' },
    { value: 'normal', label: '보통', emoji: '😪', color: 'text-yellow-600' },
    { value: 'bad', label: '나쁨', emoji: '😖', color: 'text-red-600' }
  ];

  // 특정 날짜의 기존 데이터 가져오기
  const fetchExistingData = async (date) => {
    try {
      setIsLoading(true);
      setError('');

      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      const { data, error: fetchError } = await supabase
        .from('daily_conditions')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('log_date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116은 데이터가 없을 때 발생하는 에러
        throw fetchError;
      }

      if (data) {
        setExistingRecord(data);
        setOverallMood(data.overall_mood);
        setFatigueLevel(data.fatigue_level);
        setSleepQuality(data.sleep_quality);
      } else {
        setExistingRecord(null);
        // 기본값으로 리셋
        setOverallMood('normal');
        setFatigueLevel('medium');
        setSleepQuality('normal');
      }
    } catch (err) {
      console.error('데이터 가져오기 오류:', err);
      setError(err.message || '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 날짜 변경 시 해당 날짜의 데이터 가져오기
  useEffect(() => {
    fetchExistingData(logDate);
  }, [logDate]);

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError('');
      setMessage('');

      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      const conditionData = {
        user_id: currentUser.id,
        log_date: logDate,
        overall_mood: overallMood,
        fatigue_level: fatigueLevel,
        sleep_quality: sleepQuality,
        updated_at: new Date().toISOString()
      };

      // upsert 사용 (있으면 업데이트, 없으면 생성)
      const { data, error: upsertError } = await supabase
        .from('daily_conditions')
        .upsert(conditionData, {
          onConflict: 'user_id, log_date'
        })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      setExistingRecord(data);
      setMessage(
        existingRecord 
          ? '컨디션이 성공적으로 업데이트되었습니다!' 
          : '컨디션이 성공적으로 저장되었습니다!'
      );

      // 부모 컴포넌트에 데이터 저장 완료 알림
      if (onDataSaved) {
        onDataSaved();
      }

    } catch (err) {
      console.error('컨디션 저장 오류:', err);
      setError(err.message || '컨디션 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-6">
        <Heart className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold text-gray-800">데일리 컨디션</h2>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 날짜 선택 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4" />
            <span>날짜 선택</span>
          </label>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            disabled={isLoading}
          />
          {existingRecord && (
            <p className="text-sm text-blue-600 mt-1">
              ℹ️ 이 날짜에 이미 기록이 있습니다. 수정 후 저장하면 업데이트됩니다.
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-pink-500" />
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 전반적인 기분 */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                <Heart className="w-4 h-4" />
                <span>전반적인 기분</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {moodOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      overallMood === option.value
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="overallMood"
                      value={option.value}
                      checked={overallMood === option.value}
                      onChange={(e) => setOverallMood(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className={`text-sm font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 피로도 */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                <Battery className="w-4 h-4" />
                <span>피로도</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {fatigueOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      fatigueLevel === option.value
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fatigueLevel"
                      value={option.value}
                      checked={fatigueLevel === option.value}
                      onChange={(e) => setFatigueLevel(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className={`text-sm font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 수면의 질 */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                <Moon className="w-4 h-4" />
                <span>수면의 질</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {sleepOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      sleepQuality === option.value
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sleepQuality"
                      value={option.value}
                      checked={sleepQuality === option.value}
                      onChange={(e) => setSleepQuality(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className={`text-sm font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-3 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:bg-gray-400 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving 
                    ? '저장 중...' 
                    : existingRecord 
                      ? '컨디션 업데이트' 
                      : '컨디션 저장'
                  }
                </span>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default DailyConditionForm; 