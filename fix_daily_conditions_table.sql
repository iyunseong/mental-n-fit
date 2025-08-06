-- daily_conditions 테이블 구조 수정 및 완성
-- 누락된 컬럼들 추가

-- 1. 필요한 enum 타입들 생성 (안전하게)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mood_enum') THEN
        CREATE TYPE mood_enum AS ENUM ('great', 'good', 'normal', 'bad', 'awful');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fatigue_level_enum') THEN
        CREATE TYPE fatigue_level_enum AS ENUM ('low', 'medium', 'high');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sleep_quality_enum') THEN
        CREATE TYPE sleep_quality_enum AS ENUM ('good', 'normal', 'bad');
    END IF;
END $$;

-- 2. 컬럼들 안전하게 추가
-- overall_mood 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_conditions' AND column_name = 'overall_mood'
    ) THEN
        ALTER TABLE daily_conditions ADD COLUMN overall_mood mood_enum NOT NULL DEFAULT 'normal';
    END IF;
END $$;

-- fatigue_level 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_conditions' AND column_name = 'fatigue_level'
    ) THEN
        ALTER TABLE daily_conditions ADD COLUMN fatigue_level fatigue_level_enum NOT NULL DEFAULT 'medium';
    END IF;
END $$;

-- sleep_quality 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_conditions' AND column_name = 'sleep_quality'
    ) THEN
        ALTER TABLE daily_conditions ADD COLUMN sleep_quality sleep_quality_enum NOT NULL DEFAULT 'normal';
    END IF;
END $$;

-- log_date 컬럼 추가 (만약 없다면)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_conditions' AND column_name = 'log_date'
    ) THEN
        ALTER TABLE daily_conditions ADD COLUMN log_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- user_id 컬럼 추가 (만약 없다면)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_conditions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE daily_conditions ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- created_at, updated_at 컬럼 추가 (만약 없다면)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_conditions' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE daily_conditions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_conditions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE daily_conditions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. 제약조건 추가 (안전하게)
-- unique constraint for user_id + log_date
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'daily_conditions' AND constraint_name = 'unique_user_date'
    ) THEN
        ALTER TABLE daily_conditions ADD CONSTRAINT unique_user_date UNIQUE (user_id, log_date);
    END IF;
END $$;

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_conditions_user_date ON daily_conditions(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_daily_conditions_log_date ON daily_conditions(log_date);
CREATE INDEX IF NOT EXISTS idx_daily_conditions_overall_mood ON daily_conditions(overall_mood);

-- 5. RLS 활성화
ALTER TABLE daily_conditions ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책들 생성 (기존 정책 교체)
DROP POLICY IF EXISTS "Users can view own daily conditions" ON daily_conditions;
CREATE POLICY "Users can view own daily conditions" ON daily_conditions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily conditions" ON daily_conditions;
CREATE POLICY "Users can insert own daily conditions" ON daily_conditions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily conditions" ON daily_conditions;
CREATE POLICY "Users can update own daily conditions" ON daily_conditions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own daily conditions" ON daily_conditions;
CREATE POLICY "Users can delete own daily conditions" ON daily_conditions
    FOR DELETE USING (auth.uid() = user_id);

-- 7. 컬럼 코멘트 추가
COMMENT ON TABLE daily_conditions IS '사용자의 일일 컨디션 기록';
COMMENT ON COLUMN daily_conditions.user_id IS '사용자 ID';
COMMENT ON COLUMN daily_conditions.log_date IS '기록 날짜';
COMMENT ON COLUMN daily_conditions.overall_mood IS '전반적인 기분: great(최고), good(좋음), normal(보통), bad(나쁨), awful(최악)';
COMMENT ON COLUMN daily_conditions.fatigue_level IS '피로도: low(낮음), medium(보통), high(높음)';
COMMENT ON COLUMN daily_conditions.sleep_quality IS '수면의 질: good(좋음), normal(보통), bad(나쁨)';

-- 8. 최종 확인
SELECT 
    '=== 수정 완료된 daily_conditions 테이블 구조 ===' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_conditions'
ORDER BY ordinal_position;

SELECT 
    '=== enum 타입들 ===' as info;

SELECT t.typname, e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('mood_enum', 'fatigue_level_enum', 'sleep_quality_enum')
ORDER BY t.typname, e.enumsortorder;

SELECT 
    '=== 수정 완료! ===' as result; 