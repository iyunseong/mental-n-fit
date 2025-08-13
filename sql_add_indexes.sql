-- 유니크 제약 및 인덱스 추가로 무결성/성능 개선

-- 날짜별 단건 보장
CREATE UNIQUE INDEX IF NOT EXISTS uq_inbody_user_date ON inbody_logs(user_id, log_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_conditions_user_date ON daily_conditions(user_id, log_date);

-- 조회 성능 개선
CREATE INDEX IF NOT EXISTS idx_workout_user_date ON workout_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_meal_user_ate_at ON meal_events(user_id, ate_at);


