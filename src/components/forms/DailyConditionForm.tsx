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

type RecentPresetRow<T> = { id: string; payload: Partial<T> };

/* --- SummaryBar --- */
function SummaryBar({
  sleepMin, sleepPct, mood, qSleep, avgEnergy, avgStress,
}: { sleepMin: number; sleepPct: number; mood: number; qSleep: number; avgEnergy: number; avgStress: number }) {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-screen-sm mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ProgressRing value={sleepPct} label="수면" />
          <div className="text-xs text-gray-600" aria-label="총 수면 시간">{sleepMin}분</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] px-2 py-1 rounded bg-gray-100">수면질 {qSleep}/5</span>
          <span className="text-[11px] px-2 py-1 rounded bg-gray-100">기분 {mood}/10</span>
          <span className="text-[11px] px-2 py-1 rounded border">에너지 {avgEnergy}/5</span>
          <span className="text-[11px] px-2 py-1 rounded border">스트레스 {avgStress}/5</span>
        </div>
      </div>
    </div>
  );
}

/* --- Field --- */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] text-gray-500 mb-1">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
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
    <div className="rounded-xl border p-4 space-y-3">
      <div className="text-sm font-semibold">수면</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="취침">
          <input type="time" className="w-full rounded-md border px-3 py-2 text-sm" {...register('bed_time')} aria-label="취침 시간" />
        </Field>
        <Field label="기상">
          <input type="time" className="w-full rounded-md border px-3 py-2 text-sm" {...register('wake_time')} aria-label="기상 시간" />
        </Field>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <Field label="총수면" hint="취침·기상 입력 시 자동 계산">
          <div className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100">
            {formatMinutes(sleepMin)}
          </div>
        </Field>
        <div className="text-[11px] text-gray-500">{sleepMin > 0 ? '자동 계산됨' : ''}</div>
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
        <div key={f.key} className="rounded-xl border p-4">
          <div className="text-sm font-semibold mb-2">{f.label} (1~5)</div>
          <div className="space-y-3">
            {TIMES.map(t => {
              const name = `${f.key}_${t === '아침' ? 'morning' : t === '점심' ? 'noon' : 'evening'}_1_5` as keyof ConditionPayload;
              const val = watch(name) ?? 3;
              return (
                <div key={t}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-500">{t}</span>
                    <span className="text-[11px] text-gray-700 px-1.5 py-0.5 rounded bg-gray-100">{val}</span>
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
          className="px-2.5 py-1 rounded-full text-xs border hover:bg-gray-50"
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
    <div className="sticky bottom-0 z-40 border-t bg-white/90 backdrop-blur">
      <div className="max-w-screen-sm mx-auto px-4 py-2 flex justify-end">
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="px-4 py-2 rounded-md bg-black text-white text-sm hover:opacity-90 disabled:opacity-50"
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
      } catch {
        // ignore
      }
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
  // 두 시간이 모두 있어야 계산
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

  const onSubmit = async (v: ConditionPayload) => {
    await saveDailyCondition(v);
    await Promise.all([
      safeMutate(swrKeys.summary(v.date)),
      safeMutate(swrKeys.kpiToday),
      safeMutate(swrKeys.missions(v.date)),
    ]);
    onSaved?.();
  };

  const openJournalModal = () => {
    setJournalDay(watch('journal_day') ?? '');
    setJournalThanks(watch('journal_gratitude') ?? '');
    setJournalFeedback(watch('journal_feedback') ?? '');
    setJournalOpen(true);
  };

  const saveJournals = async () => {
    await saveConditionJournals({
      date,
      journal_day: journalDay || null,
      journal_gratitude: journalThanks || null,
      journal_feedback: journalFeedback || null,
    });
    await Promise.all([
      safeMutate(swrKeys.summary(date)),
      safeMutate(swrKeys.kpiToday),
      safeMutate(swrKeys.missions(date)),
    ]);
    setValue('journal_day', journalDay || undefined, { shouldDirty: true });
    setValue('journal_gratitude', journalThanks || undefined, { shouldDirty: true });
    setValue('journal_feedback', journalFeedback || undefined, { shouldDirty: true });
    setJournalOpen(false);
  };

  useEffect(() => {
    reset({
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
    });
  }, [dateISO, reset]);

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
          <div className="rounded-xl border p-4 space-y-3 mt-6">
            <div className="text-sm font-semibold">기본 정보</div>
            <Field label="날짜 *">
              <input type="date" className="w-full rounded-md border px-3 py-2 text-sm" {...register('date')} defaultValue={dateISO} aria-label="기록 날짜" />
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
                  <div className="py-4">
                    <div className="flex gap-2 mb-3">
                      <button type="button" className={`px-3 py-1.5 rounded-md text-xs ${journalTab==='day'?'bg-black text-white':'border'}`} onClick={() => setJournalTab('day')} aria-label="일기 탭">일기</button>
                      <button type="button" className={`px-3 py-1.5 rounded-md text-xs ${journalTab==='thanks'?'bg-black text-white':'border'}`} onClick={() => setJournalTab('thanks')} aria-label="감사 탭">감사</button>
                      <button type="button" className={`px-3 py-1.5 rounded-md text-xs ${journalTab==='feedback'?'bg-black text-white':'border'}`} onClick={() => setJournalTab('feedback')} aria-label="피드백 탭">피드백</button>
                    </div>
                    {journalTab === 'day' && (
                      <Field label="일기">
                        <textarea className="w-full min-h-[120px] rounded-md border px-3 py-2 text-sm" value={journalDay} onChange={(e) => setJournalDay(e.target.value)} aria-label="일기 입력" />
                      </Field>
                    )}
                    {journalTab === 'thanks' && (
                      <Field label="감사">
                        <textarea className="w-full min-h-[120px] rounded-md border px-3 py-2 text-sm" value={journalThanks} onChange={(e) => setJournalThanks(e.target.value)} aria-label="감사 입력" />
                      </Field>
                    )}
                    {journalTab === 'feedback' && (
                      <Field label="피드백">
                        <textarea className="w-full min-h-[120px] rounded-md border px-3 py-2 text-sm" value={journalFeedback} onChange={(e) => setJournalFeedback(e.target.value)} aria-label="피드백 입력" />
                      </Field>
                    )}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">취소</Button>
                    </DialogClose>
                    <Button onClick={saveJournals}>저장</Button>
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
          <div className="mt-6 rounded-xl border p-4">
            <div className="text-sm font-semibold mb-3">수면질 / 기분</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Slider label="수면질(1~5)" register={register} registerName="sleep_quality_1_5" min={1} max={5} value={qSleep} />
              <Slider label="기분(0~10)" register={register} registerName="mood_0_10" min={0} max={10} value={mood} />
            </div>
          </div>
        </FormShell>
      </div>

      <SaveBar onSubmit={handleSubmit(onSubmit)} disabled={formState.isSubmitting} />
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
        <div className="text-xs font-medium text-gray-700">{label}</div>
        <div className="text-[11px] text-gray-500">{value ?? min}</div>
      </div>
      <input type="range" min={min} max={max} step={1} {...register(registerName, { valueAsNumber: true })} className="w-full" />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{min}</span><span>{Math.round((min + max) / 2)}</span><span>{max}</span>
      </div>
    </div>
  );
}