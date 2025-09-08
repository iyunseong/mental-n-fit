import { supabase } from '@/lib/supabase'
import { ProgressRing } from '@/lib/ui/rings'

export const dynamic = 'force-dynamic'

async function getKpi() {
  // 서버 컴포넌트에서 수행: 오늘 기준 KPI 계산
  // 가정: 필요한 값들은 각 테이블에 존재하며, 단순화된 계산 사용
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const userId = user.id
  // 로컬 날짜 경계 (타임존 안전)
  const now = new Date()
  const startOfTodayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfTodayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  const startISO = startOfTodayLocal.toISOString()
  const endISO = endOfTodayLocal.toISOString()

  // proteinToday%와 kcalRange%는 식단 이벤트 총량 기반의 예시 계산 (존재 시)
  type MealRow = { total_calories: number | null; total_protein: number | null }
  type SleepRow = { sleep_hours: number | null }

  const [mealsRes, workoutsRes, sleepRes] = await Promise.all([
    supabase
      .from('meal_events')
      .select('total_calories, total_protein')
      .eq('user_id', userId)
      .gte('ate_at', startISO)
      .lt('ate_at', endISO),
    // 주간 운동 세션 수: count 전용
    (async () => {
      const weekStart = new Date(now)
      const day = weekStart.getDay() || 7
      weekStart.setDate(weekStart.getDate() - day + 1)
      const ws = weekStart.toISOString().split('T')[0]
      const we = new Date(weekStart)
      we.setDate(weekStart.getDate() + 6)
      const weStr = we.toISOString().split('T')[0]
      return supabase
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('log_date', ws)
        .lte('log_date', weStr)
    })(),
    // 최근 7일 평균 수면 (log_date가 date 컬럼이라고 가정)
    (async () => {
      const sevenAgo = new Date(now)
      sevenAgo.setDate(sevenAgo.getDate() - 6)
      const sevenAgoStr = sevenAgo.toISOString().split('T')[0]
      const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      return supabase
        .from('daily_conditions')
        .select('sleep_hours')
        .eq('user_id', userId)
        .gte('log_date', sevenAgoStr)
        .lte('log_date', todayLocalStr)
    })(),
  ])

  const meals = (mealsRes.data ?? []) as MealRow[]
  const totalCalories = meals.reduce((sum, m) => sum + (m.total_calories ?? 0), 0)
  const totalProtein = meals.reduce((sum, m) => sum + (m.total_protein ?? 0), 0)

  // 목표치는 하드코딩 예시(차후 사용자별 설정 연동)
  const proteinGoal = 130 // g
  const kcalLow = 2000
  const kcalHigh = 2300

  const proteinPct = proteinGoal ? Math.min(100, Math.round((totalProtein / proteinGoal) * 100)) : 0
  const kcalCenter = (kcalLow + kcalHigh) / 2
  const kcalPct = kcalCenter ? Math.min(100, Math.round((totalCalories / kcalCenter) * 100)) : 0

  // 금주 운동 세션 수
  const workoutSessions = workoutsRes.count ?? 0
  const workoutGoal = 4

  // 최근 7일 평균 수면 시간 (예시: daily_conditions에 sleep_hours 컬럼이 있는 경우)
  let sleepHoursAvg = 0
  try {
    const sleep = (sleepRes.data ?? []) as SleepRow[]
    const vals = sleep.map((s) => s.sleep_hours).filter((v): v is number => typeof v === 'number')
    sleepHoursAvg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  } catch {}

  return {
    proteinPct,
    kcalPct,
    workoutSessions,
    workoutGoal,
    sleepHoursAvg: Number.isFinite(sleepHoursAvg) ? Number(sleepHoursAvg.toFixed(1)) : 0,
  }
}

export default async function KPIHeader() {
  const kpi = await getKpi()
  if (!kpi) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <ProgressRing value={kpi.proteinPct} label="단백질" />
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">오늘 단백질</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{kpi.proteinPct}%</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <ProgressRing value={kpi.kcalPct} label="칼로리" />
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">권장 범위 대비</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{kpi.kcalPct}%</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-800 text-lg font-semibold dark:bg-gray-800 dark:text-gray-200">{kpi.workoutSessions}/{kpi.workoutGoal}</div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">주간 운동 세션</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">목표 {kpi.workoutGoal}회</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-800 text-lg font-semibold dark:bg-gray-800 dark:text-gray-200">{kpi.sleepHoursAvg}h</div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">최근 7일 평균 수면</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{kpi.sleepHoursAvg}시간</div>
        </div>
      </div>
      {/* 우측 ConfidenceMeter placeholder */}
      <div className="col-span-full">
        <div className="w-full h-10 rounded-md border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          ConfidenceMeter 자리 (추가 예정)
        </div>
      </div>
    </div>
  )
}


