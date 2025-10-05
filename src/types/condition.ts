// src/types/condition.ts
export type ConditionPayload = {
  date: string;
  bed_time?: string;
  wake_time?: string;
  sleep_minutes?: number;
  sleep_quality_1_5: number;
  stress_morning_1_5: number; energy_morning_1_5: number;
  stress_noon_1_5: number;    energy_noon_1_5: number;
  stress_evening_1_5: number; energy_evening_1_5: number;
  mood_0_10: number;
  journal_day?: string | null;
  journal_gratitude?: string | null;
  journal_feedback?: string | null;
};


