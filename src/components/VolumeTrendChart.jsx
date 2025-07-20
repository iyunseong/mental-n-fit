// src/components/VolumeTrendChart.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase, auth } from '@/lib/supabase';

const VolumeTrendChart = ({ refreshTrigger }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [timeRange, setTimeRange] = useState('1year'); // '1year' 또는 'all'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 워크아웃 데이터에서 총 볼륨 계산
  const calculateTotalVolume = (workoutData) => {
    if (!workoutData || !Array.isArray(workoutData)) {
      return 0;
    }

    let totalVolume = 0;
    
    workoutData.forEach(exercise => {
      if (exercise.sets && Array.isArray(exercise.sets)) {
        exercise.sets.forEach(set => {
          const reps = parseInt(set.reps) || 0;
          const weight = parseFloat(set.weight_kg) || 0;
          totalVolume += reps * weight;
        });
      }
    });

    return totalVolume;
  };

  // 데이터 처리: 같은 날짜의 운동들은 볼륨 합산
  const processWorkoutData = (rawData) => {
    const dateVolumeMap = {};

    rawData.forEach(workout => {
      const date = workout.log_date;
      const volume = calculateTotalVolume(workout.workout_data);
      
      if (dateVolumeMap[date]) {
        dateVolumeMap[date] += volume;
      } else {
        dateVolumeMap[date] = volume;
      }
    });

    // 배열로 변환하고 날짜순 정렬
    const processedData = Object.entries(dateVolumeMap)
      .map(([date, totalVolume]) => ({
        date,
        totalVolume,
        displayDate: new Date(date).toLocaleDateString('ko-KR', {
          month: '2-digit',
          day: '2-digit'
        })
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return processedData;
  };

  // 데이터 가져오기
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // 현재 로그인된 사용자 확인
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // Supabase에서 운동 로그 데이터 가져오기 (날짜순 정렬)
      const { data: workoutData, error: fetchError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('log_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // 데이터 처리
      const processedData = processWorkoutData(workoutData);
      setData(processedData);
    } catch (err) {
      console.error('데이터 가져오기 오류:', err);
      setError(err.message || '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 시간 범위에 따른 데이터 필터링
  const filterDataByTimeRange = () => {
    if (timeRange === 'all') {
      setFilteredData(data);
      return;
    }

    // 1년 전 날짜 계산
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const filtered = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= oneYearAgo;
    });

    setFilteredData(filtered);
  };

  // 컴포넌트 마운트 시 및 refreshTrigger 변경 시 데이터 가져오기
  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  // 데이터나 시간 범위 변경 시 필터링
  useEffect(() => {
    filterDataByTimeRange();
  }, [data, timeRange]);

  // Y축 도메인 계산
  const getYAxisDomain = () => {
    if (filteredData.length === 0) {
      return [0, 1000];
    }

    const volumes = filteredData
      .map(d => d.totalVolume)
      .filter(val => val !== null && val !== undefined && val > 0);

    if (volumes.length === 0) {
      return [0, 1000];
    }

    const maxVolume = Math.max(...volumes);
    const minVolume = Math.min(...volumes);
    
    // 데이터 범위에 따른 적절한 마진 계산
    const range = maxVolume - minVolume;
    const margin = range * 0.15 || Math.max(maxVolume * 0.1, 100); // 15% 마진 또는 최소 100
    
    // 최소값에서 마진을 빼되, 0 이하로 내려가지 않도록 함
    const domainMin = Math.max(0, minVolume - margin);
    const domainMax = maxVolume + margin;
    
    return [domainMin, domainMax];
  };

  const yAxisDomain = getYAxisDomain();

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-md">
          <p className="font-medium">{`날짜: ${new Date(data.date).toLocaleDateString('ko-KR')}`}</p>
          <p className="text-blue-600">{`총 볼륨: ${data.totalVolume.toLocaleString()} kg`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-gray-600">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-gray-600">표시할 운동 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* 시간 범위 버튼 */}
      <div className="flex space-x-2">
        <button
          onClick={() => setTimeRange('1year')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            timeRange === '1year'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          1년
        </button>
        <button
          onClick={() => setTimeRange('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            timeRange === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          전체
        </button>
      </div>

      {/* 차트 */}
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: '총 볼륨 (kg)', angle: -90, position: 'insideLeft' }}
              domain={yAxisDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* 볼륨 라인 */}
            <Line
              type="monotone"
              dataKey="totalVolume"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              name="총 볼륨 (kg)"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 데이터 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
        <div className="text-center">
          <div className="font-medium">총 운동 일수</div>
          <div className="text-lg font-bold text-blue-600">{filteredData.length}일</div>
        </div>
        <div className="text-center">
          <div className="font-medium">평균 볼륨</div>
          <div className="text-lg font-bold text-green-600">
            {filteredData.length > 0 
              ? Math.round(filteredData.reduce((sum, item) => sum + item.totalVolume, 0) / filteredData.length).toLocaleString()
              : '0'
            } kg
          </div>
        </div>
        <div className="text-center">
          <div className="font-medium">최대 볼륨</div>
          <div className="text-lg font-bold text-purple-600">
            {filteredData.length > 0 
              ? Math.max(...filteredData.map(d => d.totalVolume)).toLocaleString()
              : '0'
            } kg
          </div>
        </div>
        <div className="text-center">
          <div className="font-medium">기간</div>
          <div className="text-lg font-bold text-orange-600">
            {timeRange === '1year' ? '최근 1년' : '전체 기간'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeTrendChart; 