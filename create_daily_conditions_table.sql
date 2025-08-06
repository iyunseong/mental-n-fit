-- daily_conditions 테이블과 관련 enum 타입 생성
-- DailyConditionForm.jsx 컴포넌트에서 사용

-- 1. mood_enum 타입 생성
CREATE TYPE mood_enum AS ENUM ('great', 'good', 'normal', 'bad', 'awful');

-- 2. fatigue_level_enum 타입 생성
CREATE TYPE fatigue_level_enum AS ENUM ('low', 'medium', 'high');

-- 3. sleep_quality_enum 타입 생성
CREATE TYPE sleep_quality_enum AS ENUM ('good', 'normal', 'bad');

-- 4. daily_conditions 테이블 생성
CREATE TABLE daily_conditions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    overall_mood mood_enum NOT NULL DEFAULT 'normal',
    fatigue_level fatigue_level_enum NOT NULL DEFAULT 'medium',
    sleep_quality sleep_quality_enum NOT NULL DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 같은 사용자의 같은 날짜에는 하나의 기록만 허용
    CONSTRAINT unique_user_date UNIQUE (user_id, log_date)
);

-- 5. 인덱스 생성
CREATE INDEX idx_daily_conditions_user_date ON daily_conditions(user_id, log_date);
CREATE INDEX idx_daily_conditions_log_date ON daily_conditions(log_date);
CREATE INDEX idx_daily_conditions_overall_mood ON daily_conditions(overall_mood);

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE daily_conditions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own daily conditions" ON daily_conditions
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 데이터만 삽입 가능
CREATE POLICY "Users can insert own daily conditions" ON daily_conditions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 데이터만 업데이트 가능
CREATE POLICY "Users can update own daily conditions" ON daily_conditions
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 데이터만 삭제 가능
CREATE POLICY "Users can delete own daily conditions" ON daily_conditions
    FOR DELETE USING (auth.uid() = user_id);

-- 7. 컬럼 코멘트 추가
COMMENT ON TABLE daily_conditions IS '사용자의 일일 컨디션 기록';
COMMENT ON COLUMN daily_conditions.user_id IS '사용자 ID';
COMMENT ON COLUMN daily_conditions.log_date IS '기록 날짜';
COMMENT ON COLUMN daily_conditions.overall_mood IS '전반적인 기분: great(최고), good(좋음), normal(보통), bad(나쁨), awful(최악)';
COMMENT ON COLUMN daily_conditions.fatigue_level IS '피로도: low(낮음), medium(보통), high(높음)';
COMMENT ON COLUMN daily_conditions.sleep_quality IS '수면의 질: good(좋음), normal(보통), bad(나쁨)';

-- 8. 확인 쿼리
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_conditions'
ORDER BY ordinal_position;

-- enum 타입 확인
SELECT t.typname, e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('mood_enum', 'fatigue_level_enum', 'sleep_quality_enum')
ORDER BY t.typname, e.enumsortorder; 