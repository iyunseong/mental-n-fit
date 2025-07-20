import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase, auth } from '@/lib/supabase';

const InbodyTrendChart = ({ refreshTrigger }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [timeRange, setTimeRange] = useState('1year'); // '1year' 또는 'all'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      // Supabase에서 인바디 데이터 가져오기 (날짜순 정렬)
      const { data: inbodyData, error: fetchError } = await supabase
        .from('inbody_logs')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('log_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // 데이터 형식 변환
      const formattedData = inbodyData.map(item => ({
        ...item,
        date: item.log_date,
        displayDate: new Date(item.log_date).toLocaleDateString('ko-KR', {
          month: '2-digit',
          day: '2-digit'
        })
      }));

      setData(formattedData);
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
  const getYAxisDomains = () => {
    if (filteredData.length === 0) {
      return { kgDomain: [0, 50], percentageDomain: [0, 30] };
    }

    // 골격근량 범위 계산
    const muscleMasses = filteredData
      .map(d => d.skeletal_muscle_mass_kg)
      .filter(val => val !== null && val !== undefined);
    
    // 체지방률 범위 계산
    const bodyFats = filteredData
      .map(d => d.body_fat_percentage)
      .filter(val => val !== null && val !== undefined);

    let kgDomain = [0, 50];
    let percentageDomain = [0, 30];

    if (muscleMasses.length > 0) {
      const minMuscle = Math.min(...muscleMasses);
      const maxMuscle = Math.max(...muscleMasses);
      const margin = (maxMuscle - minMuscle) * 0.1 || 5; // 10% 마진 또는 최소 5
      kgDomain = [
        Math.max(0, minMuscle - margin),
        maxMuscle + margin
      ];
    }

    if (bodyFats.length > 0) {
      const minFat = Math.min(...bodyFats);
      const maxFat = Math.max(...bodyFats);
      const margin = (maxFat - minFat) * 0.1 || 3; // 10% 마진 또는 최소 3
      percentageDomain = [
        Math.max(0, minFat - margin),
        maxFat + margin
      ];
    }

    return { kgDomain, percentageDomain };
  };

  const { kgDomain, percentageDomain } = getYAxisDomains();

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-md">
          <p className="font-medium">{`날짜: ${new Date(data.date).toLocaleDateString('ko-KR')}`}</p>
          <p className="text-blue-600">{`골격근량: ${data.skeletal_muscle_mass_kg?.toFixed(1) || 'N/A'} kg`}</p>
          <p className="text-red-600">{`체지방률: ${data.body_fat_percentage?.toFixed(1) || 'N/A'} %`}</p>
          <p className="text-green-600">{`체중: ${data.weight_kg?.toFixed(1) || 'N/A'} kg`}</p>
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
        <div className="text-gray-600">표시할 데이터가 없습니다.</div>
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
          <LineChart data={filteredData} margin={{ top: 5, right: 80, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
            />
            {/* 왼쪽 Y축 - 골격근량 (kg) */}
            <YAxis 
              yAxisId="kg"
              orientation="left"
              tick={{ fontSize: 12 }}
              label={{ value: '골격근량 (kg)', angle: -90, position: 'insideLeft' }}
              domain={kgDomain}
            />
            {/* 오른쪽 Y축 - 체지방률 (%) */}
            <YAxis 
              yAxisId="percentage"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: '체지방률 (%)', angle: 90, position: 'insideRight' }}
              domain={percentageDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* 골격근량 라인 */}
            <Line
              yAxisId="kg"
              type="monotone"
              dataKey="skeletal_muscle_mass_kg"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              name="골격근량 (kg)"
              connectNulls={false}
            />
            
            {/* 체지방률 라인 */}
            <Line
              yAxisId="percentage"
              type="monotone"
              dataKey="body_fat_percentage"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ fill: '#EF4444', r: 4 }}
              name="체지방률 (%)"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 데이터 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
        <div className="text-center">
          <div className="font-medium">총 기록 수</div>
          <div className="text-lg font-bold text-blue-600">{filteredData.length}개</div>
        </div>
        <div className="text-center">
          <div className="font-medium">기간</div>
          <div className="text-lg font-bold text-green-600">
            {timeRange === '1year' ? '최근 1년' : '전체 기간'}
          </div>
        </div>
        <div className="text-center">
          <div className="font-medium">최신 기록</div>
          <div className="text-lg font-bold text-purple-600">
            {filteredData.length > 0 
              ? new Date(filteredData[filteredData.length - 1].date).toLocaleDateString('ko-KR')
              : 'N/A'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default InbodyTrendChart; 