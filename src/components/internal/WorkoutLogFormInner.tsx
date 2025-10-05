// src/components/internal/WorkoutLogFormInner.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { INPUT } from '@/lib/ui/tokens';
import { safeMutate } from '@/lib/swrSafe';
import { swrKeys } from '@/lib/swrKeys';
import { Plus, X } from 'lucide-react';

type Props = {
  initialValue?: {
    label?: string;
    exercise?: string;
    template?: '5x3' | '5x5' | 'emom' | string;
    minutes?: number;
    sets?: Array<{ reps?: number; weight_kg?: number }>;
  } | null;
  selectedDate?: string;
  onDataSaved?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
};

type WorkoutSet = { reps: number; weight_kg?: number };
type WorkoutExercise = { name: string; sets: WorkoutSet[] };
type Mode = 'strength' | 'cardio';
type SessionIdRow = { id: number };

// ---- 스타일 토큰(버튼/세그먼트) ----
const SEG_WRAP = 'inline-flex items-center rounded-xl bg-gray-100 p-1 shadow-inner overflow-hidden';
const SEG_BTN = 'px-3.5 py-1.5 text-sm font-medium rounded-lg transition-[color,background,transform]';
const SEG_ON = 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5';
const SEG_OFF = 'text-gray-600 hover:text-gray-900 hover:bg-white/60';
const ICON_DEL = 'inline-flex items-center justify-center rounded-full w-7 h-7 bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200/60 hover:ring-red-300 transition-all';
const SOFT_CARD = 'rounded-xl border border-gray-200 p-4 shadow-sm bg-white';

