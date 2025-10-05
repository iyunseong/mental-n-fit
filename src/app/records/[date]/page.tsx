// src/app/records/[date]/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, supabase } from '@/lib/supabase'
import Container from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import DailyConditionForm from '@/components/forms/DailyConditionForm'
import WorkoutLogForm from '@/components/forms/WorkoutLogForm'
import MealLogForm from '@/components/forms/MealLogForm'
import InbodyForm from '@/components/forms/InbodyForm'

type Editing = null | 'condition' | 'workout' | 'meal' | 'inbody'

type MealTotals = { kcal: number; carb_g: number; protein_g: number; fat_g: number; fiber_g: number }
type MealTypeKey = '아침' | '점심' | '저녁' | '간식'
const MEAL_LABELS: MealTypeKey[] = ['아침', '점심', '저녁', '간식']

const nf0 = (n: number) => (Math.round(n) || 0).toLocaleString()

// --- 유틸: 수면질/라벨 맵 ---
const sleepQualityLabel = (v?: number | null) =>
  v == null ? '-' : (v === 1 ? '매우 나쁨' : v === 2 ? '나쁨' : v === 3 ? '보통' : v === 4 ? '좋음' : v === 5 ? '매우 좋음' : String(v))

export default function RecordByDatePage() {
  const router = useRouter()
  const params = useParams<{ date: string }>()
  const dateISO = params.date

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const [savedMsg, setSavedMsg] = useState<string>('')

  // ----- 데이터 상태 -----
  // 컨디션
  const [cond, setCond] = useState<any | null>(null)

  // 운동: 총합 + 종목별 볼륨
  const [workout, setWorkout] = useState<{ volume: number; cardio_min: number } | null>(null)
  const [workoutByExercise, setWorkoutByExercise] = useState<Array<{ name: string; volume: number }>>([])

  // 식단: 총합 + 식사별
  const [mealTotal, setMealTotal] = useState<MealTotals>({ kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 })
  const [mealByType, setMealByType] = useState<Record<MealTypeKey, MealTotals>>({
    아침: { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 },
    점심: { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 },
    저녁: { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 },
    간식: { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 },
  })

  // 인바디
  const [inbody, setInbody] = useState<any | null>(null)

  // 사용자
  useEffect(() => {
    (async () => {
      const u = await auth.getCurrentUser()
      if (!u) { router.push('/login'); return }
      setUserId(u.id)
    })()
  }, [router])

  // 데이터 로드
  useEffect(() => {
    (async () => {
      if (!userId) return
      setLoading(true)
      try {
        // --- 컨디션(해당 날짜 1건 가정) ---
        const { data: condData } = await supabase
          .from('daily_conditions')
          .select('*')
          .eq('user_id', userId).eq('log_date', dateISO).maybeSingle()

        // --- 운동 ---
        // 총합(근력 볼륨/유산소)
        let volume = 0, cardio_min = 0
        const { data: sStrength } = await supabase
          .from('workout_sessions')
          .select('id')
          .eq('user_id', userId).eq('date', dateISO).eq('mode','strength')

        const { data: sCardio } = await supabase
          .from('workout_sessions')
          .select('duration_min')
          .eq('user_id', userId).eq('date', dateISO).eq('mode','cardio')

        let exerciseRows: any[] = []
        if (sStrength?.length) {
          const ids = sStrength.map(r => r.id)
          const { data: sets } = await supabase
            .from('workout_sets')
            .select('session_id, reps, weight_kg, exercise_name, exercise, movement, name')
            .in('session_id', ids)

          sets?.forEach(r => { volume += (r.reps || 0) * (r.weight_kg || 0) })
          exerciseRows = sets ?? []
        }
        cardio_min = (sCardio ?? []).reduce((a,r)=>a+(r.duration_min||0),0)

        // 종목별 볼륨(컬럼명 다를 수 있어 안전하게 추론)
        const byEx = new Map<string, number>()
        for (const r of exerciseRows) {
          const ex: string =
            r.exercise_name ?? r.exercise ?? r.movement ?? r.name ?? '기타'
          const vol = (r.reps || 0) * (r.weight_kg || 0)
          byEx.set(ex, (byEx.get(ex) || 0) + vol)
        }
        const byExerciseList = Array.from(byEx.entries())
          .map(([name, vol]) => ({ name, volume: vol }))
          .sort((a,b) => b.volume - a.volume)

        // --- 식단: 총합 + 식사별 ---
        const { data: events } = await supabase
          .from('meal_events')
          .select('id, meal_type')
          .eq('user_id', userId).eq('date', dateISO)

        const totals: MealTotals = { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 }
        const byType: Record<MealTypeKey, MealTotals> = {
          아침: { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 },
          점심: { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 },
          저녁: { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 },
          간식: { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 },
        }

        if (events?.length) {
          const ids = events.map(e => e.id)
          const { data: items } = await supabase
            .from('meal_items')
            .select('meal_event_id, carb_g, protein_g, fat_g, fiber_g')
            .in('meal_event_id', ids)

          const macroByEvent = new Map<number, MealTotals>()
          ids.forEach(id => macroByEvent.set(id, { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 }))
          items?.forEach(it => {
            const m = macroByEvent.get(it.meal_event_id)!
            m.carb_g    += Number(it.carb_g    ?? 0)
            m.protein_g += Number(it.protein_g ?? 0)
            m.fat_g     += Number(it.fat_g     ?? 0)
            m.fiber_g   += Number(it.fiber_g   ?? 0)
          })
          macroByEvent.forEach(m => { m.kcal = m.carb_g*4 + m.protein_g*4 + m.fat_g*9 })

          events.forEach(ev => {
            const m = macroByEvent.get(ev.id)!
            totals.carb_g    += m.carb_g
            totals.protein_g += m.protein_g
            totals.fat_g     += m.fat_g
            totals.fiber_g   += m.fiber_g
            totals.kcal      += m.kcal

            const key = (ev.meal_type as MealTypeKey) || '간식'
            const t = byType[key]
            t.carb_g    += m.carb_g
            t.protein_g += m.protein_g
            t.fat_g     += m.fat_g
            t.fiber_g   += m.fiber_g
            t.kcal      += m.kcal
          })
        }

        // --- 인바디 ---
        const { data: inb } = await supabase
          .from('inbody_logs')
          .select('weight_kg, body_fat_percentage, skeletal_muscle_mass_kg')
          .eq('user_id', userId).eq('log_date', dateISO).maybeSingle()

        // set state
        setCond(condData ?? null)
        setWorkout({ volume, cardio_min })
        setWorkoutByExercise(byExerciseList)
        setMealTotal(totals)
        setMealByType(byType)
        setInbody(inb ?? null)
      } finally {
        setLoading(false)
      }
    })()
  }, [userId, dateISO])

  const title = useMemo(() =>
    new Date(dateISO+'T00:00:00').toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'})
  , [dateISO])

  // 저장 후 읽기모드 복귀 + 성공 배지
  const afterSaved = (section: Editing) => {
    setEditing(null)
    setSavedMsg({
      condition: '컨디션이 저장되었어요.',
      workout:   '운동 기록이 저장되었어요.',
      meal:      '식사 기록이 저장되었어요.',
      inbody:    '인바디가 저장되었어요.',
      null:      '',
    }[section as NonNullable<Editing>] || '저장되었습니다.')
    router.replace(`/records/${dateISO}`)
    setTimeout(()=>setSavedMsg(''), 2200)
  }

  if (!userId) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <Container className="py-6">
          <div className="px-4 py-6 sm:px-0">
            {/* 헤더 */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-600">해당 날짜의 건강 기록 요약</p>
              </div>
              <button onClick={()=>router.push('/dashboard?tab=calendar')} className="px-3 py-2 rounded-md text-sm border hover:bg-gray-50">
                ← 달력으로
              </button>
            </div>

            {/* 저장 성공 배지 */}
            {savedMsg && (
              <div className="mb-4 p-3 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                ✅ {savedMsg}
              </div>
            )}

            {/* 상단 KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs text-gray-500">총 칼로리</div>
                <div className="text-2xl font-semibold mt-1">{nf0(mealTotal.kcal)} kcal</div>
                <div className="text-xs text-gray-500 mt-1">탄 {nf0(mealTotal.carb_g)}g · 단 {nf0(mealTotal.protein_g)}g · 지 {nf0(mealTotal.fat_g)}g</div>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs text-gray-500">근력 볼륨</div>
                <div className="text-2xl font-semibold mt-1">{nf0(workout?.volume ?? 0)}</div>
                <div className="text-xs text-gray-500 mt-1">유산소 {nf0(workout?.cardio_min ?? 0)}분</div>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs text-gray-500">인바디</div>
                <div className="text-2xl font-semibold mt-1">{inbody?.weight_kg ?? '-'} kg</div>
                <div className="text-xs text-gray-500 mt-1">체지방 {inbody?.body_fat_percentage ?? '-'}% · 골격근 {inbody?.skeletal_muscle_mass_kg ?? '-'} kg</div>
              </div>
            </div>

            {/* =================== 컨디션 =================== */}
            <Card title="컨디션" description="수면/기분 요약 → (아침/점심/저녁) 스트레스·에너지 → 일기/감사/피드백">
              {editing === 'condition' ? (
                <DailyConditionForm
                  selectedDate={dateISO}
                  onSave={()=>afterSaved('condition')}
                  onCancel={()=>setEditing(null)}
                  onDataSaved={()=>afterSaved('condition')}
                />
              ) : (
                <div className="space-y-8">
                  {/* 1) 하루 1회 지표: 수면시간/수면질/기분 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">하루 요약</h4>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <SummaryPill label="수면 시간(분)" value={cond?.sleep_minutes != null ? String(cond.sleep_minutes) : '-'} />
                      <SummaryPill label="수면 질(1~5)" value={sleepQualityLabel(cond?.sleep_quality_1_5 as number | undefined)} />
                      <SummaryPill label="기분(0~10)" value={cond?.mood_0_10 != null ? String(cond.mood_0_10) : '-'} />
                    </div>
                  </div>

                  {/* 2) 스트레스/에너지(아침/점심/저녁) */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">스트레스·에너지 (아침/점심/저녁)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 아침 */}
                      <div className="rounded-xl border bg-white p-4">
                        <div className="text-sm font-semibold text-gray-800">아침</div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <SummaryPill label="에너지(1~5)" value={cond?.energy_morning_1_5 != null ? String(cond.energy_morning_1_5) : '-'} />
                          <SummaryPill label="스트레스(1~5)" value={cond?.stress_morning_1_5 != null ? String(cond.stress_morning_1_5) : '-'} />
                        </div>
                      </div>
                      {/* 점심 */}
                      <div className="rounded-xl border bg-white p-4">
                        <div className="text-sm font-semibold text-gray-800">점심</div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <SummaryPill label="에너지(1~5)" value={cond?.energy_noon_1_5 != null ? String(cond.energy_noon_1_5) : '-'} />
                          <SummaryPill label="스트레스(1~5)" value={cond?.stress_noon_1_5 != null ? String(cond.stress_noon_1_5) : '-'} />
                        </div>
                      </div>
                      {/* 저녁 */}
                      <div className="rounded-xl border bg-white p-4">
                        <div className="text-sm font-semibold text-gray-800">저녁</div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <SummaryPill label="에너지(1~5)" value={cond?.energy_evening_1_5 != null ? String(cond.energy_evening_1_5) : '-'} />
                          <SummaryPill label="스트레스(1~5)" value={cond?.stress_evening_1_5 != null ? String(cond.stress_evening_1_5) : '-'} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3) 일기/감사/피드백 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">저널</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <JournalBox title="일기" text={cond?.journal_day} />
                      <JournalBox title="감사" text={cond?.journal_gratitude} />
                      <JournalBox title="피드백" text={cond?.journal_feedback} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={()=>setEditing('condition')} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">
                      수정하기
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* =================== 운동 =================== */}
            <Card title="운동" description="운동 종목별 볼륨(무게×반복 합)과 일일 총합">
              {editing === 'workout' ? (
                <WorkoutLogForm
                  selectedDate={dateISO}
                  onSave={()=>afterSaved('workout')}
                  onCancel={()=>setEditing(null)}
                  onDataSaved={()=>afterSaved('workout')}
                />
              ) : (
                <div className="space-y-6">
                  {/* 총합 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SummaryPill label="총 근력 볼륨" value={`${nf0(workout?.volume ?? 0)}`} />
                    <SummaryPill label="유산소(분)" value={`${nf0(workout?.cardio_min ?? 0)}`} />
                  </div>

                  {/* 종목별 리스트 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">종목별 볼륨</h4>
                    {workoutByExercise.length === 0 ? (
                      <p className="text-sm text-gray-500">기록 없음</p>
                    ) : (
                      <ul className="divide-y rounded-xl border bg-white">
                        {workoutByExercise.map((row) => (
                          <li key={row.name} className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-gray-800">{row.name}</span>
                            <span className="text-sm font-medium">{nf0(row.volume)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button onClick={()=>setEditing('workout')} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">
                      수정하기
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* =================== 식단(그대로) =================== */}
            <Card title="식단" description="총량 요약과 식사별 분해 보기">
              {editing === 'meal' ? (
                <MealLogForm
                  selectedDate={dateISO}
                  onSaved={()=>afterSaved('meal')}
                />
              ) : (
                <div className="space-y-6">
                  {/* 총량 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <SummaryPill label="총 칼로리" value={`${nf0(mealTotal.kcal)} kcal`} />
                    <SummaryPill label="탄수화물" value={`${nf0(mealTotal.carb_g)} g`} />
                    <SummaryPill label="단백질" value={`${nf0(mealTotal.protein_g)} g`} />
                    <SummaryPill label="지방" value={`${nf0(mealTotal.fat_g)} g`} />
                    <SummaryPill label="식이섬유" value={`${nf0(mealTotal.fiber_g)} g`} />
                  </div>
                  {/* 식사별 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {MEAL_LABELS.map((label) => {
                      const m = mealByType[label]
                      return (
                        <div key={label} className="rounded-xl border bg-white p-4">
                          <div className="text-sm font-semibold text-gray-800">{label}</div>
                          <div className="mt-1 text-xs text-gray-500">kcal / 탄 / 단 / 지</div>
                          <div className="mt-2 text-[15px] font-medium">
                            {nf0(m.kcal)} kcal
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {nf0(m.carb_g)}g · {nf0(m.protein_g)}g · {nf0(m.fat_g)}g
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-end">
                    <button onClick={()=>setEditing('meal')} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">
                      수정하기
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* =================== 인바디(그대로) =================== */}
            <Card title="인바디" description="체중/체지방률/골격근량">
              {editing === 'inbody' ? (
                <InbodyForm onDataSaved={()=>afterSaved('inbody')} />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <SummaryPill label="체중" value={inbody?.weight_kg != null ? `${inbody.weight_kg} kg` : '-'} />
                    <SummaryPill label="체지방률" value={inbody?.body_fat_percentage != null ? `${inbody.body_fat_percentage} %` : '-'} />
                    <SummaryPill label="골격근량" value={inbody?.skeletal_muscle_mass_kg != null ? `${inbody.skeletal_muscle_mass_kg} kg` : '-'} />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={()=>setEditing('inbody')} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">
                      수정하기
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </Container>
      </main>
    </div>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white px-3 py-2">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  )
}

function JournalBox({ title, text }: { title: string; text?: string | null }) {
  const has = Boolean(text && String(text).trim().length > 0)
  return (
    <div className="rounded-xl border bg-white p-4 min-h-[96px]">
      <div className="text-sm font-semibold text-gray-800 mb-2">{title}</div>
      {has ? (
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{text}</p>
      ) : (
        <p className="text-sm text-gray-400">기록 없음</p>
      )}
    </div>
  )
}
