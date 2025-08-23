"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase, auth } from '@/lib/supabase'

type Props = { refreshTrigger?: number }

const MealTrendChart: React.FC<Props> = ({ refreshTrigger = 0 }) => {
  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'1year' | 'all'>('1year')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const processMealData = (rawData: any[]) => {
    const dateCaloriesMap: Record<string, number> = {}
    rawData.forEach(meal => {
      const date = meal.ate_at.split('T')[0]
      const calories = meal.total_calories || 0
      if (dateCaloriesMap[date]) dateCaloriesMap[date] += calories
      else dateCaloriesMap[date] = calories
    })
    const processedData = Object.entries(dateCaloriesMap).map(([date, totalCalories]) => ({
      date,
      totalCalories,
      displayDate: new Date(date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return processedData
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const currentUser = await auth.getCurrentUser()
      if (!currentUser) throw new Error('로그인이 필요합니다.')
      const { data: mealData, error: fetchError } = await supabase
        .from('meal_events')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('ate_at', { ascending: true })
      if (fetchError) throw fetchError
      const processed = processMealData(mealData || [])
      setData(processed)
    } catch (err: any) {
      console.error('데이터 가져오기 오류:', err)
      setError(err?.message || '데이터를 가져오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  const filterDataByTimeRange = useCallback(() => {
    if (timeRange === 'all') { setFilteredData(data); return }
    const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const filtered = data.filter((item: any) => new Date(item.date) >= oneYearAgo)
    setFilteredData(filtered)
  }, [data, timeRange])

  useEffect(() => { fetchData() }, [fetchData, refreshTrigger])
  useEffect(() => { filterDataByTimeRange() }, [filterDataByTimeRange])

  const getYAxisDomain = (): [number, number] => {
    if (filteredData.length === 0) return [0, 2500]
    const calories = filteredData.map(d => d.totalCalories).filter((v: number) => v && v > 0)
    if (calories.length === 0) return [0, 2500]
    const maxCalories = Math.max(...calories)
    const minCalories = Math.min(...calories)
    const range = maxCalories - minCalories
    const margin = range * 0.15 || Math.max(maxCalories * 0.1, 200)
    const domainMin = Math.max(0, minCalories - margin)
    const domainMax = maxCalories + margin
    return [domainMin, domainMax]
  }

  const yAxisDomain = getYAxisDomain()

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-md">
          <p className="font-medium">{`날짜: ${new Date(row.date).toLocaleDateString('ko-KR')}`}</p>
          <p className="text-orange-600">{`총 섭취 칼로리: ${row.totalCalories.toLocaleString()} kcal`}</p>
        </div>
      )
    }
    return null
  }

  if (loading) return <div className="w-full h-96 flex items-center justify-center"><div className="text-gray-600">데이터를 불러오는 중...</div></div>
  if (error) return <div className="w-full h-96 flex items-center justify-center"><div className="text-red-600">{error}</div></div>
  if (filteredData.length === 0) return <div className="w-full h-96 flex items-center justify-center"><div className="text-gray-600">표시할 식단 데이터가 없습니다.</div></div>

  return (
    <div className="w-full space-y-4">
      <div className="flex space-x-2">
        <button onClick={() => setTimeRange('1year')} className={`px-4 py-2 rounded-lg transition-colors ${timeRange === '1year' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>1년</button>
        <button onClick={() => setTimeRange('all')} className={`px-4 py-2 rounded-lg transition-colors ${timeRange === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>전체</button>
      </div>
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: '총 섭취 칼로리 (kcal)', angle: -90, position: 'insideLeft' }} domain={yAxisDomain as any} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="totalCalories" fill="#EA580C" name="총 섭취 칼로리 (kcal)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
        <div className="text-center"><div className="font-medium">총 식사 일수</div><div className="text-lg font-bold text-orange-600">{filteredData.length}일</div></div>
        <div className="text-center"><div className="font-medium">평균 칼로리</div><div className="text-lg font-bold text-green-600">{filteredData.length > 0 ? Math.round(filteredData.reduce((s: number, it: any) => s + it.totalCalories, 0) / filteredData.length).toLocaleString() : '0'} kcal</div></div>
        <div className="text-center"><div className="font-medium">최대 칼로리</div><div className="text-lg font-bold text-purple-600">{filteredData.length > 0 ? Math.max(...filteredData.map(d => d.totalCalories)).toLocaleString() : '0'} kcal</div></div>
        <div className="text-center"><div className="font-medium">기간</div><div className="text-lg font-bold text-blue-600">{timeRange === '1year' ? '최근 1년' : '전체 기간'}</div></div>
      </div>
    </div>
  )
}

export default MealTrendChart


