'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { auth } from '@/lib/supabase'
import { UserProfile } from '@/lib/authTypes'

import Container from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import HealthCalendar from '@/components/dashboard/HealthCalendar'
import KPIHeaderClient from '@/components/dashboard/KPIHeaderClient'
import RangeToggle from '@/components/dashboard/RangeToggle'
import InbodyTrendChart from '@/components/dashboard/InbodyTrendChart'
import VolumeTrendChart from '@/components/dashboard/VolumeTrendChart'
import MealTrendChart from '@/components/dashboard/MealTrendChart'
import ConditionTrendChart from '@/components/dashboard/ConditionTrendChart'
import TodaySnapshot from '@/components/dashboard/TodaySnapshot'
import { toLocalDateISO } from '@/lib/date/toLocalDateISO'
import { getRange } from '@/lib/date/getRange'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // 추세 전용 기간 (30/90)
  const rangeParam = searchParams.get('range') === '90' ? 90 : 30
  const { fromISO: trendFromISO, toISO: trendToISO } = useMemo(() => getRange(rangeParam, 'Asia/Seoul'), [rangeParam])

  // KPI(최근 7일) 전용 기간
  const todayISO = toLocalDateISO(new Date())
  const kpiFromISO = useMemo(() => {
    const d = new Date(todayISO + 'T00:00:00')
    d.setDate(d.getDate() - 6)
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    return local.toISOString().slice(0, 10)
  }, [todayISO])

  // 로그인 사용자 로딩
  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        setUser(currentUser)
        const userProfile = await auth.getUserProfile(currentUser.id)
        setProfile(userProfile)
      } catch (e) {
        console.error('사용자 정보 가져오기 실패:', e)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  // 추세 접힘 상태 (기본: 접힘)
  const [openTrends, setOpenTrends] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto" />
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
          {/* 최상단: 인사 + 오늘 스냅샷 */}
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
              <p className="text-gray-600">
                안녕하세요, {profile?.nickname || user.email?.split('@')[0]}님! 오늘의 상태를 확인하세요.
              </p>
            </div>

            {/* 🟣 오늘 스냅샷 (단백질/운동 볼륨/수면) */}
            <div className="mb-8">
              <TodaySnapshot />
            </div>

            {/* 🟦 캘린더: 정중앙 + 크게 */}
            <div className="mb-6">
              <div className="flex justify-center">
                <div className="w-full max-w-4xl">
                  <Card title="📅 건강 캘린더" description="날짜를 클릭하면 해당 날의 기록 페이지로 이동합니다.">
                    <HealthCalendar />
                  </Card>
                </div>
              </div>
            </div>

            {/* 🟧 KPI(최근 7일 평균) - 캘린더 아래 */}
            <div className="mb-2">
              <div className="w-full max-w-5xl mx-auto">
                <KPIHeaderClient from={kpiFromISO} to={todayISO} />
              </div>
            </div>
          </div>

          {/* 🟩 추세 그래프 섹션 (접힘/펼침) */}
          <div className="px-4 py-2 sm:px-0">
            <div className="w-full max-w-6xl mx-auto">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">추세 그래프</h3>
                    <p className="text-xs text-gray-500">최근 30/90일 범위의 변화 추세를 확인하세요.</p>
                  </div>
                  <button
                    className={`px-4 py-2 rounded-md text-sm transition border ${openTrends ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
                    onClick={() => setOpenTrends(v => !v)}
                  >
                    {openTrends ? '접기' : '펼치기'}
                  </button>
                </div>

                {openTrends && (
                  <div className="mt-6">
                    {/* 추세 전용 RangeToggle (30/90) */}
                    <div className="mb-4">
                      <RangeToggle />
                    </div>

                    {/* 👉 왼쪽: 컨디션(3개 그래프) / 오른쪽: 운동·식단·InBody(3개 그래프) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* LEFT: 컨디션 3개 묶음 */}
                      <Card title="컨디션 추세 (에너지·스트레스·기분)">
                        <ConditionTrendChart sectionHeight={260} sectionGap={55} from={trendFromISO} to={trendToISO} />
                      </Card>

                      {/* RIGHT: 운동·식단·InBody 3개 묶음 */}
                      <Card title="운동 · 식단 · InBody 추세">
                        <div className="space-y-6">
                          <section>
                            <div className="text-sm font-medium text-gray-700 mb-1">운동</div>
                            <VolumeTrendChart from={trendFromISO} to={trendToISO} />
                          </section>
                          <section>
                            <div className="text-sm font-medium text-gray-700 mb-1">식단</div>
                            <MealTrendChart from={trendFromISO} to={trendToISO} />
                          </section>
                          <section>
                            <div className="text-sm font-medium text-gray-700 mb-1">InBody</div>
                            <InbodyTrendChart from={trendFromISO} to={trendToISO} />
                          </section>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </div>
  )
}
