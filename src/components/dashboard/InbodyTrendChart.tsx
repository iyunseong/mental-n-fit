"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase, auth } from '@/lib/supabase'

type Props = { refreshTrigger?: number }

const InbodyTrendChart: React.FC<Props> = ({ refreshTrigger = 0 }) => {
  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'1year' | 'all'>('1year')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const currentUser = await auth.getCurrentUser()
      if (!currentUser) throw new Error('로그인이 필요합니다.')
      const { data: inbodyData, error: fetchError } = await supabase
        .from('inbody_logs')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('log_date', { ascending: true })
      if (fetchError) throw fetchError
      const formattedData = (inbodyData || []).map((item: any) => ({
        ...item,
        date: item.log_date,
        displayDate: new Date(item.log_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
        sortDate: new Date(item.log_date)
      })).sort((a: any, b: any) => a.sortDate.getTime() - b.sortDate.getTime())
        .map((item: any, index: number) => ({ ...item, index }))
      setData(formattedData)
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-md">
          <p className="font-medium">{`날짜: ${new Date(row.date).toLocaleDateString('ko-KR')}`}</p>
          <p className="text-blue-600">{`골격근량: ${row.skeletal_muscle_mass_kg?.toFixed?.(1) ?? row.skeletal_muscle_mass_kg ?? 'N/A'} kg`}</p>
          <p className="text-red-600">{`체지방률: ${row.body_fat_percentage?.toFixed?.(1) ?? row.body_fat_percentage ?? 'N/A'} %`}</p>
          <p className="text-green-600">{`체중: ${row.weight_kg?.toFixed?.(1) ?? row.weight_kg ?? 'N/A'} kg`}</p>
        </div>
      )
    }
    return null
  }

  if (loading) return <div className="w-full h-96 flex items-center justify-center"><div className="text-gray-600">데이터를 불러오는 중...</div></div>
  if (error) return <div className="w-full h-96 flex items-center justify-center"><div className="text-red-600">{error}</div></div>
  if (filteredData.length === 0) return <div className="w-full h-96 flex items-center justify-center"><div className="text-gray-600">표시할 데이터가 없습니다.</div></div>

  return (
    <div className="w-full space-y-4">
      <div className="flex space-x-2">
        <button onClick={() => setTimeRange('1year')} className={`px-4 py-2 rounded-lg transition-colors ${timeRange === '1year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>1년</button>
        <button onClick={() => setTimeRange('all')} className={`px-4 py-2 rounded-lg transition-colors ${timeRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>전체</button>
      </div>
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 5, right: 120, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" tick={{ fontSize: 12 }} tickFormatter={(value: number) => filteredData[value]?.displayDate || ''} />
            <YAxis yAxisId="muscle" orientation="left" tick={{ fontSize: 12 }} label={{ value: '골격근량 (kg)', angle: -90, position: 'insideLeft' }} domain={[ (dataMin: number) => Math.max(0, dataMin - 2), (dataMax: number) => dataMax + 2 ]} tickFormatter={(v: number) => Math.round(v).toString()} />
            <YAxis yAxisId="weight" orientation="right" tick={{ fontSize: 12 }} label={{ value: '체중 (kg)', angle: 90, position: 'outside', offset: -40 }} domain={[ (dataMin: number) => Math.max(0, dataMin - 2), (dataMax: number) => dataMax + 2 ]} tickFormatter={(v: number) => Math.round(v).toString()} axisLine={{ stroke: '#10B981' }} tickLine={{ stroke: '#10B981' }} />
            <YAxis yAxisId="fat" orientation="right" tick={{ fontSize: 12 }} label={{ value: '체지방률 (%)', angle: 90, position: 'outside', offset: 10 }} domain={[ (dataMin: number) => Math.max(0, dataMin - 1), (dataMax: number) => dataMax + 1 ]} tickFormatter={(v: number) => Math.round(v).toString()} axisLine={{ stroke: '#EF4444' }} tickLine={{ stroke: '#EF4444' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line yAxisId="muscle" type="monotone" dataKey="skeletal_muscle_mass_kg" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 6 }} name="골격근량 (kg)" connectNulls />
            <Line yAxisId="weight" type="monotone" dataKey="weight_kg" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 6 }} name="체중 (kg)" connectNulls />
            <Line yAxisId="fat" type="monotone" dataKey="body_fat_percentage" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', r: 6 }} name="체지방률 (%)" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
        <div className="text-center"><div className="font-medium">총 기록 수</div><div className="text-lg font-bold text-blue-600">{filteredData.length}개</div></div>
        <div className="text-center"><div className="font-medium">기간</div><div className="text-lg font-bold text-green-600">{timeRange === '1year' ? '최근 1년' : '전체 기간'}</div></div>
        <div className="text-center"><div className="font-medium">최신 기록</div><div className="text-lg font-bold text-purple-600">{filteredData.length > 0 ? new Date(filteredData[filteredData.length - 1].date).toLocaleDateString('ko-KR') : 'N/A'}</div></div>
      </div>
    </div>
  )
}

export default InbodyTrendChart


