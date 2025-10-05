// src/components/forms/DailyConditionForm.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, type UseFormRegister, type UseFormWatch } from 'react-hook-form';
import { toLocalDateISO } from '@/lib/date/toLocalDateISO';
import { safeMutate } from '@/lib/swrSafe';
import { swrKeys } from '@/lib/swrKeys';
import { supabase } from '@/lib/supabase';
import FormShell, { Preset } from './_FormShell';
import { ProgressRing } from '@/lib/ui/rings';
import { saveDailyCondition, saveConditionJournals } from '@/actions/conditions';
import type { ConditionPayload } from '@/types/condition';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

type RecentPresetRow<T> = { id: string; payload: Partial<T> };

/* --- SummaryBar --- */
function SummaryBar({
  sleepMin, sleepPct, mood, qSleep, avgEnergy, avgStress,
}: { sleepMin: number; sleepPct: number; mood: number; qSleep: number; avgEnergy: number; avgStress: number }) {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b dark:bg-black/80 dark:border-gray-700">
      <div className="max-w-screen-sm mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ProgressRing value={sleepPct} label="수면" />
          <div className="text-xs text-gray-600 dark:text-gray-400" aria-label="총 수면 시간">{sleepMin}분</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 dark:text-gray-300">수면질 {qSleep}/5</span>
          <span className="text-[11px] px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 dark:text-gray-300">기분 {mood}/10</span>
          <span className="text-[11px] px-2 py-1 rounded border dark:border-gray-700">에너지 {avgEnergy}/5</span>
          <span className="text-[11px] px-2 py-1 rounded border dark:border-gray-700">스트레스 {avgStress}/5</span>
        </div>
      </div>
    </div>
  );
}

/* --- Field --- */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{hint}</div>}
    </label>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '자동 계산';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}시간`;
  if (hours === 0) return `${mins}분`;
  return `${hours}시간 ${mins}분`;
}

/* --- SleepCard --- */
function SleepCard({ register, sleepMin }: {
  register: UseFormRegister<ConditionPayload>;
  sleepMin: number;
}) {
  return (
    <div className="rounded-xl border p-4 space-y-3 dark:border-gray-700">
      <div className="text-sm font-semibold dark:text-white">수면</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="취침">
          <input type="time" className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700" {...register('bed_time')} aria-label="취침 시간" />
        </Field>
        <Field label="기상">
          <input type="time" className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700" {...register('wake_time')} aria-label="기상 시간" />
        </Field>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <Field label="총수면" hint="취침·기상 입력 시 자동 계산">
          <div className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
            {formatMinutes(sleepMin)}
          </div>
        </Field>
        <div className="text-[11px] text-gray-500 dark:text-gray-400">{sleepMin > 0 ? '자동 계산됨' : ''}</div>
      </div>
    </div>
  );
}

/* --- EnergyStressGrid --- */
const TIMES = ['아침','점심','저녁'] as const;
const FIELD_META = [
  { key: 'stress', label: '스트레스' },
  { key: 'energy', label: '에너지' },
] as const;

function EnergyStressGrid({ register, watch }: { register: UseFormRegister<ConditionPayload>; watch: UseFormWatch<ConditionPayload>; }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {FIELD_META.map(f => (
        <div key={f.key} className="rounded-xl border p-4 dark:border-gray-700">
          <div className="text-sm font-semibold mb-2 dark:text-white">{f.label} (1~5)</div>
          <div className="space-y-3">
            {TIMES.map(t => {
              const name = `${f.key}_${t === '아침' ? 'morning' : t === '점심' ? 'noon' : 'evening'}_1_5` as keyof ConditionPayload;
              const val = watch(name) ?? 3;
              return (
                <div key={t}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{t}</span>
                    <span className="text-[11px] text-gray-700 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 dark:text-gray-300">{val}</span>
                  </div>
                  <input
                    type="range" min={1} max={5} step={1}
                    {...register(name, { valueAsNumber: true })}
                    className="w-full"
                    aria-label={`${t} ${f.label}`}
                    aria-valuenow={Number(val)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- PresetPills --- */
function PresetPills({ presets, onApply }: { presets: ReadonlyArray<Preset<ConditionPayload>>; onApply: (p: Partial<ConditionPayload>) => void; }) {
  if (!presets?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map(p => (
        <button
          key={p.id}
          type="button"
          onClick={() => onApply(p.payload)}
          className="px-2.5 py-1 rounded-full text-xs border hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
          title="프리셋 적용"
          aria-label={`프리셋 적용: ${p.label}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* --- SaveBar --- */
