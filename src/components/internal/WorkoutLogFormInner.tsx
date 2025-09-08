'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toLocalDateISO } from '@/lib/date/toLocalDateISO';
import type { WorkoutPayload } from '@/types/workout';
import { saveWorkoutReplace, loadWorkoutByDate, listPreviousWorkoutDates } from '@/actions/workouts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';

const CARD =
  'rounded-2xl border shadow-sm bg-white border-gray-200 ' +
  'dark:bg-gray-900 dark:border-gray-800';
const INPUT =
  'w-full rounded-lg border px-3 py-2 text-sm transition ' +
  'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus:border-sky-400 ' +
  'dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-300';
const BTN = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50';
const BTN_SOLID = `${BTN} bg-black text-white hover:opacity-90 dark:bg-white dark:text-black`;
const BTN_OUTLINE = `${BTN} border border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800`;
const BTN_GHOST = `${BTN} text-gray-600 hover:bg-gray-100 border border-transparent dark:text-gray-300 dark:hover:bg-gray-800`;

type Props = {
  initialValue?: Partial<WorkoutPayload> | null;
  selectedDate?: string;
  onDataSaved?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
};

export default function WorkoutLogFormInner({
  initialValue = null,
  selectedDate,
  onDataSaved,
  onSave,
  onCancel,
}: Props) {
  const dateISO = useMemo(() => selectedDate ?? toLocalDateISO(), [selectedDate]);

  const { control, register, watch, setValue, handleSubmit, reset, formState } = useForm<WorkoutPayload>({
    defaultValues: {
      date: dateISO,
      mode: 'strength',
      exercises: [{ name: '', sets: [{ reps: 10, weight_kg: undefined }] }],
      cardio_type: 'run',
      duration_min: undefined,
      avg_pace_sec: undefined,
    },
  });

  const mode = watch('mode');
  const date = watch('date');

  const exField = useFieldArray({ control, name: 'exercises' });
  const addExercise = () => exField.append({ name: '', sets: [{ reps: 10 }] });
  const removeExercise = (i: number) => exField.remove(i);

  const addSet = (exIdx: number) => {
    const path = `exercises.${exIdx}.sets` as const;
    const curr = (watch(path) ?? []) as Array<{ reps: number; weight_kg?: number }>;
    setValue(path, [...curr, { reps: 10 }], { shouldDirty: true });
  };
  const removeSet = (exIdx: number, setIdx: number) => {
    const path = `exercises.${exIdx}.sets` as const;
    const curr = (watch(path) ?? []) as Array<{ reps: number; weight_kg?: number }>;
    setValue(
      path,
      curr.filter((_, i) => i !== setIdx),
      { shouldDirty: true },
    );
  };

  // 프리셋/추천 값 반영
  useEffect(() => {
    if (!initialValue) return;
    reset(
      prev => ({
        ...prev,
        ...initialValue,
        date: dateISO,
      }),
      { keepDirty: false },
    );
  }, [initialValue, dateISO, reset]);

  // 날짜 변경 시 해당 날짜 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!date) return;
      const loaded = await loadWorkoutByDate(date);
      if (cancelled) return;
      if (loaded) {
        reset({ ...loaded, date }, { keepDirty: false });
      } else {
        reset(
          {
            date,
            mode: 'strength',
            exercises: [{ name: '', sets: [{ reps: 10 }] }],
            cardio_type: 'run',
            duration_min: undefined,
            avg_pace_sec: undefined,
          },
          { keepDirty: false },
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, reset]);

  const onSubmit = async (v: WorkoutPayload) => {
    await saveWorkoutReplace(v);
    onDataSaved?.();
    onSave?.();
  };

  /* ---------- 이전 운동 불러오기: 날짜 선택 모달 ---------- */
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevLoading, setPrevLoading] = useState(false);
  const [prevDates, setPrevDates] = useState<Array<{ date: string; exercises: string[] }>>([]);

  const openPreviousPicker = async () => {
    setPrevOpen(true);
    setPrevLoading(true);
    try {
      const d = watch('date') || dateISO;
      const rows = await listPreviousWorkoutDates(d, 10);
      setPrevDates(rows);
    } catch {
      setPrevDates([]);
    } finally {
      setPrevLoading(false);
    }
  };

  const pickPreviousDate = async (pickDate: string) => {
    const current = watch('date') || dateISO;
    const payload = await loadWorkoutByDate(pickDate);
    if (!payload) {
      alert('선택한 날짜에 기록이 없습니다.');
      return;
    }
    reset({ ...payload, date: current }, { keepDirty: true });
    setPrevOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className={`${CARD} p-4 space-y-3`}>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">날짜 *</div>
              <input type="date" className={INPUT} {...register('date')} />
            </label>
            <div className="block">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">운동 모드</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`${mode === 'strength' ? BTN_SOLID : BTN_OUTLINE} px-4 py-2`}
                  onClick={() => setValue('mode', 'strength', { shouldDirty: true })}
                >
                  근력
                </button>
                <button
                  type="button"
                  className={`${mode === 'cardio' ? BTN_SOLID : BTN_OUTLINE} px-4 py-2`}
                  onClick={() => setValue('mode', 'cardio', { shouldDirty: true })}
                >
                  유산소
                </button>
                <button type="button" className={`${BTN_OUTLINE} px-4 py-2 ml-auto`} onClick={openPreviousPicker}>
                  이전 운동 불러오기
                </button>
              </div>
            </div>
          </div>
        </div>

        {mode === 'strength' && (
          <div className="space-y-2">
            {exField.fields.map((f, exIdx) => {
              const sets = (watch(`exercises.${exIdx}.sets`) ?? []) as Array<{ reps: number; weight_kg?: number }>;
              return (
                <div key={f.id} className={`${CARD} p-4 space-y-3`}>
                  <div className="flex items-center gap-2">
                    <input className={`${INPUT} flex-1`} placeholder="운동명 (예: 스쿼트)" {...register(`exercises.${exIdx}.name` as const)} />
                    <button type="button" onClick={() => removeExercise(exIdx)} className={`${BTN_GHOST} px-3 py-2`}>
                      삭제
                    </button>
                  </div>
                  <div className="space-y-2">
                    {sets.map((_, setIdx) => (
                      <div key={setIdx} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <label className="block">
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">반복수(회)</div>
                          <input
                            type="number"
                            min={1}
                            className={INPUT}
                            {...register(`exercises.${exIdx}.sets.${setIdx}.reps` as const, { valueAsNumber: true })}
                          />
                        </label>
                        <label className="block">
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">무게(kg)</div>
                          <input
                            type="number"
                            step="0.5"
                            className={INPUT}
                            {...register(`exercises.${exIdx}.sets.${setIdx}.weight_kg` as const, { valueAsNumber: true })}
                          />
                        </label>
                        <div className="flex items-end">
                          <button type="button" onClick={() => removeSet(exIdx, setIdx)} className={`${BTN_OUTLINE} px-3 py-2 w-full`}>
                            세트 삭제
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-1">
                      <button type="button" onClick={() => addSet(exIdx)} className={`${BTN_OUTLINE} px-3 py-2`}>
                        세트 추가
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="pt-2">
              <button type="button" onClick={addExercise} className={`${BTN_OUTLINE} px-4 py-2`}>
                운동 추가
              </button>
            </div>
          </div>
        )}

        {mode === 'cardio' && (
          <div className={`${CARD} p-4 space-y-3`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block">
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">종류</div>
                <select className={INPUT} {...register('cardio_type')}>
                  <option value="run">러닝</option>
                  <option value="cycle">사이클</option>
                  <option value="row">로잉</option>
                  <option value="walk">워킹</option>
                </select>
              </label>
              <label className="block">
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">시간(분)</div>
                <input type="number" min={0} className={INPUT} {...register('duration_min', { valueAsNumber: true })} />
              </label>
              <label className="block">
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">평균 페이스(초)</div>
                <input type="number" min={0} className={INPUT} {...register('avg_pace_sec', { valueAsNumber: true })} />
              </label>
            </div>
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <button type="submit" disabled={formState.isSubmitting} className={`${BTN_SOLID} px-4 py-2`}>
            {formState.isSubmitting ? '저장 중…' : '저장'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className={`${BTN_OUTLINE} px-4 py-2`}>
              취소
            </button>
          )}
        </div>
      </form>

      <Dialog open={prevOpen} onOpenChange={setPrevOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이전 운동 불러오기</DialogTitle>
          </DialogHeader>

          {prevLoading && <div className="text-sm text-gray-500 dark:text-gray-400">불러오는 중…</div>}

          {!prevLoading && prevDates.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">이전 운동 기록이 없습니다.</div>
          )}

          {!prevLoading && prevDates.length > 0 && (
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {prevDates.map(row => (
                <button
                  key={row.date}
                  type="button"
                  onClick={() => pickPreviousDate(row.date)}
                  className="w-full text-left rounded-lg border px-3 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <div className="text-sm font-medium dark:text-white">{row.date}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {row.exercises.length > 0 ? (
                      row.exercises.map((name, i) => (
                        <span
                          key={`${row.date}-${name}-${i}`}
                          className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">운동명 없음</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="pt-3 flex justify-end">
            <Button variant="ghost" onClick={() => setPrevOpen(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
