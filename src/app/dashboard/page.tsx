'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { auth } from '@/lib/supabase'
import { UserProfile } from '@/lib/authTypes'
import { Brain, Home, User as UserIcon, Menu, X, Activity, Weight, Utensils, Heart, Calendar } from 'lucide-react'
import InbodyForm from '@/components/InbodyForm'
import WorkoutLogForm from '@/components/WorkoutLogForm'
import InbodyTrendChart from '@/components/InbodyTrendChart'
import VolumeTrendChart from '@/components/VolumeTrendChart'
import MealLogForm from '@/components/MealLogForm'
import MealTrendChart from '@/components/MealTrendChart'
import DailyConditionForm from '@/components/DailyConditionForm'
import HealthCalendar from '@/components/HealthCalendar'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'inbody' | 'workout' | 'meal' | 'condition' | 'calendar'>('inbody')
  const [chartRefreshTrigger, setChartRefreshTrigger] = useState(0)
  const [workoutChartRefreshTrigger, setWorkoutChartRefreshTrigger] = useState(0)
  const [mealChartRefreshTrigger, setMealChartRefreshTrigger] = useState(0)
  const [conditionChartRefreshTrigger, setConditionChartRefreshTrigger] = useState(0)

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
  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  // 차트 새로고침 핸들러
  const handleInbodyDataSaved = () => {
    setChartRefreshTrigger(prev => prev + 1);
  }

  // 워크아웃 차트 새로고침 핸들러
  const handleWorkoutDataSaved = () => {
    setWorkoutChartRefreshTrigger(prev => prev + 1);
  }

  // 식단 차트 새로고침 핸들러 (식단 차트 추가 시 사용)
  const handleMealDataSaved = () => {
    setMealChartRefreshTrigger(prev => prev + 1);
  }

  // 컨디션 차트 새로고침 핸들러 (차트 컴포넌트 추가 시 사용)
  const handleConditionDataSaved = () => {
    setConditionChartRefreshTrigger(prev => prev + 1);
    console.log('컨디션 데이터가 저장되었습니다'); // 임시: 차트가 추가되면 제거
  }

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
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
            </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                mental-n-fit
              </h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Home className="w-4 h-4" />
                <span>홈</span>
              </Link>
              <Link href="/survey" className="text-gray-600 hover:text-blue-600 transition-colors">
                MetaType 16
              </Link>
              <Link href="/results" className="text-gray-600 hover:text-blue-600 transition-colors">
                결과
              </Link>
              
              {/* 사용자 아이콘 */}
            <div className="flex items-center space-x-4">
                <Link href="/profile" className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                  <UserIcon className="w-5 h-5" />
                </Link>
              <button
                onClick={handleLogout}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <Link 
                href="/"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>홈</span>
              </Link>
              <Link 
                href="/survey"
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                MetaType 16
              </Link>
              <Link 
                href="/results"
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                결과
              </Link>
              
              {/* 모바일 사용자 메뉴 */}
              <div className="px-4 py-2 space-y-4">
                <Link 
                  href="/profile"
                  className="flex items-center space-x-2 text-sm text-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>프로필</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
            <div className="max-w-4xl mx-auto">
              {/* 건강 기록 섹션 */}
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    📊 건강 기록 관리
                    </h3>
                  <p className="text-sm text-gray-600">
                    InBody 데이터, 운동 기록, 식단 기록, 일일 컨디션, 건강 캘린더를 확인하고 관리하세요.
                  </p>
                </div>

                {/* 탭 네비게이션 */}
                <div className="mb-6">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
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
                  </div>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="mt-4">
                  {activeTab === 'inbody' && (
                    <div className="space-y-8">
                      {/* InBody 데이터 입력 섹션 */}
                      <div>
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">
                            InBody 데이터 입력
                          </h4>
                          <p className="text-sm text-gray-600">
                            체중, 근육량, 체지방률 등의 신체 데이터를 기록하세요.
                          </p>
                        </div>
                        <InbodyForm onDataSaved={handleInbodyDataSaved} />
                      </div>

                      {/* InBody 추세 차트 섹션 */}
                      <div>
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">
                            📈 InBody 추세 분석
                          </h4>
                          <p className="text-sm text-gray-600">
                            골격근량과 체지방률의 변화 추세를 확인해보세요.
                          </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                          <InbodyTrendChart refreshTrigger={chartRefreshTrigger} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'workout' && (
                    <div className="space-y-8">
                      {/* 운동 기록 입력 섹션 */}
                      <div>
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">
                            운동 기록 입력
                          </h4>
                          <p className="text-sm text-gray-600">
                            오늘 한 운동들의 세트, 횟수 등을 기록하세요.
                          </p>
                        </div>
                        <WorkoutLogForm onDataSaved={handleWorkoutDataSaved} />
                      </div>

                      {/* 운동 볼륨 추세 차트 섹션 */}
                      <div>
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">
                            📊 운동 볼륨 추세 분석
                          </h4>
                          <p className="text-sm text-gray-600">
                            일별 총 운동 볼륨(무게×반복수)의 변화 추세를 확인해보세요.
                          </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                          <VolumeTrendChart refreshTrigger={workoutChartRefreshTrigger} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'meal' && (
                    <div className="space-y-8">
                      {/* 식단 기록 입력 섹션 */}
                      <div>
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">
                            식단 기록 입력
                          </h4>
                          <p className="text-sm text-gray-600">
                            일일 식사를 기록하고 칼로리를 추적하세요.
                          </p>
                        </div>
                        <MealLogForm onDataSaved={handleMealDataSaved} />
                      </div>

                      {/* 식단 칼로리 추세 차트 섹션 */}
                      <div>
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">
                            📈 일일 칼로리 추세 분석
                          </h4>
                          <p className="text-sm text-gray-600">
                            일별 총 섭취 칼로리의 변화 추세를 확인해보세요.
                          </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                          <MealTrendChart refreshTrigger={mealChartRefreshTrigger} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'condition' && (
                    <div className="space-y-8">
                      {/* 컨디션 기록 입력 섹션 */}
                      <div>
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">
                            일일 컨디션 입력
                          </h4>
                          <p className="text-sm text-gray-600">
                            오늘의 전반적인 기분, 피로도, 수면의 질을 기록하세요.
                          </p>
                        </div>
                        <DailyConditionForm onDataSaved={handleConditionDataSaved} />
                      </div>
                    </div>
                  )}

                  {activeTab === 'calendar' && (
                    <div className="space-y-8">
                      {/* 건강 캘린더 섹션 */}
                      <div>
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">
                            📅 건강 캘린더
                          </h4>
                          <p className="text-sm text-gray-600">
                            월별로 기록된 컨디션 데이터를 한눈에 확인하고 패턴을 분석해보세요.
                          </p>
                        </div>
                        <HealthCalendar />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 