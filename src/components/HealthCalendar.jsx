// src/components/HealthCalendar.jsx
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase, auth } from '@/lib/supabase';

const HealthCalendar = () => {
  // 상태 관리
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlyMoods, setMonthlyMoods] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 기분 이모지 매핑
  const moodEmojis = {
    great: '🤩',
    good: '😊', 
    normal: '😐',
    bad: '😔',
    awful: '😵'
  };

  // 현재 보이는 달의 데이터 가져오기
  const fetchMonthlyMoods = async (date) => {
    try {
      setIsLoading(true);
      setError('');

      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // 월의 시작일과 마지막일 계산
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error: fetchError } = await supabase
        .from('daily_conditions')
        .select('log_date, overall_mood, fatigue_level, sleep_quality')
        .eq('user_id', currentUser.id)
        .gte('log_date', firstDay)
        .lte('log_date', lastDay)
        .order('log_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // 날짜를 키로 하는 객체로 변환
      const moodsByDate = {};
      data.forEach(record => {
        moodsByDate[record.log_date] = record;
      });

      setMonthlyMoods(moodsByDate);

    } catch (err) {
      console.error('월별 컨디션 데이터 가져오기 오류:', err);
      setError(err.message || '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 및 보이는 달이 변경될 때 데이터 가져오기
  useEffect(() => {
    fetchMonthlyMoods(selectedDate);
  }, []);

  // 날짜 선택 핸들러
  const handleDateChange = (date) => {
    setSelectedDate(date);
    console.log('선택된 날짜:', date.toISOString().split('T')[0]);
  };

  // 캘린더 뷰 변경 시 (월 변경) 핸들러
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    if (activeStartDate) {
      fetchMonthlyMoods(activeStartDate);
    }
  };

  // 각 날짜 타일에 표시할 내용
  const getTileContent = ({ date, view }) => {
    // 월 뷰에서만 표시
    if (view !== 'month') {
      return null;
    }

    const dateString = date.toISOString().split('T')[0];
    const moodData = monthlyMoods[dateString];
    
    if (!moodData) {
      return null;
    }

    const moodEmoji = moodEmojis[moodData.overall_mood];
    
    return (
      <div className="flex flex-col items-center justify-center mt-1">
        <span className="text-lg">{moodEmoji}</span>
        <div className="flex space-x-1 mt-1">
          {/* 피로도 표시 (작은 점들) */}
          <div className={`w-1 h-1 rounded-full ${
            moodData.fatigue_level === 'low' ? 'bg-green-400' :
            moodData.fatigue_level === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
          }`}></div>
          {/* 수면의 질 표시 (작은 점들) */}
          <div className={`w-1 h-1 rounded-full ${
            moodData.sleep_quality === 'good' ? 'bg-blue-400' :
            moodData.sleep_quality === 'normal' ? 'bg-gray-400' : 'bg-purple-400'
          }`}></div>
        </div>
      </div>
    );
  };

  // 특정 날짜에 클래스 추가 (기록이 있는 날짜 스타일링)
  const getTileClassName = ({ date, view }) => {
    if (view !== 'month') {
      return null;
    }

    const dateString = date.toISOString().split('T')[0];
    const moodData = monthlyMoods[dateString];
    
    if (moodData) {
      return 'has-mood-data';
    }
    
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📅 건강 캘린더</h2>
        <p className="text-gray-600">
          매일의 컨디션을 한눈에 확인하세요. 이모지는 기분을, 색상 점들은 피로도(녹/노/빨)와 수면의 질(파/회/보)을 나타냅니다.
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="mb-4 text-center text-gray-600">
          📊 컨디션 데이터를 불러오는 중...
        </div>
      )}

      {/* 범례 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">📖 범례</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* 기분 범례 */}
          <div>
            <h4 className="font-medium text-gray-600 mb-1">기분</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span>🤩</span><span>최고</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>😊</span><span>좋음</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>😐</span><span>보통</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>😔</span><span>나쁨</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>😵</span><span>최악</span>
              </div>
            </div>
          </div>
          
          {/* 피로도 범례 */}
          <div>
            <h4 className="font-medium text-gray-600 mb-1">피로도</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div><span>낮음</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div><span>보통</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div><span>높음</span>
              </div>
            </div>
          </div>
          
          {/* 수면의 질 범례 */}
          <div>
            <h4 className="font-medium text-gray-600 mb-1">수면의 질</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div><span>좋음</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div><span>보통</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div><span>나쁨</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      <div className="calendar-container">
        <Calendar
          value={selectedDate}
          onChange={handleDateChange}
          onActiveStartDateChange={handleActiveStartDateChange}
          tileContent={getTileContent}
          tileClassName={getTileClassName}
          locale="ko-KR"
          calendarType="gregory"
          showNeighboringMonth={false}
          next2Label={null}
          prev2Label={null}
          formatDay={(locale, date) => date.getDate().toString()}
        />
      </div>

      {/* 선택된 날짜 정보 */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            📋 {selectedDate.toLocaleDateString('ko-KR')} 컨디션
          </h3>
          {(() => {
            const dateString = selectedDate.toISOString().split('T')[0];
            const moodData = monthlyMoods[dateString];
            
            if (!moodData) {
              return (
                <p className="text-blue-600">
                  이 날의 컨디션 기록이 없습니다. 대시보드에서 기록을 추가해보세요!
                </p>
              );
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{moodEmojis[moodData.overall_mood]}</span>
                  <span className="text-blue-700">
                    기분: <strong>{
                      moodData.overall_mood === 'great' ? '최고' :
                      moodData.overall_mood === 'good' ? '좋음' :
                      moodData.overall_mood === 'normal' ? '보통' :
                      moodData.overall_mood === 'bad' ? '나쁨' : '최악'
                    }</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    moodData.fatigue_level === 'low' ? 'bg-green-400' :
                    moodData.fatigue_level === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-blue-700">
                    피로도: <strong>{
                      moodData.fatigue_level === 'low' ? '낮음' :
                      moodData.fatigue_level === 'medium' ? '보통' : '높음'
                    }</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    moodData.sleep_quality === 'good' ? 'bg-blue-400' :
                    moodData.sleep_quality === 'normal' ? 'bg-gray-400' : 'bg-purple-400'
                  }`}></div>
                  <span className="text-blue-700">
                    수면: <strong>{
                      moodData.sleep_quality === 'good' ? '좋음' :
                      moodData.sleep_quality === 'normal' ? '보통' : '나쁨'
                    }</strong>
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 커스텀 CSS */}
      <style jsx>{`
        .calendar-container {
          display: flex;
          justify-content: center;
        }
        
        .calendar-container :global(.react-calendar) {
          width: 100%;
          max-width: 600px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-family: inherit;
          line-height: 1.125em;
        }
        
        .calendar-container :global(.react-calendar--doubleView) {
          width: 700px;
        }
        
        .calendar-container :global(.react-calendar--doubleView .react-calendar__viewContainer) {
          display: flex;
          margin: -0.5em;
        }
        
        .calendar-container :global(.react-calendar--doubleView .react-calendar__viewContainer > *) {
          width: 50%;
          margin: 0.5em;
        }
        
        .calendar-container :global(.react-calendar *),
        .calendar-container :global(.react-calendar *:before),
        .calendar-container :global(.react-calendar *:after) {
          -moz-box-sizing: border-box;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
        }
        
        .calendar-container :global(.react-calendar button) {
          margin: 0;
          border: 0;
          outline: none;
        }
        
        .calendar-container :global(.react-calendar button:enabled:hover),
        .calendar-container :global(.react-calendar button:enabled:focus) {
          background-color: #f3f4f6;
        }
        
        .calendar-container :global(.react-calendar__navigation) {
          display: flex;
          height: 44px;
          margin-bottom: 1em;
        }
        
        .calendar-container :global(.react-calendar__navigation button) {
          min-width: 44px;
          background: none;
          font-size: 16px;
          font-weight: bold;
        }
        
        .calendar-container :global(.react-calendar__navigation button:enabled:hover),
        .calendar-container :global(.react-calendar__navigation button:enabled:focus) {
          background-color: #f3f4f6;
        }
        
        .calendar-container :global(.react-calendar__month-view__weekdays) {
          text-align: center;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.75em;
        }
        
        .calendar-container :global(.react-calendar__month-view__weekdays__weekday) {
          padding: 0.5em;
        }
        
        .calendar-container :global(.react-calendar__month-view__weekNumbers .react-calendar__tile) {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75em;
          font-weight: bold;
        }
        
        .calendar-container :global(.react-calendar__month-view__days__day--weekend) {
          color: #d10000;
        }
        
        .calendar-container :global(.react-calendar__month-view__days__day--neighboringMonth) {
          color: #9ca3af;
        }
        
        .calendar-container :global(.react-calendar__year-view .react-calendar__tile),
        .calendar-container :global(.react-calendar__decade-view .react-calendar__tile),
        .calendar-container :global(.react-calendar__century-view .react-calendar__tile) {
          padding: 2em 0.5em;
        }
        
        .calendar-container :global(.react-calendar__tile) {
          max-width: 100%;
          padding: 0.75em 0.5em;
          background: none;
          text-align: center;
          line-height: 16px;
          font-size: 0.833em;
          height: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }
        
        .calendar-container :global(.react-calendar__tile:disabled) {
          background-color: #f5f5f5;
        }
        
        .calendar-container :global(.react-calendar__tile:enabled:hover),
        .calendar-container :global(.react-calendar__tile:enabled:focus) {
          background-color: #e5e7eb;
        }
        
        .calendar-container :global(.react-calendar__tile--now) {
          background: #dbeafe;
        }
        
        .calendar-container :global(.react-calendar__tile--now:enabled:hover),
        .calendar-container :global(.react-calendar__tile--now:enabled:focus) {
          background: #bfdbfe;
        }
        
        .calendar-container :global(.react-calendar__tile--hasActive) {
          background: #76a9fa;
        }
        
        .calendar-container :global(.react-calendar__tile--hasActive:enabled:hover),
        .calendar-container :global(.react-calendar__tile--hasActive:enabled:focus) {
          background: #a4b8fc;
        }
        
        .calendar-container :global(.react-calendar__tile--active) {
          background: #3b82f6;
          color: white;
        }
        
        .calendar-container :global(.react-calendar__tile--active:enabled:hover),
        .calendar-container :global(.react-calendar__tile--active:enabled:focus) {
          background: #2563eb;
        }
        
        .calendar-container :global(.react-calendar__tile.has-mood-data) {
          background-color: #fef3cd;
        }
        
        .calendar-container :global(.react-calendar__tile.has-mood-data:hover) {
          background-color: #fde68a;
        }
      `}</style>
    </div>
  );
};

export default HealthCalendar; 