function SaveBar({ onSubmit, disabled }: { onSubmit: () => void; disabled: boolean }) {
  return (
    <div className="sticky bottom-0 z-40 border-t bg-white/90 backdrop-blur dark:bg-black/90 dark:border-gray-700">
      <div className="max-w-screen-sm mx-auto px-4 py-2 flex justify-end">
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="px-4 py-2 rounded-md bg-black text-white text-sm hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
          aria-label="저장"
        >
          {disabled ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}

export default function DailyConditionForm({
  selectedDate = null,
  onSaved,
}: {
  selectedDate?: string | null;
  onSaved?: () => void;
}) {
  const dateISO = selectedDate ?? toLocalDateISO();
  const router = useRouter();

  const { register, handleSubmit, setValue, watch, reset, formState } = useForm<ConditionPayload>({
    defaultValues: {
      date: dateISO,
      bed_time: undefined,
      wake_time: undefined,
      sleep_minutes: undefined,
      sleep_quality_1_5: 3,
      stress_morning_1_5: 3,
      energy_morning_1_5: 3,
      stress_noon_1_5: 3,
      energy_noon_1_5: 3,
      stress_evening_1_5: 3,
      energy_evening_1_5: 3,
      mood_0_10: 5,
      journal_day: undefined,
      journal_gratitude: undefined,
      journal_feedback: undefined,
    },
  });

  const [presets, setPresets] = useState<ReadonlyArray<Preset<ConditionPayload>>>([]);
  const [journalOpen, setJournalOpen] = useState<boolean>(false);
  const [journalTab, setJournalTab] = useState<'day' | 'thanks' | 'feedback'>('day');
  const [journalDay, setJournalDay] = useState<string>('');
  const [journalThanks, setJournalThanks] = useState<string>('');
  const [journalFeedback, setJournalFeedback] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 최근 프리셋 로드
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('recent_presets')
          .select('id, payload')
          .eq('user_id', user.id)
          .eq('kind', 'condition')
          .order('updated_at', { ascending: false })
          .limit(3);
        const mapped: Preset<ConditionPayload>[] = ((data ?? []) as ReadonlyArray<RecentPresetRow<ConditionPayload>>).map((r) => ({
          id: r.id,
          label: typeof r.payload.sleep_minutes === 'number' ? `수면 ${r.payload.sleep_minutes}분` : '프리셋',
          payload: r.payload,
        }));
        setPresets(mapped);
      } catch { /* ignore */ }
    })();
  }, []);

  const bed = watch('bed_time');
  const wake = watch('wake_time');
  const date = watch('date');
  const qSleep = watch('sleep_quality_1_5') ?? 3;
  const mood = watch('mood_0_10') ?? 5;
  const eMorning = watch('energy_morning_1_5') ?? 3;
  const eNoon = watch('energy_noon_1_5') ?? 3;
  const eEvening = watch('energy_evening_1_5') ?? 3;
  const sMorning = watch('stress_morning_1_5') ?? 3;
  const sNoon = watch('stress_noon_1_5') ?? 3;
  const sEvening = watch('stress_evening_1_5') ?? 3;

  // 총 수면 자동 계산
  const sleepMin = useMemo(() => {
    if (bed && wake) {
      const [bh, bm] = bed.split(':').map(Number);
      const [wh, wm] = wake.split(':').map(Number);
      const start = bh * 60 + bm;
      let end = wh * 60 + wm;
      if (end <= start) end += 24 * 60;
      return end - start;
    }
    return 0;
  }, [bed, wake]);

  useEffect(() => {
    if (!bed || !wake) return;
    const [bh, bm] = bed.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    const start = bh * 60 + bm;
    let end = wh * 60 + wm;
    if (end <= start) end += 24 * 60;
    const mins = end - start;
    if (Number.isFinite(mins) && mins > 0) {
      setValue('sleep_minutes', mins, { shouldDirty: true });
    }
  }, [bed, wake, setValue]);

  const sleepPct = useMemo(() => {
    const target = 480; // 8h
    return Math.max(0, Math.min(100, Math.round((sleepMin / target) * 100)));
  }, [sleepMin]);

  const avgEnergy = useMemo(() => Math.round((eMorning + eNoon + eEvening) / 3), [eMorning, eNoon, eEvening]);
  const avgStress = useMemo(() => Math.round((sMorning + sNoon + sEvening) / 3), [sMorning, sNoon, sEvening]);

  const applyPreset = (payload: Partial<ConditionPayload>) => {
    (Object.entries(payload) as Array<[keyof ConditionPayload, ConditionPayload[keyof ConditionPayload]]>)
      .forEach(([k, v]) => setValue(k, v, { shouldDirty: true }));
  };

  // ✅ 핵심: 날짜가 바뀌면 DB에서 (user_id, log_date=선택날짜) 레코드를 로드하여 폼에 주입
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!date) return;
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('daily_conditions')
          .select(`
            id,
            bed_time, wake_time, sleep_minutes,
            sleep_quality_1_5,
            stress_morning_1_5, energy_morning_1_5,
            stress_noon_1_5,    energy_noon_1_5,
            stress_evening_1_5, energy_evening_1_5,
            mood_0_10,
            journal_day, journal_gratitude, journal_feedback
          `)
          .eq('user_id', user.id)
          .eq('log_date', date)        // ← 테이블의 날짜 컬럼은 log_date
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          // 0건이면 error가 아닐 수 있음(maybeSingle 사용). 에러만 로깅.
          // console.warn('load condition error', error);
        }

        if (cancelled) return;

        if (data) {
          // 저장된 값 주입
          reset({
            date,
            bed_time: data.bed_time ?? undefined,
            wake_time: data.wake_time ?? undefined,
            sleep_minutes: data.sleep_minutes ?? undefined,
            sleep_quality_1_5: data.sleep_quality_1_5 ?? 3,
            stress_morning_1_5: data.stress_morning_1_5 ?? 3,
            energy_morning_1_5: data.energy_morning_1_5 ?? 3,
            stress_noon_1_5: data.stress_noon_1_5 ?? 3,
            energy_noon_1_5: data.energy_noon_1_5 ?? 3,
            stress_evening_1_5: data.stress_evening_1_5 ?? 3,
            energy_evening_1_5: data.energy_evening_1_5 ?? 3,
            mood_0_10: data.mood_0_10 ?? 5,
            journal_day: data.journal_day ?? '',
            journal_gratitude: data.journal_gratitude ?? '',
            journal_feedback: data.journal_feedback ?? '',
          }, { keepDirty: false });
        } else {
          // 해당 날짜 레코드 없음 → 깨끗한 기본값으로 리셋
          reset({
            date,
            bed_time: undefined,
            wake_time: undefined,
            sleep_minutes: undefined,
            sleep_quality_1_5: 3,
            stress_morning_1_5: 3,
            energy_morning_1_5: 3,
            stress_noon_1_5: 3,
            energy_noon_1_5: 3,
            stress_evening_1_5: 3,
            energy_evening_1_5: 3,
            mood_0_10: 5,
            journal_day: '',
            journal_gratitude: '',
            journal_feedback: '',
          }, { keepDirty: false });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [date, reset]);

  const onSubmit = async (v: ConditionPayload) => {
    const {data: { user } } = await supabase.auth.getUser();
    await saveDailyCondition(v, { userIdOverride: user?.id }); // (user_id, log_date) 기준 upsert
    await saveConditionJournals({
      date: v.date,
      journal_day: v.journal_day ?? null,
      journal_gratitude: v.journal_gratitude ?? null,
      journal_feedback: v.journal_feedback ?? null,
    }, { userIdOverride: user?.id });
    
    const today = toLocalDateISO();
    
    // 저널을 별도로 저장하고 싶으면 아래도 실행 (같은 테이블에 upsert)
    await saveConditionJournals({
      date: v.date,
      journal_day: v.journal_day ?? null,
      journal_gratitude: v.journal_gratitude ?? null,
      journal_feedback: v.journal_feedback ?? null,
    }, { userIdOverride: user?.id });
    await Promise.all([
      safeMutate(swrKeys.summary(v.date)),
      safeMutate(swrKeys.kpi(v.date, v.date)),
      safeMutate(swrKeys.missions(v.date)),
       // 오늘인 경우 대시보드용 today 키도 무효화
      v.date === today ? safeMutate(swrKeys.kpi(today, today)) : Promise.resolve(),
    ]);
    onSaved?.();
    router.push(`/records/${v.date}`);
  };

  const openJournalModal = () => {
    // 현재 폼 값으로 모달 초기화
    setJournalDay(watch('journal_day') ?? '');
    setJournalThanks(watch('journal_gratitude') ?? '');
    setJournalFeedback(watch('journal_feedback') ?? '');
    setJournalOpen(true);
  };

  const saveJournals = async () => {
    // ⬇️ saveJournals 스코프에서 user, today 각각 선언
    const { data: { user } } = await supabase.auth.getUser();
    const dateVal = watch('date');
    await saveConditionJournals({
      date: dateVal,
      journal_day: journalDay || null,
      journal_gratitude: journalThanks || null,
      journal_feedback: journalFeedback || null,
    }, { userIdOverride: user?.id });

    const today = toLocalDateISO();
  
    await saveConditionJournals(
      {
        date: dateVal,
        journal_day: journalDay || null,
        journal_gratitude: journalThanks || null,
        journal_feedback: journalFeedback || null,
      },
      { userIdOverride: user?.id }
    );
  
    await Promise.all([
      safeMutate(swrKeys.summary(dateVal)),
      safeMutate(swrKeys.kpi(dateVal, dateVal)),
      safeMutate(swrKeys.missions(dateVal)),
      dateVal === today ? safeMutate(swrKeys.kpi(today, today)) : Promise.resolve(),
    ]);
  
    // 폼 반영
    setValue('journal_day', journalDay || undefined, { shouldDirty: true });
    setValue('journal_gratitude', journalThanks || undefined, { shouldDirty: true });
    setValue('journal_feedback', journalFeedback || undefined, { shouldDirty: true });
    setJournalOpen(false);
  };

  
  return (
    <div className="max-w-screen-sm mx-auto">
      <SummaryBar sleepMin={sleepMin} sleepPct={sleepPct} mood={mood} qSleep={qSleep} avgEnergy={avgEnergy} avgStress={avgStress} />
      <div className="px-4">
        <FormShell<ConditionPayload>
          title="컨디션"
          presets={undefined}
          onApplyPreset={undefined}
        >
          {/* 기본 정보 카드: 날짜 + 프리셋 + 저널 버튼 */}
          <div className="rounded-xl border p-4 space-y-3 mt-6 dark:border-gray-700">
            <div className="text-sm font-semibold dark:text-white">기본 정보</div>
            <Field label="날짜 *">
              {/* RHF가 제어하므로 defaultValue 불필요 */}
              <input type="date" className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700" {...register('date')} aria-label="기록 날짜" />
            </Field>
            <PresetPills presets={presets} onApply={applyPreset} />
            <div className="flex justify-end">
              <Dialog open={journalOpen} onOpenChange={setJournalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={openJournalModal}>일기/감사/피드백</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>일기 / 감사 / 피드백</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 dark:text-white">
                    <div className="flex gap-2 mb-3">
                      <button type="button" className={`px-3 py-1.5 rounded-md text-xs ${journalTab==='day'?'bg-black text-white dark:bg-white dark:text-black':'border dark:border-gray-700'}`} onClick={() => setJournalTab('day')} aria-label="일기 탭">일기</button>
                      <button type="button" className={`px-3 py-1.5 rounded-md text-xs ${journalTab==='thanks'?'bg-black text-white dark:bg-white dark:text-black':'border dark:border-gray-700'}`} onClick={() => setJournalTab('thanks')} aria-label="감사 탭">감사</button>
                      <button type="button" className={`px-3 py-1.5 rounded-md text-xs ${journalTab==='feedback'?'bg-black text-white dark:bg-white dark:text-black':'border dark:border-gray-700'}`} onClick={() => setJournalTab('feedback')} aria-label="피드백 탭">피드백</button>
                    </div>
                    {journalTab === 'day' && (
                      <Field label="일기">
                        <textarea className="w-full min-h-[120px] rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700" value={journalDay} onChange={(e) => setJournalDay(e.target.value)} aria-label="일기 입력" />
                      </Field>
                    )}
                    {journalTab === 'thanks' && (
                      <Field label="감사">
                        <textarea className="w-full min-h-[120px] rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700" value={journalThanks} onChange={(e) => setJournalThanks(e.target.value)} aria-label="감사 입력" />
                      </Field>
                    )}
                    {journalTab === 'feedback' && (
                      <Field label="피드백">
                        <textarea className="w-full min-h-[120px] rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700" value={journalFeedback} onChange={(e) => setJournalFeedback(e.target.value)} aria-label="피드백 입력" />
                      </Field>
                    )}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">취소</Button>
                    </DialogClose>
                    <Button onClick={saveJournals} disabled={loading}>저장</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* 수면 카드 */}
          <div className="mt-6">
            <SleepCard register={register} sleepMin={sleepMin} />
          </div>

          {/* 에너지/스트레스 매트릭스 */}
          <div className="mt-6">
            <EnergyStressGrid register={register} watch={watch} />
          </div>

          {/* 수면질/기분 카드 */}
          <div className="mt-6 rounded-xl border p-4 dark:border-gray-700">
            <div className="text-sm font-semibold mb-3 dark:text-white">수면질 / 기분</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Slider label="수면질(1~5)" register={register} registerName="sleep_quality_1_5" min={1} max={5} value={qSleep} />
              <Slider label="기분(0~10)" register={register} registerName="mood_0_10" min={0} max={10} value={mood} />
            </div>
          </div>
        </FormShell>
      </div>

      <SaveBar onSubmit={handleSubmit(onSubmit)} disabled={formState.isSubmitting || loading} />
    </div>
  );
}

function Slider({
  label,
  register,
  registerName,
  min,
  max,
  value,
}: {
  label: string;
  register: UseFormRegister<ConditionPayload>;
  registerName: keyof ConditionPayload;
  min: number;
  max: number;
  value?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</div>
        <div className="text-[11px] text-gray-500">{value ?? min}</div>
      </div>
      <input type="range" min={min} max={max} step={1} {...register(registerName, { valueAsNumber: true })} className="w-full" />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{min}</span><span>{Math.round((min + max) / 2)}</span><span>{max}</span>
      </div>
    </div>
  );
}
