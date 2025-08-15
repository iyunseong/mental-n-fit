import { supabase } from '@/lib/supabase'
import { ProgressRing } from '@/lib/ui/rings'

async function getKpi() {
  // 서버 컴포넌트에서 수행: 오늘 기준 KPI 계산
  // 가정: 필요한 값들은 각 테이블에 존재하며, 단순화된 계산 사용
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const userId = user.id
  const today = new Date().toISOString().split('T')[0]

  // proteinToday%와 kcalRange%는 식단 이벤트 총량 기반의 예시 계산 (존재 시)
  const { data: meals } = await supabase
    .from('meal_events')
    .select('total_calories, total_protein')
    .eq('user_id', userId)
    .gte('ate_at', `${today}T00:00:00.000Z`)
    .lt('ate_at', `${today}T23:59:59.999Z`)

  const totalCalories = (meals || []).reduce((s, m: any) => s + (m.total_calories || 0), 0)
  const totalProtein = (meals || []).reduce((s, m: any) => s + (m.total_protein || 0), 0)

  // 목표치는 하드코딩 예시(차후 사용자별 설정 연동)
  const proteinGoal = 130 // g
  const kcalLow = 2000
  const kcalHigh = 2300

  const proteinPct = proteinGoal ? Math.min(100, Math.round((totalProtein / proteinGoal) * 100)) : 0
  const kcalCenter = (kcalLow + kcalHigh) / 2
  const kcalPct = kcalCenter ? Math.min(100, Math.round((totalCalories / kcalCenter) * 100)) : 0

  // 금주 운동 세션 수
  const now = new Date()
  const weekStart = new Date(now)
  const day = weekStart.getDay() || 7
  weekStart.setDate(weekStart.getDate() - day + 1)
  const ws = weekStart.toISOString().split('T')[0]
  const we = new Date(weekStart)
  we.setDate(weekStart.getDate() + 6)
  const weStr = we.toISOString().split('T')[0]

  const { data: workouts } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('log_date', ws)
    .lte('log_date', weStr)

  const workoutSessions = (workouts || []).length
  const workoutGoal = 4

  // 최근 7일 평균 수면 시간 (예시: daily_conditions에 sleep_hours 컬럼이 있는 경우)
  let sleepHoursAvg = 0
  try {
    const sevenAgo = new Date()
    sevenAgo.setDate(sevenAgo.getDate() - 6)
    const sevenAgoStr = sevenAgo.toISOString().split('T')[0]
    const { data: sleep } = await supabase
      .from('daily_conditions')
      .select('sleep_hours')
      .eq('user_id', userId)
      .gte('log_date', sevenAgoStr)
      .lte('log_date', today)
    const vals = (sleep || []).map((s: any) => s.sleep_hours).filter((v: any) => typeof v === 'number')
    sleepHoursAvg = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0
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
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <ProgressRing value={kpi.proteinPct} label="단백질" />
        <div>
          <div className="text-sm text-gray-500">오늘 단백질</div>
          <div className="text-lg font-semibold text-gray-900">{kpi.proteinPct}%</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <ProgressRing value={kpi.kcalPct} label="칼로리" />
        <div>
          <div className="text-sm text-gray-500">권장 범위 대비</div>
          <div className="text-lg font-semibold text-gray-900">{kpi.kcalPct}%</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-800 text-lg font-semibold">{kpi.workoutSessions}/{kpi.workoutGoal}</div>
        <div>
          <div className="text-sm text-gray-500">주간 운동 세션</div>
          <div className="text-lg font-semibold text-gray-900">목표 {kpi.workoutGoal}회</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-800 text-lg font-semibold">{kpi.sleepHoursAvg}h</div>
        <div>
          <div className="text-sm text-gray-500">최근 7일 평균 수면</div>
          <div className="text-lg font-semibold text-gray-900">{kpi.sleepHoursAvg}시간</div>
        </div>
      </div>
      {/* 우측 ConfidenceMeter placeholder */}
      <div className="col-span-full">
        <div className="w-full h-10 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
          ConfidenceMeter 자리 (추가 예정)
        </div>
      </div>
    </div>
  )
}


