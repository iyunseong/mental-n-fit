import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getRange } from '@/lib/date/getRange'

type Kind = 'inbody' | 'workout' | 'meal' | 'condition'

const MAP: Record<Kind, { table: string; select: string }> = {
  inbody: { table: 'vw_inbody_trend', select: 'date,weight_kg,weight_ma7,body_fat_percentage,skeletal_muscle_mass_kg' },
  workout:{ table: 'vw_workout_trend', select: 'date,volume,volume_ma7,cardio_min,cardio_min_ma7' },
  meal:   { table: 'vw_meal_trend', select: 'date,kcal,kcal_ma7,carb_g,protein_g,fat_g,fiber_g' },
  condition:{ table: 'vw_daily_conditions_trend',
    select:'date,mood_0_10,mood_ma7,sleep_minutes,sleep_ma7,journal_count,energy_morning_1_5,energy_noon_1_5,energy_evening_1_5,stress_morning_1_5,stress_noon_1_5,stress_evening_1_5'
  },
}

const toISO = (s?: string | null) => (s ? s.slice(0, 10) : s)

export async function GET(req: Request, ctx: { params: { kind: Kind } }) {
  try {
    const kind = ctx.params.kind
    if (!MAP[kind]) return NextResponse.json({ error: 'invalid kind' }, { status: 400 })

    const url = new URL(req.url)
    const qsFrom = toISO(url.searchParams.get('from'))
    const qsTo = toISO(url.searchParams.get('to'))
    const { fromISO, toISO } = qsFrom && qsTo ? { fromISO: qsFrom, toISO: qsTo } : getRange(30, 'Asia/Seoul')

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 400 })
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { table, select } = MAP[kind]
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq('user_id', user.id)
      .gte('date', fromISO)
      .lte('date', toISO)
      .order('date', { ascending: true })

    if (error) {
      // 디버깅에 도움 되는 메시지를 그대로 반환
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(data ?? [])
  } catch (e: any) {
    console.error('trend route error:', e)
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
