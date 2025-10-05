// src/actions/workouts.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { afterLogSave } from '@/actions/common/hooks';
import type { WorkoutPayload, WorkoutExercise, WorkoutSet } from '@/types/workout';

type InsertSessionRow = {
  user_id: string;
  date: string;
  mode: 'strength' | 'cardio';
  cardio_type?: 'run' | 'cycle' | 'row' | 'walk' | null;
  duration_min?: number | null;
  distance_km?: number | null;
  avg_pace_min?: number | null;
};

type InsertSetRow = {
  session_id: number;
  exercise: string;
  reps: number;
  weight_kg: number | null;
};

type SessionIdRow = { id: number };
type DateRow = { date: string };

type SessionRow = {
  id: number;
  date: string;
  mode: 'strength' | 'cardio';
  cardio_type?: 'run' | 'cycle' | 'row' | 'walk' | null;
  duration_min?: number | null;
  distance_km?: number | null;
  avg_pace_min?: number | null;
};

type SetRow = {
  session_id: number;
  exercise: string;
  reps: number;
  weight_kg: number | null;
  created_at?: string | null;
};

const ALLOW_BYPASS = process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1';

/** 읽기 전용: 세션이 없으면 절대 throw 하지 말고 null */
async function getUserIdOrNull(): Promise<string | null> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** 쓰기 전용: 기본 로그인 필수. (dev) BYPASS=1이면 client가 넘긴 userIdOverride 허용 */
async function getRequiredUserId(userIdOverride?: string): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) return user.id;
  if (ALLOW_BYPASS && userIdOverride) return userIdOverride;
  throw new Error('no-auth');
}

/** 단일 세션 insert */
export async function saveWorkout(input: WorkoutPayload, opts?: { userIdOverride?: string }): Promise<{ ok: true }> {
  const supabase = createClient();
  const userId = await getRequiredUserId(opts?.userIdOverride);

  const sessionRow: InsertSessionRow = {
    user_id: userId,
    date: input.date,
    mode: input.mode,
    cardio_type: input.cardio_type ?? null,
    duration_min: input.duration_min ?? null,
    distance_km: input.distance_km ?? null,
    avg_pace_min: input.avg_pace_min ?? null,
  };
  

  const { data: createdSession, error: sessionErr } = await supabase
    .from('workout_sessions')
    .insert(sessionRow)
    .select('id')
    .single();

  if (sessionErr || !createdSession) throw sessionErr ?? new Error('session-not-created');
  const sessionId = (createdSession as SessionIdRow).id;

  if (input.mode === 'strength') {
    const allExercises: ReadonlyArray<WorkoutExercise> = input.exercises ?? [];
    const sets: InsertSetRow[] = allExercises.flatMap((ex): InsertSetRow[] => {
      const exName = ex.name;
      const exSets: ReadonlyArray<WorkoutSet> = ex.sets ?? [];
      return exSets.map((st): InsertSetRow => ({
        session_id: sessionId,
        exercise: exName,
        reps: st.reps,
        weight_kg: typeof st.weight_kg === 'number' ? st.weight_kg : null,
      }));
    });

    if (sets.length > 0) {
      const { error: setErr } = await supabase.from('workout_sets').insert(sets);
      if (setErr) throw setErr;
    }
  }

  await afterLogSave(userId, input.date, 'workout', input);
  return { ok: true };
}

/** 같은 날짜 기록을 삭제 후 재저장 */
export async function saveWorkoutReplace(input: WorkoutPayload, opts?: { userIdOverride?: string }): Promise<{ ok: true }> {
  const supabase = createClient();
  const userId = await getRequiredUserId(opts?.userIdOverride);

  const { data: sessRows, error: findErr } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('date', input.date);

  if (findErr) throw findErr;
  const ids = ((sessRows ?? []) as SessionIdRow[]).map(r => r.id);

  if (ids.length > 0) {
    const { error: delSetsErr } = await supabase.from('workout_sets').delete().in('session_id', ids);
    if (delSetsErr) throw delSetsErr;
    const { error: delSessErr } = await supabase.from('workout_sessions').delete().in('id', ids);
    if (delSessErr) throw delSessErr;
  }

  await saveWorkout(input, opts);
  return { ok: true };
}

