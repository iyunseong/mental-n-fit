// src/components/InbodyTrendChart.jsx
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
      const formattedData = inbodyData.map((item, index) => ({
        ...item,
        date: item.log_date,
        displayDate: new Date(item.log_date).toLocaleDateString('ko-KR', {
          month: '2-digit',
          day: '2-digit'
        }),
        // 정렬을 위한 날짜 객체
        sortDate: new Date(item.log_date)
      })).sort((a, b) => a.sortDate - b.sortDate)
        .map((item, index) => ({...item, index})); // 정렬 후 인덱스 추가

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
          <LineChart data={filteredData} margin={{ top: 5, right: 120, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="index"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                // 인덱스를 사용하여 해당 데이터의 displayDate 반환
                return filteredData[value]?.displayDate || '';
              }}
            />
            {/* 왼쪽 Y축 - 골격근량 전용 */}
            <YAxis 
              yAxisId="muscle"
              orientation="left"
              tick={{ fontSize: 12 }}
              label={{ value: '골격근량 (kg)', angle: -90, position: 'insideLeft' }}
              domain={[
                (dataMin) => Math.max(0, dataMin - 2),
                (dataMax) => dataMax + 2
              ]}
              tickFormatter={(value) => Math.round(value).toString()}
            />
            {/* 가운데 Y축 - 체중 전용 */}
            <YAxis 
              yAxisId="weight"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: '체중 (kg)', angle: 90, position: 'outside', offset: -40 }}
              domain={[
                (dataMin) => Math.max(0, dataMin - 2),
                (dataMax) => dataMax + 2
              ]}
              tickFormatter={(value) => Math.round(value).toString()}
              axisLine={{ stroke: '#10B981' }}
              tickLine={{ stroke: '#10B981' }}
            />
            {/* 오른쪽 Y축 - 체지방률 전용 */}
            <YAxis 
              yAxisId="fat"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: '체지방률 (%)', angle: 90, position: 'outside', offset: 10 }}
              domain={[
                (dataMin) => Math.max(0, dataMin - 1),
                (dataMax) => dataMax + 1
              ]}
              tickFormatter={(value) => Math.round(value).toString()}
              axisLine={{ stroke: '#EF4444' }}
              tickLine={{ stroke: '#EF4444' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* 골격근량 라인 */}
            <Line
              yAxisId="muscle"
              type="monotone"
              dataKey="skeletal_muscle_mass_kg"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 6 }}
              name="골격근량 (kg)"
              connectNulls={true}
            />
            
            {/* 체중 라인 */}
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight_kg"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', r: 6 }}
              name="체중 (kg)"
              connectNulls={true}
            />
            
            {/* 체지방률 라인 */}
            <Line
              yAxisId="fat"
              type="monotone"
              dataKey="body_fat_percentage"
              stroke="#EF4444"
              strokeWidth={3}
              dot={{ fill: '#EF4444', r: 6 }}
              name="체지방률 (%)"
              connectNulls={true}
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