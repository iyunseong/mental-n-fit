'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

type WorkoutPresetPayload = {
  label?: string;
  exercise?: string;
  template?: '5x3' | '5x5' | 'emom' | string;
  minutes?: number;
  sets?: Array<{ reps?: number; weight_kg?: number }>;
};

type WorkoutPreset = { id?: string; label: string; payload: WorkoutPresetPayload };

type RecentRow = { id: string; payload: WorkoutPresetPayload | null };
type ProfileRow = { meta_type?: string | null };

export default function WorkoutLogForm({ onDataSaved, selectedDate = null, onSave, onCancel }: Props) {
  const [volumePct, setVolumePct] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [recent, setRecent] = useState<WorkoutPreset[]>([]);
  const [recommend, setRecommend] = useState<WorkoutPreset | null>(null);
  const [initialValue, setInitialValue] = useState<WorkoutPresetPayload | null>(null);
  const [formKey, setFormKey] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);

  const dateISO = useMemo(() => {
    const d = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return local.toISOString().slice(0, 10);
  }, [selectedDate]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    })();
  }, []);

  // 정규화 테이블 기반 볼륨 계산
  useEffect(() => {
    (async () => {
      try {
        if (!userId) return;

        const { data: sess, error: sErr } = await supabase
          .from('workout_sessions')
          .select('id')
          .eq('user_id', userId)
          .eq('date', dateISO);

        if (sErr) throw sErr;
        const ids = ((sess ?? []) as SessionIdRow[]).map(r => r.id);
        if (ids.length === 0) {
          setTotalVolume(0);
          setVolumePct(0);
          return;
        }

        const { data: sets, error: setErr } = await supabase
          .from('workout_sets')
          .select('reps, weight_kg')
          .in('session_id', ids);

        if (setErr) throw setErr;
        const total = calcVolumeFromSets((sets ?? []) as SetRow[]);
        setTotalVolume(total);
        const goal = 10000;
        setVolumePct(goal ? Math.min(100, Math.round((total / goal) * 100)) : 0);
      } catch {
        // dev only: ignore
      }
    })();
  }, [dateISO, userId]);

  useEffect(() => {
    (async () => {
      try {
        if (!userId) return;

        const [presetsRes, profRes] = await Promise.all([
          supabase
            .from('recent_presets')
            .select('id, payload')
            .eq('user_id', userId)
            .eq('kind', 'workout')
            .order('updated_at', { ascending: false })
            .limit(3),
          supabase.from('profiles').select('meta_type').eq('user_id', userId).maybeSingle(),
        ]);

        const presetRows = (presetsRes.data ?? []) as RecentRow[];
        setRecent(
          presetRows.map((r) => ({
            id: r.id,
            label: r.payload?.label ?? r.payload?.exercise ?? '프리셋',
            payload: r.payload ?? {},
          })),
        );

        const prof = (profRes.data as ProfileRow | null) ?? null;
        const mt = prof?.meta_type ?? null;
        if (mt && mt.includes('P')) {
          setRecommend({ label: '파워 5×3 템플릿', payload: { label: '스쿼트 5×3', exercise: '스쿼트', template: '5x3' } });
        } else if (mt && mt.includes('A')) {
          setRecommend({ label: '유산소 35분 steady', payload: { label: '사이클 35분', exercise: '사이클', minutes: 35 } });
        } else {
          setRecommend(null);
        }
      } catch {
        // ignore
      }
    })();
  }, [userId]);

  const handleSaved = async () => {
    const keys = [swrKeys.summary(dateISO), swrKeys.kpiToday, swrKeys.missions(dateISO), swrKeys.recent('workout')];
    await Promise.all(keys.map((k) => safeMutate(k)));
    onDataSaved?.();
  };

  const applyPreset = (payload: WorkoutPresetPayload) => {
    setInitialValue(payload);
    setFormKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ProgressRing value={volumePct} label="볼륨" />
        <div className="text-sm text-gray-600 dark:text-gray-300">
          오늘 운동 볼륨 <span className="font-semibold dark:text-white">{totalVolume.toLocaleString()} pt</span>
        </div>
      </div>
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
          {recommend && (
            <button
              type="button"
              onClick={() => applyPreset(recommend.payload)}
              className="px-2.5 py-1.5 rounded-md text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
            >
              ⭐ {recommend.label}
            </button>
          )}
        </div>
      </div>
      <WorkoutLogFormInner
        key={formKey}
        initialValue={initialValue}
        onDataSaved={handleSaved}
        selectedDate={selectedDate ?? undefined}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
}
