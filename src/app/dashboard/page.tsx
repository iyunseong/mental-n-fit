'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { auth } from '@/lib/supabase'
import { UserProfile } from '@/lib/authTypes'
import { Activity, Weight, Utensils, Heart, Calendar } from 'lucide-react'
import InbodyForm from '@/components/InbodyForm'
import WorkoutLogForm from '@/components/WorkoutLogForm'
import InbodyTrendChart from '@/components/InbodyTrendChart'
import VolumeTrendChart from '@/components/VolumeTrendChart'
import MealLogForm from '@/components/MealLogForm'
import MealTrendChart from '@/components/MealTrendChart'
import DailyConditionForm from '@/components/DailyConditionForm'
import HealthCalendar from '@/components/HealthCalendar'
import DailySummarySidebar from '@/components/DailySummarySidebar'
import Container from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  // 전역 NavBar 사용으로 내부 모바일 메뉴 상태 제거
  const [activeTab, setActiveTab] = useState<'calendar' | 'inbody' | 'workout' | 'meal' | 'condition'>('calendar')
  const [chartRefreshTrigger, setChartRefreshTrigger] = useState(0)
  const [workoutChartRefreshTrigger, setWorkoutChartRefreshTrigger] = useState(0)
  const [mealChartRefreshTrigger, setMealChartRefreshTrigger] = useState(0)
  // const [conditionChartRefreshTrigger, setConditionChartRefreshTrigger] = useState(0)

  // 캘린더에서 선택된 날짜 상태
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)

  // 편집 모드 상태들
  const [editingSection, setEditingSection] = useState<'condition' | 'inbody' | 'workout' | 'meal' | null>(null)
  
  // 펼쳐진 섹션 상태
  const [expandedSection, setExpandedSection] = useState<'condition' | 'inbody' | 'workout' | 'meal' | null>(null)

  // 사이드바 데이터 새로고침 트리거
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0)

  // 컴포넌트 마운트 시 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          
          // 프로필 정보도 가져오기
          const userProfile = await auth.getUserProfile(currentUser.id)
          setProfile(userProfile)
        } else {
          // 사용자가 로그인되어 있지 않으면 로그인 페이지로 리다이렉트
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

  // 로그아웃 핸들러
  // 전역 NavBar 사용으로 내부 로그아웃 제거

  // 차트 새로고침 핸들러
  const handleInbodyDataSaved = () => {
    setChartRefreshTrigger(prev => prev + 1);
    setSidebarRefreshTrigger(prev => prev + 1); // 사이드바도 새로고침
  }

  // 워크아웃 차트 새로고침 핸들러
  const handleWorkoutDataSaved = () => {
    setWorkoutChartRefreshTrigger(prev => prev + 1);
    setSidebarRefreshTrigger(prev => prev + 1); // 사이드바도 새로고침
  }

  // 식단 차트 새로고침 핸들러 (식단 차트 추가 시 사용)
  const handleMealDataSaved = () => {
    setMealChartRefreshTrigger(prev => prev + 1);
    setSidebarRefreshTrigger(prev => prev + 1); // 사이드바도 새로고침
  }

  // 컨디션 차트 새로고침 핸들러 (차트 컴포넌트 추가 시 사용)
  const handleConditionDataSaved = () => {
    // setConditionChartRefreshTrigger(prev => prev + 1);
    setSidebarRefreshTrigger(prev => prev + 1); // 사이드바도 새로고침
    console.log('컨디션 데이터가 저장되었습니다'); // 임시: 차트가 추가되면 제거
  }

  // 캘린더 날짜 선택 핸들러
  const handleCalendarDateSelect = (date: string) => {
    setSelectedCalendarDate(date);
    setEditingSection(null); // 날짜 변경 시 편집 모드 해제
    setExpandedSection(null); // 날짜 변경 시 펼친 섹션 해제
  }

  // 편집 섹션 핸들러들
  const handleEditSection = (section: 'condition' | 'inbody' | 'workout' | 'meal') => {
    if (!selectedCalendarDate) {
      // 날짜가 선택되지 않았으면 오늘 날짜로 설정
      const today = new Date().toISOString().split('T')[0];
      setSelectedCalendarDate(today);
    }
    setEditingSection(section);
    setExpandedSection(section);
  }

  const handleSaveSection = () => {
    setEditingSection(null);
    setExpandedSection(null);
    // 데이터가 저장되면 자동으로 새로고침됨 (폼 컴포넌트 내부에서 처리)
  }

  const handleCancelSection = () => {
    setEditingSection(null);
    if (expandedSection) {
      setExpandedSection(null);
    }
  }

  // 탭 변경 시 편집 모드 초기화
  useEffect(() => {
    if (activeTab !== 'calendar') {
      setSelectedCalendarDate(null);
      setEditingSection(null);
      setExpandedSection(null);
    }
  }, [activeTab]);

  // 로딩 중일 때 표시할 화면
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

  // 사용자 정보가 없으면 빈 화면 (리다이렉트 진행 중)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션은 전역 NavBar 사용 */}

      {/* 메인 콘텐츠 */}
      <main>
        <Container className="py-6">
          {/* 대시보드 헤더 */}
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
              <p className="text-gray-600">
                안녕하세요, {profile?.nickname || user.email?.split('@')[0]}님! 오늘도 좋은 하루 되세요.
              </p>
            </div>
          </div>
          
          {/* 대시보드 컨텐츠 */}
          <div className="px-4 py-6 sm:px-0">
            <div>
              {/* 건강 기록 섹션 */}
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    📊 건강 기록 관리
                    </h3>
                  <p className="text-sm text-gray-600">
                    건강 캘린더, InBody 데이터, 운동 기록, 식단 기록, 일일 컨디션을 확인하고 관리하세요.
                  </p>
                </div>

                {/* 탭 네비게이션 */}
                <div className="mb-6">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'calendar'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>건강 캘린더</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('inbody')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'inbody'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Weight className="w-4 h-4" />
                      <span>InBody 기록</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('workout')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'workout'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      <span>운동 기록</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('meal')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'meal'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Utensils className="w-4 h-4" />
                      <span>식단 기록</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('condition')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'condition'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      <span>컨디션 기록</span>
                    </button>
                  </div>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="mt-4">
                  {activeTab === 'calendar' && (
                    <div className="space-y-8">
                      {/* 2열 레이아웃 - Flexbox 사용 */}
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* 왼쪽 열: 건강 캘린더 (60-70% 너비) */}
                        <div className="flex-1 lg:w-[65%]">
                          <Card title="📅 건강 캘린더" description="날짜를 클릭하여 해당 날의 상세 기록을 확인하세요.">
                            <HealthCalendar 
                              onDateSelect={handleCalendarDateSelect}
                              compact={true}
                            />
                          </Card>
                        </div>

                        {/* 오른쪽 열: DailySummarySidebar */}
                        <div className="flex-1 lg:w-[35%]">
                          {selectedCalendarDate ? (
                            <Card title="🗂️ 선택한 날짜 요약" description={selectedCalendarDate ?? undefined}>
                               <DailySummarySidebar
                                selectedDate={selectedCalendarDate ?? ''}
                                onEditCondition={() => handleEditSection('condition')}
                                onEditWorkout={() => handleEditSection('workout')}
                                onEditMeal={() => handleEditSection('meal')}
                                onEditInbody={() => setActiveTab('inbody')}
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

                      {/* 펼쳐진 편집 폼 영역 */}
                      {expandedSection && editingSection && (
                        <div className="mt-8">
                          <Card>
                             {editingSection === 'condition' && (
                               <DailyConditionForm
                                selectedDate={selectedCalendarDate || ''}
                                onSave={handleSaveSection}
                                onCancel={handleCancelSection}
                                onDataSaved={handleConditionDataSaved}
                               />
                             )}
                             {editingSection === 'workout' && (
                               <WorkoutLogForm
                                selectedDate={selectedCalendarDate || ''}
                                onSave={handleSaveSection}
                                onCancel={handleCancelSection}
                                onDataSaved={handleWorkoutDataSaved}
                               />
                             )}
                             {editingSection === 'meal' && (
                               <MealLogForm
                                selectedDate={selectedCalendarDate || ''}
                                onSave={handleSaveSection}
                                onCancel={handleCancelSection}
                                onDataSaved={handleMealDataSaved}
                               />
                             )}
                          </Card>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'inbody' && (
                    <div className="space-y-8">
                      {/* InBody 데이터 입력 섹션 */}
                      <Card title="InBody 데이터 입력" description="체중, 근육량, 체지방률 등의 신체 데이터를 기록하세요.">
                        <InbodyForm onDataSaved={handleInbodyDataSaved} />
                      </Card>

                      {/* InBody 추세 차트 섹션 */}
                      <Card title="📈 InBody 추세 분석" description="골격근량과 체지방률의 변화 추세를 확인해보세요.">
                        <InbodyTrendChart refreshTrigger={chartRefreshTrigger} />
                      </Card>
                    </div>
                  )}
                  
                  {activeTab === 'workout' && (
                    <div className="space-y-8">
                      {/* 운동 기록 입력 섹션 */}
                      <Card title="운동 기록 입력" description="오늘 한 운동들의 세트, 횟수 등을 기록하세요.">
                        <WorkoutLogForm onDataSaved={handleWorkoutDataSaved} />
                      </Card>

                      {/* 운동 볼륨 추세 차트 섹션 */}
                      <Card title="📊 운동 볼륨 추세 분석" description="일별 총 운동 볼륨(무게×반복수)의 변화 추세를 확인해보세요.">
                        <VolumeTrendChart refreshTrigger={workoutChartRefreshTrigger} />
                      </Card>
                    </div>
                  )}

                  {activeTab === 'meal' && (
                    <div className="space-y-8">
                      {/* 식단 기록 입력 섹션 */}
                      <Card title="식단 기록 입력" description="일일 식사를 기록하고 칼로리를 추적하세요.">
                        <MealLogForm onDataSaved={handleMealDataSaved} />
                      </Card>

                      {/* 식단 칼로리 추세 차트 섹션 */}
                      <Card title="📈 일일 칼로리 추세 분석" description="일별 총 섭취 칼로리의 변화 추세를 확인해보세요.">
                        <MealTrendChart refreshTrigger={mealChartRefreshTrigger} />
                      </Card>
                    </div>
                  )}

                  {activeTab === 'condition' && (
                    <div className="space-y-8">
                      {/* 컨디션 기록 입력 섹션 */}
                      <Card title="일일 컨디션 입력" description="오늘의 전반적인 기분, 피로도, 수면의 질을 기록하세요.">
                        <DailyConditionForm onDataSaved={handleConditionDataSaved} />
                      </Card>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  )
} 