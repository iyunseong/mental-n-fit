// src/components/forms/WorkoutLogForm.tsx
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import WorkoutLogFormInner from '@/components/internal/WorkoutLogFormInner';
import { ProgressRing } from '@/lib/ui/rings';
import { supabase } from '@/lib/supabase';
import { safeMutate } from '@/lib/swrSafe';
import { swrKeys } from '@/lib/swrKeys';

type Props = {
  onDataSaved?: () => void;
  selectedDate?: string | null;
  onSave?: () => void;
  onCancel?: () => void;
};

type SessionIdRow = { id: number };
type SetRow = { reps?: number | null; weight_kg?: number | null };

function calcVolumeFromSets(sets: ReadonlyArray<SetRow>): number {
  return sets.reduce((s, st) => s + (Number(st.reps) || 0) * (Number(st.weight_kg) || 0), 0);
}

// ====== Preset Types ======
export type WorkoutPresetPayload = {
  label?: string;
  exercise?: string;
  template?: '5x3' | '5x5' | 'emom' | string;
  minutes?: number;
  sets?: Array<{ reps?: number; weight_kg?: number }>; // NOTE: for single-exercise presets only
};

type WorkoutPreset = { id?: string; label: string; payload: WorkoutPresetPayload };

type RecentRow = { id: string; payload: WorkoutPresetPayload | null };

// ====== Previous Loader Types ======
type Mode = 'strength' | 'cardio';

type PrevDateItem = { date: string; exercises: string[] };

type SessionRow = {
  id: number;
  date: string;
  mode: Mode;
  cardio_type?: 'run' | 'cycle' | 'row' | 'walk' | null;
  duration_min?: number | null;
  avg_pace_min?: number | null;
};

type FullSetRow = {
  session_id: number;
  exercise: string;
  reps: number;
  weight_kg: number | null;
};

export default function WorkoutLogForm({ onDataSaved, selectedDate = null, onSave, onCancel }: Props) {
  const [volumePct, setVolumePct] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [recent, setRecent] = useState<WorkoutPreset[]>([]);
  const [initialValue, setInitialValue] = useState<WorkoutPresetPayload | null>(null);
  const [formKey, setFormKey] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);

  // === Previous state ===
  const [prevDates, setPrevDates] = useState<PrevDateItem[]>([]);
  const [prevLoading, setPrevLoading] = useState<boolean>(false);
  const [copyLoading, setCopyLoading] = useState<boolean>(false);
  // cardio 요약을 읽어오기
  const [cardioSummary, setCardioSummary] = useState<{type:string; minutes:number; km:number|null; pace:number|null} | null>(null);
  
  const dateISO = useMemo(() => {
    const d = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return local.toISOString().slice(0, 10);
  }, [selectedDate]);