/** 해당 날짜 기록을 불러오기 (세트/무게 포함) — 세션 없으면 null */
export async function loadWorkoutByDate(date: string): Promise<WorkoutPayload | null> {
  const supabase = createClient();
  const userId = await getUserIdOrNull();
  if (!userId) return null;

  const { data: sess, error: sErr } = await supabase
    .from('workout_sessions')
    .select('id, date, mode, cardio_type, duration_min, distance_km, avg_pace_min')
    .eq('user_id', userId)
    .eq('date', date)
    .order('id', { ascending: true });

  if (sErr) throw sErr;
  const sessions = (sess ?? []) as ReadonlyArray<SessionRow>;
  if (sessions.length === 0) return null;

  const strengthIds = sessions.filter(s => s.mode === 'strength').map(s => s.id);
  let exercises: WorkoutExercise[] = [];

  if (strengthIds.length > 0) {
    const { data: sets, error: setErr } = await supabase
      .from('workout_sets')
      .select('session_id, exercise, reps, weight_kg')
      .in('session_id', strengthIds);
    if (setErr) throw setErr;

    const rows = (sets ?? []) as ReadonlyArray<SetRow>;
    const map = new Map<string, WorkoutSet[]>();
    for (const r of rows) {
      const arr = map.get(r.exercise) ?? [];
      arr.push({ reps: r.reps, weight_kg: r.weight_kg ?? undefined });
      map.set(r.exercise, arr);
    }
    exercises = Array.from(map.entries()).map(([name, setList]) => ({ name, sets: setList }));
  }

  if (exercises.length > 0) {
    return { date, mode: 'strength', exercises };
  }

  const cardio = sessions.find(s => s.mode === 'cardio');
  if (cardio) {
    return {
      date,
      mode: 'cardio',
      cardio_type: cardio.cardio_type ?? undefined,
      duration_min: cardio.duration_min ?? undefined,
      distance_km: cardio.distance_km ?? undefined,
      avg_pace_min: cardio.avg_pace_min ?? undefined,
    };
  }

  return null;
}

/** 현재 날짜 이전의 '최근 날짜 10개'와 각 날짜의 운동명 상위 3개 — 세션 없으면 [] */
export async function listPreviousWorkoutDates(date: string, limit = 10): Promise<Array<{ date: string; exercises: string[] }>> {
  const supabase = createClient();
  const userId = await getUserIdOrNull();
  if (!userId) return [];

  const { data: dateRows, error: dErr } = await supabase
    .from('workout_sessions')
    .select('date')
    .eq('user_id', userId)
    .lt('date', date)
    .order('date', { ascending: false })
    .limit(200);
  if (dErr) throw dErr;

  const distinctDates = Array.from(new Set(((dateRows ?? []) as DateRow[]).map(r => r.date))).slice(0, limit);
  if (distinctDates.length === 0) return [];

  const { data: sess, error: sErr } = await supabase
    .from('workout_sessions')
    .select('id, date, mode, cardio_type')
    .eq('user_id', userId)
    .in('date', distinctDates);
  if (sErr) throw sErr;

  const sessions = (sess ?? []) as Array<{ id: number; date: string; mode: 'strength' | 'cardio'; cardio_type: 'run' | 'cycle' | 'row' | 'walk' | null }>;
  const byDate: Record<string, { ids: number[]; modes: Array<{ mode: 'strength' | 'cardio'; cardio_type: 'run' | 'cycle' | 'row' | 'walk' | null }> }> = {};
  for (const s of sessions) {
    if (!byDate[s.date]) byDate[s.date] = { ids: [], modes: [] };
    byDate[s.date].ids.push(s.id);
    byDate[s.date].modes.push({ mode: s.mode, cardio_type: s.cardio_type });
  }

  const strengthIds = sessions.filter(s => s.mode === 'strength').map(s => s.id);
  const setsByDate: Record<string, string[]> = {};

  if (strengthIds.length > 0) {
    const { data: sets, error: setErr } = await supabase
      .from('workout_sets')
      .select('session_id, exercise')
      .in('session_id', strengthIds);
    if (setErr) throw setErr;

    const sessDateMap = sessions.reduce<Record<number, string>>((acc, s) => { acc[s.id] = s.date; return acc; }, {});
    const counter: Record<string, Record<string, number>> = {};
    for (const r of (sets ?? []) as Array<{ session_id: number; exercise: string }>) {
      const dt = sessDateMap[r.session_id];
      if (!dt) continue;
      if (!counter[dt]) counter[dt] = {};
      counter[dt][r.exercise] = (counter[dt][r.exercise] ?? 0) + 1;
    }
    for (const dt of Object.keys(counter)) {
      const top = Object.entries(counter[dt])
        .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([name]) => name);
      setsByDate[dt] = top;
    }
  }

  const results: Array<{ date: string; exercises: string[] }> = [];
  for (const dt of distinctDates) {
    const top = setsByDate[dt];
    if (top && top.length) { results.push({ date: dt, exercises: top }); continue; }
    const modes = byDate[dt]?.modes ?? [];
    const cardioNames = Array.from(new Set(modes.filter(m => m.mode === 'cardio').map(m => m.cardio_type ?? 'cardio'))).slice(0, 3);
    results.push({ date: dt, exercises: cardioNames.length ? cardioNames : [] });
  }
  return results;
}

