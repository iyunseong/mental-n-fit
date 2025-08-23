"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase, auth } from '@/lib/supabase'

type Props = { refreshTrigger?: number }

const VolumeTrendChart: React.FC<Props> = ({ refreshTrigger = 0 }) => {
  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'1year' | 'all'>('1year')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const calculateTotalVolume = (workoutData: any[]) => {
    if (!workoutData || !Array.isArray(workoutData)) return 0
    let totalVolume = 0
    workoutData.forEach((exercise: any) => {
      if (exercise.sets && Array.isArray(exercise.sets)) {
        exercise.sets.forEach((set: any) => {
          const reps = parseInt(set.reps) || 0
          const weight = parseFloat(set.weight_kg) || 0
          totalVolume += reps * weight
        })
      }
    })
    return totalVolume
  }

  const processWorkoutData = useCallback((rawData: any[]) => {
    const dateVolumeMap: Record<string, number> = {}
    rawData.forEach((workout: any) => {
      const date = workout.log_date
      const volume = calculateTotalVolume(workout.workout_data)
      if (dateVolumeMap[date]) dateVolumeMap[date] += volume
      else dateVolumeMap[date] = volume
    })
    const processedData = Object.entries(dateVolumeMap).map(([date, totalVolume]) => ({
      date,
      totalVolume,
      displayDate: new Date(date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return processedData
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const currentUser = await auth.getCurrentUser()
      if (!currentUser) throw new Error('로그인이 필요합니다.')
      const { data: workoutData, error: fetchError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('log_date', { ascending: true })
      if (fetchError) throw fetchError
      const processed = processWorkoutData(workoutData || [])
      setData(processed)
    } catch (err: any) {
      console.error('데이터 가져오기 오류:', err)
      setError(err?.message || '데이터를 가져오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [processWorkoutData])

  const filterDataByTimeRange = useCallback(() => {
    if (timeRange === 'all') { setFilteredData(data); return }
    const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const filtered = data.filter((item: any) => new Date(item.date) >= oneYearAgo)
    setFilteredData(filtered)
  }, [data, timeRange])

  useEffect(() => { fetchData() }, [fetchData, refreshTrigger])
  useEffect(() => { filterDataByTimeRange() }, [filterDataByTimeRange])

  const getYAxisDomain = (): [number, number] => {
    if (filteredData.length === 0) return [0, 1000]
    const volumes = filteredData.map(d => d.totalVolume).filter((v: number) => v && v > 0)
    if (volumes.length === 0) return [0, 1000]
    const maxVolume = Math.max(...volumes)
    const minVolume = Math.min(...volumes)
    const range = maxVolume - minVolume
    const margin = range * 0.15 || Math.max(maxVolume * 0.1, 100)
    const domainMin = Math.max(0, minVolume - margin)
    const domainMax = maxVolume + margin
    return [domainMin, domainMax]
  }

  const yAxisDomain = getYAxisDomain()

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-md">
          <p className="font-medium">{`날짜: ${new Date(row.date).toLocaleDateString('ko-KR')}`}</p>
          <p className="text-blue-600">{`총 볼륨: ${row.totalVolume.toLocaleString()} kg`}</p>
        </div>
      )
    }
    return null
  }

  if (loading) return <div className="w-full h-96 flex items-center justify-center"><div className="text-gray-600">데이터를 불러오는 중...</div></div>
  if (error) return <div className="w-full h-96 flex items-center justify-center"><div className="text-red-600">{error}</div></div>
  if (filteredData.length === 0) return <div className="w-full h-96 flex items-center justify-center"><div className="text-gray-600">표시할 운동 데이터가 없습니다.</div></div>

  return (
    <div className="w-full space-y-4">
      <div className="flex space-x-2">
        <button onClick={() => setTimeRange('1year')} className={`px-4 py-2 rounded-lg transition-colors ${timeRange === '1year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>1년</button>
        <button onClick={() => setTimeRange('all')} className={`px-4 py-2 rounded-lg transition-colors ${timeRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>전체</button>
      </div>
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: '총 볼륨 (kg)', angle: -90, position: 'insideLeft' }} domain={yAxisDomain as any} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="totalVolume" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} name="총 볼륨 (kg)" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
        <div className="text-center"><div className="font-medium">총 운동 일수</div><div className="text-lg font-bold text-blue-600">{filteredData.length}일</div></div>
        <div className="text-center"><div className="font-medium">평균 볼륨</div><div className="text-lg font-bold text-green-600">{filteredData.length > 0 ? Math.round(filteredData.reduce((s: number, it: any) => s + it.totalVolume, 0) / filteredData.length).toLocaleString() : '0'} kg</div></div>
        <div className="text-center"><div className="font-medium">최대 볼륨</div><div className="text-lg font-bold text-purple-600">{filteredData.length > 0 ? Math.max(...filteredData.map(d => d.totalVolume)).toLocaleString() : '0'} kg</div></div>
        <div className="text-center"><div className="font-medium">기간</div><div className="text-lg font-bold text-orange-600">{timeRange === '1year' ? '최근 1년' : '전체 기간'}</div></div>
      </div>
    </div>
  )
}

export default VolumeTrendChart


