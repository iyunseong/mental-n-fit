-- 1) daily_conditions 확장
alter table daily_conditions
  add column if not exists sleep_quality_1_5 smallint,
  add column if not exists stress_morning_1_5 smallint,
  add column if not exists energy_morning_1_5 smallint,
  add column if not exists stress_noon_1_5 smallint,
  add column if not exists energy_noon_1_5 smallint,
  add column if not exists stress_evening_1_5 smallint,
  add column if not exists energy_evening_1_5 smallint,
  add column if not exists mood_0_10 smallint,
  add column if not exists journal_day text,
  add column if not exists journal_gratitude text,
  add column if not exists journal_feedback text;

-- 2) workout_sessions: 근력/유산소 분리 + 유산소 세부
alter table workout_sessions
  add column if not exists mode text check (mode in ('strength','cardio')),
  add column if not exists cardio_type text check (cardio_type in ('run','cycle','row','walk')) ,
  add column if not exists duration_min integer,
  add column if not exists avg_pace_sec integer; -- 달리기 평균 페이스(초/㎞ 등 단위는 FE에서 처리)

-- 3) workout_sets: 운동명/세트 구조 명확화(이미 있으면 skip)
alter table workout_sets
  add column if not exists exercise text,
  add column if not exists reps integer,
  add column if not exists weight_kg numeric;

-- 4) meal_items: 영양 필드 보강 (있으면 skip)
alter table meal_items
  add column if not exists carb_g numeric,
  add column if not exists protein_g numeric,
  add column if not exists fat_g numeric,
  add column if not exists fiber_g numeric;

-- 5) 조회 최적화
create index if not exists idx_ws_user_date on workout_sessions(user_id, date);
create index if not exists idx_wset_session on workout_sets(session_id);
create index if not exists idx_me_events_user_date on meal_events(user_id, date);
create index if not exists idx_meal_items_event on meal_items(event_id);



-- IosWCRUlAWbkr4f4