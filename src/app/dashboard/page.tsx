'use client'

import { useState, useEffect, useLayoutEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { auth } from '@/lib/supabase'
import { UserProfile } from '@/lib/authTypes'
import { Activity, Weight, Utensils, Heart, Calendar } from 'lucide-react'
import KPIHeaderClient from '@/components/dashboard/KPIHeaderClient'
import InbodyTrendChart from '@/components/dashboard/InbodyTrendChart'
import VolumeTrendChart from '@/components/dashboard/VolumeTrendChart'
import MealTrendChart from '@/components/dashboard/MealTrendChart'
import DailyConditionForm from '@/components/forms/DailyConditionForm'
import InbodyForm from '@/components/forms/InbodyForm'
import WorkoutLogForm from '@/components/forms/WorkoutLogForm'
import MealLogForm from '@/components/forms/MealLogForm'
import HealthCalendar from '@/components/dashboard/HealthCalendar'
import DailySummarySidebar from '@/components/dashboard/DailySummarySidebar'
import Container from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import NudgeRow from '@/components/dashboard/NudgeRow'
import QuickAddRail from '@/components/dashboard/QuickAddRail'
import RangeToggle from '@/components/dashboard/RangeToggle'
import { getRange } from '@/lib/date/getRange'
import ConditionHistoryDialog from '@/components/dashboard/ConditionHistoryDialog'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'calendar' | 'inbody' | 'workout' | 'meal' | 'condition'>('calendar')
  const [hydrated, setHydrated] = useState(false)

  // 차트 리프레시
  const [inbodyChartRefresh, setInbodyChartRefresh] = useState(0)
  const [workoutChartRefresh, setWorkoutChartRefresh] = useState(0)
  const [mealChartRefresh, setMealChartRefresh] = useState(0)

  // 캘린더/폼 상태
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<'condition' | 'inbody' | 'workout' | 'meal' | null>(null)
  const [expandedSection, setExpandedSection] = useState<'condition' | 'inbody' | 'workout' | 'meal' | null>(null)
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0)

  // 컨디션 “기록 전체 보기” 다이얼로그
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false)

  // 기간 파라미터
  const rangeParam = searchParams.get('range') === '90' ? 90 : 30
  const { fromISO, toISO } = useMemo(() => getRange(rangeParam, 'Asia/Seoul'), [rangeParam])

  // 초기 탭 동기화
  useLayoutEffect(() => {
    try {
      const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
      if (q === 'inbody' || q === 'workout' || q === 'meal' || q === 'condition' || q === 'calendar') {
        setActiveTab(q)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // 사용자 정보
  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          const userProfile = await auth.getUserProfile(currentUser.id)
          setProfile(userProfile)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  // 공통: URL 생성 (탭 전환 시 range 유지)
  const withRange = (tab: string) => `/dashboard?tab=${tab}&range=${rangeParam}`

  // 캘린더 날짜 선택
  const handleCalendarDateSelect = (date: string) => {
    setSelectedCalendarDate(date)
    setEditingSection(null)
    setExpandedSection(null)
  }

  // 컨디션 다이얼로그에서 날짜 클릭 시: 캘린더 탭으로 보내고 해당 날짜 컨디션 폼 오픈
  const openConditionForDate = (dateISO: string) => {
    setSelectedCalendarDate(dateISO)
    setActiveTab('calendar')
    history.replaceState(null, '', withRange('calendar'))
    setExpandedSection('condition')
    setEditingSection('condition')
    setConditionDialogOpen(false)
  }

  // 저장 핸들러들 → 사이드바/차트 갱신
  const handleInbodySaved = () => { setInbodyChartRefresh(v => v + 1); setSidebarRefreshTrigger(v => v + 1) }
  const handleWorkoutSaved = () => { setWorkoutChartRefresh(v => v + 1); setSidebarRefreshTrigger(v => v + 1) }
  const handleMealSaved   = () => { setMealChartRefresh(v => v + 1); setSidebarRefreshTrigger(v => v + 1) }
  const handleConditionSaved = () => { setSidebarRefreshTrigger(v => v + 1) }

  // 탭 전환 시 편집 초기화(캘린더 제외)
  useEffect(() => {
    if (activeTab !== 'calendar') {
      setEditingSection(null)
      setExpandedSection(null)
    }
  }, [activeTab])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <Container className="py-6">
          {/* 헤더 */}
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
              <p className="text-gray-600">
                안녕하세요, {profile?.nickname || user.email?.split('@')[0]}님! 오늘도 좋은 하루 되세요.
              </p>
            </div>

            {/* 기간 토글 + KPI */}
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="shrink-0">
                <RangeToggle />
              </div>
            </div>
            <div className="mb-6">
              <KPIHeaderClient from={fromISO} to={toISO} />
            </div>

            <div className="mb-6">
              <NudgeRow />
            </div>
          </div>

          {/* 본문 */}
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <div data-testid="tabbar" data-active={hydrated ? activeTab : ''} className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                <button
                  data-testid="tab-calendar"
                  onClick={() => { setActiveTab('calendar'); history.replaceState(null, '', withRange('calendar')) }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>건강 캘린더</span>
                </button>
                <button
                  data-testid="tab-inbody"
                  onClick={() => { setActiveTab('inbody'); history.replaceState(null, '', withRange('inbody')) }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'inbody' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Weight className="w-4 h-4" />
                  <span>InBody 그래프</span>
                </button>
                <button
                  data-testid="tab-workout"
                  onClick={() => { setActiveTab('workout'); history.replaceState(null, '', withRange('workout')) }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'workout' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>운동 그래프</span>
                </button>
                <button
                  data-testid="tab-meal"
                  onClick={() => { setActiveTab('meal'); history.replaceState(null, '', withRange('meal')) }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'meal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>식단 그래프</span>
                </button>
                <button
                  data-testid="tab-condition"
                  onClick={() => { setActiveTab('condition'); history.replaceState(null, '', withRange('condition')) }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'condition' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>컨디션</span>
                </button>
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="mt-4">
              {activeTab === 'calendar' && (
                <div className="space-y-8">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* 좌측: 건강 캘린더 */}
                    <div className="flex-1 lg:w-[65%]">
                      <Card title="📅 건강 캘린더" description="날짜를 클릭하여 해당 날의 상세 기록을 확인/편집하세요.">
                        <HealthCalendar onDateSelect={handleCalendarDateSelect} compact />
                      </Card>
                    </div>

                    {/* 우측: 요약 + 빠른추가 */}
                    <div className="flex-1 lg:w-[35%]">
                      {selectedCalendarDate ? (
                        <Card title="🗂️ 선택한 날짜 요약" description={selectedCalendarDate ?? undefined}>
                          <div className="mb-4">
                            <QuickAddRail dateISO={selectedCalendarDate ?? ''} />
                          </div>
                          <DailySummarySidebar
                            selectedDate={selectedCalendarDate ?? ''}
                            onEditCondition={() => { setExpandedSection('condition'); setEditingSection('condition') }}
                            onEditWorkout={() => { setExpandedSection('workout'); setEditingSection('workout') }}
                            onEditMeal={() => { setExpandedSection('meal'); setEditingSection('meal') }}
                            onEditInbody={() => { setExpandedSection('inbody'); setEditingSection('inbody') }}
                            refreshTrigger={sidebarRefreshTrigger}
                          />
                        </Card>
                      ) : (
                        <Card title="날짜를 선택하세요" description="캘린더에서 날짜를 선택하면 해당 날짜의 기록을 확인할 수 있습니다.">
                          <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                              <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* 선택된 섹션 편집(캘린더 뷰에서만 표시) */}
                  {expandedSection && editingSection && (
                    <div className="mt-8">
                      <Card>
                        {editingSection === 'condition' && (
                          <DailyConditionForm
                            selectedDate={selectedCalendarDate || ''}
                            onSave={() => { setEditingSection(null); setExpandedSection(null); handleConditionSaved() }}
                            onCancel={() => { setEditingSection(null); setExpandedSection(null) }}
                            onDataSaved={handleConditionSaved}
                          />
                        )}

                        {editingSection === 'workout' && (
                          <WorkoutLogForm
                            selectedDate={selectedCalendarDate || ''}
                            onSave={() => { setEditingSection(null); setExpandedSection(null); handleWorkoutSaved() }}
                            onCancel={() => { setEditingSection(null); setExpandedSection(null) }}
                            onDataSaved={handleWorkoutSaved}
                          />
                        )}

                        {editingSection === 'meal' && (
                          <MealLogForm
                            selectedDate={selectedCalendarDate || ''}
                            onSave={() => { setEditingSection(null); setExpandedSection(null); handleMealSaved() }}
                            onCancel={() => { setEditingSection(null); setExpandedSection(null) }}
                            onDataSaved={handleMealSaved}
                          />
                        )}

                        {/* InBody도 캘린더에서 열고 싶다면 유지 */}
                        {editingSection === 'inbody' && (
                          <InbodyForm
                            onDataSaved={() => { handleInbodySaved(); setEditingSection(null); setExpandedSection(null) }}
                          />
                        )}
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'inbody' && (
                <div className="space-y-8">
                  <Card title="📈 InBody 추세 분석" description="체중(7d MA)과 체성분 변화를 확인하세요.">
                    <InbodyTrendChart refreshTrigger={inbodyChartRefresh} from={fromISO} to={toISO} />
                  </Card>
                </div>
              )}

              {activeTab === 'workout' && (
                <div className="space-y-8">
                  <Card title="📊 운동 볼륨/유산소 추세" description="일별 근력 볼륨과 유산소 시간을 확인하세요.">
                    <VolumeTrendChart refreshTrigger={workoutChartRefresh} from={fromISO} to={toISO} />
                  </Card>
                </div>
              )}

              {activeTab === 'meal' && (
                <div className="space-y-8">
                  <Card title="📈 칼로리/매크로 추세" description="일별 총칼로리와 탄/단/지 분포를 확인하세요.">
                    <MealTrendChart refreshTrigger={mealChartRefresh} from={fromISO} to={toISO} />
                  </Card>
                </div>
              )}

              {activeTab === 'condition' && (
                <div className="space-y-6">
                  <Card title="컨디션 기록" description="‘기록 전체 보기’를 눌러 날짜를 선택해 보세요.">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">전체 컨디션 기록을 달력에서 한눈에 보고, 날짜를 클릭해 편집할 수 있습니다.</p>
                      <button
                        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
                        onClick={() => setConditionDialogOpen(true)}
                      >
                        기록 전체 보기
                      </button>
                    </div>
                  </Card>

                  <Card>
                    <p className="text-sm text-gray-600">
                      컨디션 입력은 캘린더에서 해당 날짜를 선택하면 바로 편집할 수 있어요. (그래프는 추후 추가 가능)
                    </p>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>

      {/* 컨디션 전체보기 다이얼로그 */}
      <ConditionHistoryDialog
        open={conditionDialogOpen}
        onClose={() => setConditionDialogOpen(false)}
        onPickDate={openConditionForDate}
      />
    </div>
  )
}