export default function WorkoutLogFormInner({
  initialValue = null,
  selectedDate,
  onDataSaved,
  onSave,
  onCancel,
}: Props) {
  const todayISO = useMemo(() => {
    const d = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return local.toISOString().slice(0, 10);
  }, [selectedDate]);

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('strength');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([{ name: '스쿼트', sets: [{ reps: 5, weight_kg: 60 }] }]);
  const [cardioType, setCardioType] = useState<'run' | 'cycle' | 'row' | 'walk'>('run');
  const [durationMin, setDurationMin] = useState<number>(30);
  const [avgPaceMin, setAvgPaceMin] = useState<number | undefined>(undefined);
  // state 추가
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);

  // 평균 페이스 자동 계산: 분 * 60 / km
  useEffect(() => {
    if (mode !== 'cardio') return;
    const d = Number(durationMin);
    const km = typeof distanceKm === 'number' ? distanceKm : NaN;
    if (d > 0 && km > 0) {
      setAvgPaceMin(Math.round(d / km));
    } else {
      // 둘 중 하나라도 비정상이면 자동 계산값을 비움(표시용)
      setAvgPaceMin(undefined);
    }
  }, [mode, durationMin, distanceKm]);

    // 프리셋 반영
    useEffect(() => {
      if (!initialValue) return;
      if (initialValue.minutes) {
        setMode('cardio');
        setDurationMin(initialValue.minutes || 30);
        return;
      }
      setMode('strength');
      const baseName = initialValue.exercise || '운동';
      if (initialValue.sets?.length) {
        setExercises([{ name: baseName, sets: initialValue.sets.map(s => ({ reps: s.reps ?? 5, weight_kg: s.weight_kg })) }]);
      } else if (initialValue.template === '5x3') {
        setExercises([{ name: baseName, sets: Array.from({ length: 5 }, () => ({ reps: 3, weight_kg: 60 })) }]);
      } else if (initialValue.template === '5x5') {
        setExercises([{ name: baseName, sets: Array.from({ length: 5 }, () => ({ reps: 5, weight_kg: 50 })) }]);
      } else {
        setExercises([{ name: baseName, sets: [{ reps: 5, weight_kg: 40 }] }]);
      }
    }, [initialValue]);

  // 날짜 기존 기록 로드(클라)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: sess, error: sErr } = await supabase
          .from('workout_sessions')
          .select('id, mode, cardio_type, duration_min, distance_km, avg_pace_min')
          .eq('user_id', user.id)
          .eq('date', todayISO);

        if (sErr) throw sErr;
        const sessionRows = (sess ?? []) as Array<{
          id: number; mode: Mode; cardio_type: any; duration_min: number | null; distance_km: number | null; avg_pace_min: number | null
        }>;
        if (sessionRows.length === 0) { setLoading(false); return; }

        const strengthIds = sessionRows.filter(r => r.mode === 'strength').map(r => r.id);
        if (strengthIds.length > 0) {
          const { data: sets, error: setErr } = await supabase
            .from('workout_sets')
            .select('session_id, exercise, reps, weight_kg')
            .in('session_id', strengthIds);

          if (setErr) throw setErr;

          const map = new Map<string, WorkoutSet[]>();
          (sets ?? []).forEach((row: any) => {
            const arr = map.get(row.exercise) ?? [];
            arr.push({ reps: Number(row.reps) || 0, weight_kg: row.weight_kg == null ? undefined : Number(row.weight_kg) });
            map.set(row.exercise, arr);
          });
          const list: WorkoutExercise[] = Array.from(map.entries()).map(([name, sets]) => ({ name, sets }));
          if (list.length) {
            setMode('strength');
            setExercises(list);
          }
        }

        const cardio = sessionRows.find(r => r.mode === 'cardio');
        if (cardio) {
          setMode(strengthIds.length ? 'strength' : 'cardio');
          setCardioType((cardio.cardio_type ?? 'run') as any);
          setDurationMin(Number(cardio.duration_min ?? 30));
          setDistanceKm(cardio.distance_km == null ? undefined : Number(cardio.distance_km));
          setAvgPaceMin(cardio.avg_pace_min == null ? undefined : Number(cardio.avg_pace_min));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [todayISO]);

  // 세트/운동 조작
  const addExercise = () => {
    setExercises(prev => [...prev, { name: `운동 ${prev.length + 1}`, sets: [{ reps: 10, weight_kg: 0 }] }]);
  };
  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };
  const changeExerciseName = (idx: number, name: string) => {
    setExercises(prev => prev.map((ex, i) => (i === idx ? { ...ex, name } : ex)));
  };
  const addSet = (exIdx: number) => {
    setExercises(prev => {
      const next = [...prev];
      const ex = next[exIdx];
      const last = ex.sets[ex.sets.length - 1];
      ex.sets = [...ex.sets, { reps: last?.reps ?? 10, weight_kg: last?.weight_kg ?? 0 }];
      next[exIdx] = { ...ex };
      return next;
    });
  };
  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises(prev => {
      const next = [...prev];
      const ex = next[exIdx];
      ex.sets = ex.sets.filter((_, i) => i !== setIdx);
      next[exIdx] = { ...ex };
      return next;
    });
  };
  const changeSet = (exIdx: number, setIdx: number, patch: Partial<WorkoutSet>) => {
    setExercises(prev => {
      const next = [...prev];
      const ex = next[exIdx];
      ex.sets = ex.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s));
      next[exIdx] = { ...ex };
      return next;
    });
  };

  // 저장(교체 저장) — session_no 포함
  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      // 기존 삭제
      const { data: sess, error: findErr } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', todayISO);

      if (findErr) throw findErr;
      const ids = ((sess ?? []) as SessionIdRow[]).map(r => r.id);
      if (ids.length) {
        const { error: delSetsErr } = await supabase.from('workout_sets').delete().in('session_id', ids);
        if (delSetsErr) throw delSetsErr;
        const { error: delSessErr } = await supabase.from('workout_sessions').delete().in('id', ids);
        if (delSessErr) throw delSessErr;
      }

      // 새로 삽입 (session_no 반드시 포함)
      if (mode === 'strength') {
        const { data: created, error: insErr } = await supabase
          .from('workout_sessions')
          .insert({ user_id: user.id, date: todayISO, mode: 'strength', session_no: 1 })
          .select('id')
          .single();

        if (insErr) throw insErr;
        const sessionId = (created as SessionIdRow).id;

        const rows = exercises.flatMap(ex =>
          ex.sets.map(st => ({
            session_id: sessionId,
            exercise: ex.name,
            reps: Number(st.reps) || 0,
            weight_kg: st.weight_kg == null ? null : Number(st.weight_kg),
          })),
        );
        if (rows.length) {
          const { error: setErr } = await supabase.from('workout_sets').insert(rows);
          if (setErr) throw setErr;
        }
      } else {
        const { error: insErr } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            date: todayISO,
            mode: 'cardio',
            session_no: 1,
            cardio_type: cardioType,
            duration_min: Number(durationMin) || 0,
            distance_km: distanceKm ?? null,
            avg_pace_min: avgPaceMin == null ? null : Number(avgPaceMin),
          });
        if (insErr) throw insErr;
      }

      await Promise.all([
        safeMutate(swrKeys.summary(todayISO)),
        safeMutate(swrKeys.kpiToday),
        safeMutate(swrKeys.missions(todayISO)),
        safeMutate(swrKeys.recent('workout')),
      ]);

      onDataSaved?.();
      onSave?.();
      alert('운동 기록이 저장되었습니다.');
    } catch (e: any) {
      console.error(e);
      alert('운동 기록 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 모드 토글 */}
      <div className={SEG_WRAP} role="tablist" aria-label="workout mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'strength'}
          onClick={() => setMode('strength')}
          className={`${SEG_BTN} ${mode === 'strength' ? SEG_ON : SEG_OFF}`}
        >
          근력 기록
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'cardio'}
          onClick={() => setMode('cardio')}
          className={`${SEG_BTN} ${mode === 'cardio' ? SEG_ON : SEG_OFF}`}
        >
          유산소 기록
        </button>
      </div>

      {/* Strength */}
      {mode === 'strength' && (
        <div className="space-y-4">
          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className={SOFT_CARD}>
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={ex.name}
                  onChange={(e) => changeExerciseName(exIdx, e.target.value)}
                  className={`${INPUT} flex-1`}
                  placeholder="운동명 (예: 스쿼트)"
                />
                {/* 운동 삭제 */}
                <button type="button" onClick={() => removeExercise(exIdx)} className={ICON_DEL} title="운동 삭제">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {ex.sets.map((st, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 w-12">세트 {setIdx + 1}</div>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={st.reps}
                      onChange={(e) => changeSet(exIdx, setIdx, { reps: Number(e.target.value) })}
                      className={`${INPUT} w-24`}
                      placeholder="반복수"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      inputMode="decimal"
                      value={st.weight_kg ?? ''}
                      onChange={(e) => changeSet(exIdx, setIdx, { weight_kg: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className={`${INPUT} w-28`}
                      placeholder="무게(kg)"
                    />
                    <div className="ml-auto">
                      <button type="button" onClick={() => removeSet(exIdx, setIdx)} className={ICON_DEL} title="세트 삭제">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => addSet(exIdx)}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  세트 추가(직전 복사)
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addExercise}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              운동 추가
            </button>
          </div>
        </div>
      )}
{/* Cardio UI */}
{mode === 'cardio' && (
  <div className={SOFT_CARD}>
    <div className="grid grid-cols-4 gap-3">
      <label className="block">
        <div className="text-[11px] text-gray-500 mb-1">유형</div>
        <select value={cardioType} onChange={(e) => setCardioType(e.target.value as any)} className={INPUT}>
          <option value="run">달리기</option>
          <option value="cycle">사이클</option>
          <option value="row">로잉</option>
          <option value="walk">걷기</option>
        </select>
      </label>
      <label className="block">
        <div className="text-[11px] text-gray-500 mb-1">시간(분)</div>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          className={INPUT}
        />
      </label>
      <label className="block">
        <div className="text-[11px] text-gray-500 mb-1">거리(km)</div>
        <input
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          value={distanceKm ?? ''}
          onChange={(e) => setDistanceKm(e.target.value === '' ? undefined : Number(e.target.value))}
          className={INPUT}
        />
      </label>
      <label className="block">
        <div className="text-[11px] text-gray-500 mb-1">평균페이스(분/㎞)</div>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={avgPaceMin ?? ''}
          readOnly
          className={`${INPUT} bg-gray-50`}
          title="시간/거리 기준 자동 계산"
        />
      </label>
    </div>
  </div>
)}      {/* 액션 바 */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-3.5 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}