// cardio 요약을 읽어오기
useEffect(() => {
  (async () => {
    try {
      if (!userId) { setCardioSummary(null); return; }
      const { data: sess, error } = await supabase
        .from('workout_sessions')
        .select('mode, cardio_type, duration_min, distance_km, avg_pace_min')
        .eq('user_id', userId)
        .eq('date', dateISO);
      if (error) throw error;

      const cardio = (sess ?? []).find(r => r.mode === 'cardio');
      if (!cardio) { setCardioSummary(null); return; }
      setCardioSummary({
        type: cardio.cardio_type ?? 'cardio',
        minutes: Number(cardio.duration_min ?? 0),
        km: cardio.distance_km == null ? null : Number(cardio.distance_km),
        pace: cardio.avg_pace_min == null ? null : Number(cardio.avg_pace_min),
      });
    } catch {
      setCardioSummary(null);
    }
  })();
}, [userId, dateISO]);

  // 현재 사용자 ID
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);
      } catch {
        setUserId(null);
      }
    })();
  }, []);

  // 오늘 볼륨 계산
  useEffect(() => {
    (async () => {
      try {
        if (!userId) { setTotalVolume(0); setVolumePct(0); return; }

        const { data: sess, error: sErr } = await supabase
          .from('workout_sessions')
          .select('id')
          .eq('user_id', userId)
          .eq('date', dateISO);

        if (sErr) throw sErr;

        const ids = ((sess ?? []) as SessionIdRow[]).map(r => r.id);
        if (!ids.length) { setTotalVolume(0); setVolumePct(0); return; }

        const { data: sets, error: setErr } = await supabase
          .from('workout_sets')
          .select('reps, weight_kg')
          .in('session_id', ids);

        if (setErr) throw setErr;

        const total = calcVolumeFromSets((sets ?? []) as SetRow[]);
        setTotalVolume(total);

        const goal = 10000; // 임시 목표치
        setVolumePct(goal ? Math.min(100, Math.round((total / goal) * 100)) : 0);
      } catch {
        setTotalVolume(0);
        setVolumePct(0);
      }
    })();
  }, [dateISO, userId]);

  // 최근 프리셋 (※ profiles 조회 제거)
  useEffect(() => {
    (async () => {
      try {
        if (!userId) { setRecent([]); return; }

        const presetsRes = await supabase
          .from('recent_presets')
          .select('id, payload')
          .eq('user_id', userId)
          .eq('kind', 'workout')
          .order('updated_at', { ascending: false })
          .limit(3);

        const presetRows = (presetsRes.data ?? []) as RecentRow[];
        setRecent(
          presetRows.map((r) => ({
            id: r.id,
            label: r.payload?.label ?? r.payload?.exercise ?? '프리셋',
            payload: r.payload ?? {},
          })),
        );
      } catch {
        setRecent([]);
      }
    })();
  }, [userId]);

  // === 이전 기록 요약 불러오기 (최근 날짜 10개, 상위 운동명 3개) ===
  const loadPrevDates = useCallback(async () => {
    if (!userId) { setPrevDates([]); return; }
    setPrevLoading(true);
    try {
      // 최근 200개의 세션 날짜(현재 날짜 이전)
      const { data: dateRows, error: dErr } = await supabase
        .from('workout_sessions')
        .select('id, date, mode')
        .eq('user_id', userId)
        .lt('date', dateISO)
        .order('date', { ascending: false })
        .limit(200);
      if (dErr) throw dErr;

      const sessions = (dateRows ?? []) as Array<{ id: number; date: string; mode: Mode }>; 
      if (sessions.length === 0) { setPrevDates([]); return; }

      const distinctDates = Array.from(new Set(sessions.map(r => r.date))).slice(0, 10);

      // strength 세션의 set에서 운동명 카운트
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

      const results: PrevDateItem[] = distinctDates.map((dt) => ({
        date: dt,
        exercises: setsByDate[dt] ?? [],
      }));

      setPrevDates(results);
    } catch {
      setPrevDates([]);
    } finally {
      setPrevLoading(false);
    }
  }, [userId, dateISO]);

  useEffect(() => {
    loadPrevDates();
  }, [loadPrevDates]);

  // 저장 후 공용 키 무효화
  const handleSaved = async () => {
    const keys = [swrKeys.summary(dateISO), swrKeys.kpiToday, swrKeys.missions(dateISO), swrKeys.recent('workout')];
    await Promise.all(keys.map((k) => safeMutate(k)));
    onDataSaved?.();
  };

  const applyPreset = (payload: WorkoutPresetPayload) => {
    setInitialValue(payload);
    setFormKey((k) => k + 1);
  };

  // === 특정 날짜의 상세를 그대로 "오늘"로 복사 ===
  const copyFromDateToToday = useCallback(async (fromDate?: string) => {
    setCopyLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      // 1) 소스 세션 찾기 (fromDate가 없으면 직전 1개)
      let source: SessionRow | null = null;
      if (fromDate) {
        const { data: sess, error: sErr } = await supabase
          .from('workout_sessions')
          .select('id, date, mode, cardio_type, duration_min, avg_pace_min')
          .eq('user_id', user.id)
          .eq('date', fromDate)
          .order('id', { ascending: true })
          .limit(1);
        if (sErr) throw sErr;
        source = (sess?.[0] as SessionRow) ?? null;
      } else {
        const { data: sess, error: sErr } = await supabase
          .from('workout_sessions')
          .select('id, date, mode, cardio_type, duration_min, avg_pace_min')
          .eq('user_id', user.id)
          .lt('date', dateISO)
          .order('date', { ascending: false })
          .limit(1);
        if (sErr) throw sErr;
        source = (sess?.[0] as SessionRow) ?? null;
      }
      if (!source) { alert('불러올 이전 기록이 없습니다.'); return; }

      // 2) 오늘 기록 삭제
      const { data: todaySess, error: findErr } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', dateISO);
      if (findErr) throw findErr;
      const todayIds = (todaySess ?? []).map((r: any) => r.id as number);
      if (todayIds.length > 0) {
        const { error: delSetsErr } = await supabase.from('workout_sets').delete().in('session_id', todayIds);
        if (delSetsErr) throw delSetsErr;
        const { error: delSessErr } = await supabase.from('workout_sessions').delete().in('id', todayIds);
        if (delSessErr) throw delSessErr;
      }

      // 3) 소스 모드에 따라 오늘로 복제 삽입 (session_no: 1)
      if (source.mode === 'cardio') {
        const { error: insErr } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            date: dateISO,
            mode: 'cardio',
            session_no: 1,
            cardio_type: source.cardio_type ?? null,
            duration_min: source.duration_min ?? null,
            avg_pace_min: source.avg_pace_min ?? null,
          });
        if (insErr) throw insErr;
      } else {
        // strength: 세트도 같이 복사
        const { data: setRows, error: setErr } = await supabase
          .from('workout_sets')
          .select('exercise, reps, weight_kg')
          .eq('session_id', source.id);
        if (setErr) throw setErr;

        const { data: created, error: insErr } = await supabase
          .from('workout_sessions')
          .insert({ user_id: user.id, date: dateISO, mode: 'strength', session_no: 1 })
          .select('id')
          .single();
        if (insErr) throw insErr;
        const newId = (created as SessionIdRow).id;

        const rows = (setRows ?? []).map((r: any) => ({
          session_id: newId,
          exercise: r.exercise as string,
          reps: Number(r.reps) || 0,
          weight_kg: typeof r.weight_kg === 'number' ? r.weight_kg : (r.weight_kg == null ? null : Number(r.weight_kg)),
        }));
        if (rows.length) {
          const { error: insSetErr } = await supabase.from('workout_sets').insert(rows);
          if (insSetErr) throw insSetErr;
        }
      }

      // 4) SWR 무효화 + 폼 리프레시 (오늘 DB에서 다시 읽어오도록)
      await Promise.all([
        safeMutate(swrKeys.summary(dateISO)),
        safeMutate(swrKeys.kpiToday),
        safeMutate(swrKeys.missions(dateISO)),
        safeMutate(swrKeys.recent('workout')),
      ]);
      setFormKey((k) => k + 1);
      onDataSaved?.();
      alert('이전 운동 기록을 오늘로 불러왔습니다.');
    } catch (e) {
      console.error(e);
      alert('이전 기록 불러오기에 실패했습니다.');
    } finally {
      setCopyLoading(false);
    }
  }, [dateISO, onDataSaved]);

  return (
    <div className="space-y-4">
      {/* 오늘 볼륨 KPI */}
<div className="flex items-center gap-3">
  <ProgressRing value={volumePct} label="근력 볼륨" />
  <div className="text-sm text-gray-600 dark:text-gray-300">
    오늘 근력 볼륨 <span className="font-semibold dark:text-white">{totalVolume.toLocaleString()} pt</span>
  </div>
  {cardioSummary && (
    <div className="ml-auto text-xs rounded-md border px-2.5 py-1.5 bg-white dark:bg-gray-900">
      <span className="font-medium">유산소</span>{' '}
      <span>{cardioSummary.type}</span>{' · '}
      <span>{cardioSummary.minutes}분</span>
      {typeof cardioSummary.km === 'number' && <> · <span>{cardioSummary.km.toFixed(2)}km</span></>}
      {typeof cardioSummary.pace === 'number' && <> · <span>{cardioSummary.pace}s/km</span></>}
    </div>
  )}
</div>

      {/* 최근 프리셋 */}
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">최근 프리셋</div>
        <div className="flex flex-wrap gap-2">
          {recent.length === 0 && <div className="text-xs text-gray-500 dark:text-gray-400">최근 프리셋이 없어요.</div>}
          {recent.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.payload)}
              className="px-2.5 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 이전 기록 불러오기 (복구) */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300">이전 운동 불러오기</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyFromDateToToday(undefined)}
              disabled={copyLoading}
              className="px-2.5 py-1.5 rounded-md text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {copyLoading ? '불러오는 중…' : '직전 기록 → 오늘 적용'}
            </button>
            <button
              type="button"
              onClick={loadPrevDates}
              className="px-2.5 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              새로고침
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {prevLoading && <div className="text-xs text-gray-500">불러오는 중…</div>}
          {!prevLoading && prevDates.length === 0 && (
            <div className="text-xs text-gray-500">이전 날짜가 없습니다.</div>
          )}
          {!prevLoading && prevDates.map((d) => (
            <button
              key={d.date}
              type="button"
              title={d.exercises.length ? `상위: ${d.exercises.join(', ')}` : '기록 있음'}
              onClick={() => copyFromDateToToday(d.date)}
              className="px-2.5 py-1.5 rounded-md text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {d.date}
              {d.exercises.length > 0 && (
                <span className="ml-1 text-[10px] text-gray-500">({d.exercises.slice(0, 3).join(', ')})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 실제 입력 폼 */}
      <WorkoutLogFormInner
        key={formKey}
        initialValue={initialValue}
        selectedDate={selectedDate ?? undefined}
        onDataSaved={handleSaved}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
}
