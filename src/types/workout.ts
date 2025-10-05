export type CardioType = 'run' | 'cycle' | 'row' | 'walk';
export type WorkoutSet = { reps: number; weight_kg?: number };
export type WorkoutExercise = { name: string; sets: ReadonlyArray<WorkoutSet> };
export type WorkoutPayload = {
  date: string;
  mode: 'strength' | 'cardio';
  exercises?: ReadonlyArray<WorkoutExercise>;  // strength
  cardio_type?: CardioType;                    // cardio
  duration_min?: number;
  distance_km?: number | null;
  avg_pace_min?: number; // 분/km
};