/** 최근 1개 상세를 현재 날짜에 채우기 — 세션 없으면 null */
export async function loadPreviousWorkoutDetail(date: string): Promise<WorkoutPayload | null> {
  const supabase = createClient();
  const userId = await getUserIdOrNull();
  if (!userId) return null;

  const { data: sess, error: sErr } = await supabase
    .from('workout_sessions')
    .select('id, date, mode, cardio_type, duration_min, distance_km, avg_pace_min')
    .eq('user_id', userId)
    .lt('date', date)
    .order('date', { ascending: false })
    .limit(1);
  if (sErr) throw sErr;

  const latest = (sess ?? [])[0] as SessionRow | undefined;
  if (!latest) return null;

  if (latest.mode === 'cardio') {
    return {
      date,
      mode: 'cardio',
      cardio_type: latest.cardio_type ?? undefined,
      duration_min: latest.duration_min ?? undefined,
      distance_km: latest.distance_km ?? undefined,
      avg_pace_min: latest.avg_pace_min ?? undefined,
    };
  }

  const { data: sets, error: setErr } = await supabase
    .from('workout_sets')
    .select('exercise, reps, weight_kg')
    .eq('session_id', latest.id);
  if (setErr) throw setErr;

  const rows = (sets ?? []) as Array<{ exercise: string; reps: number; weight_kg: number | null }>;
  const map = new Map<string, WorkoutSet[]>();
  for (const r of rows) {
    const arr = map.get(r.exercise) ?? [];
    arr.push({ reps: r.reps, weight_kg: r.weight_kg ?? undefined });
    map.set(r.exercise, arr);
  }
  const exercises: WorkoutExercise[] = Array.from(map.entries()).map(([name, setList]) => ({ name, sets: setList }));
  return { date, mode: 'strength', exercises };
}

/** 이름만 N개 (유지) — 세션 없으면 [] */
type SimpleSession = { id: number; date: string };
type SimpleSet = { session_id: number; exercise: string; created_at?: string | null };

export async function fetchPreviousExercises(date: string): Promise<{ name: string }[]> {
  const supabase = createClient();
  const userId = await getUserIdOrNull();
  if (!userId) return [];

  const { data: sessions, error: sErr } = await supabase
    .from('workout_sessions')
    .select('id, date')
    .eq('user_id', userId)
    .lt('date', date)
    .order('date', { ascending: false })
    .limit(200);
  if (sErr) throw sErr;

  const sessionRows = (sessions ?? []) as ReadonlyArray<SimpleSession>;
  if (sessionRows.length === 0) return [];

  const sessionIds = sessionRows.map(r => r.id);
  const sessionDateById = sessionRows.reduce<Record<number, string>>((acc, r) => { acc[r.id] = r.date; return acc; }, {});

  const { data: sets, error: setErr } = await supabase
    .from('workout_sets')
    .select('session_id, exercise, created_at')
    .in('session_id', sessionIds);
  if (setErr) throw setErr;

  const setRows = (sets ?? []) as ReadonlyArray<SimpleSet>;
  const latestByName = new Map<string, string>();
  for (const row of setRows) {
    const exName = row.exercise;
    const d = sessionDateById[row.session_id];
    if (!d) continue;
    const prev = latestByName.get(exName);
    if (!prev || d > prev) latestByName.set(exName, d);
  }

  const N = 10;
  const names = Array.from(latestByName.entries())
    .sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0))
    .slice(0, N)
    .map(([name]) => ({ name }));
  return names;
}
