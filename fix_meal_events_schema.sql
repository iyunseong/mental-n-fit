-- meal_events 테이블에 컨텍스트 로깅 컬럼 추가
-- 현재 상황: hunger_level과 mood_before 컬럼이 누락됨

-- 1. hunger_level 컬럼 추가 (식사 전 배고픔 정도)
ALTER TABLE meal_events 
ADD COLUMN IF NOT EXISTS hunger_level VARCHAR(20) DEFAULT 'medium';

-- 2. mood_before 컬럼 추가 (식사 전 현재 기분)  
ALTER TABLE meal_events 
ADD COLUMN IF NOT EXISTS mood_before VARCHAR(20) DEFAULT 'calm';

-- 3. hunger_level 제약조건 추가
ALTER TABLE meal_events 
ADD CONSTRAINT meal_events_hunger_level_check 
CHECK (hunger_level IN ('low', 'medium', 'high', 'craving'));

-- 4. mood_before 제약조건 추가
ALTER TABLE meal_events 
ADD CONSTRAINT meal_events_mood_before_check 
CHECK (mood_before IN ('fresh', 'calm', 'tired', 'stressed'));

-- 5. 컬럼 코멘트 추가
COMMENT ON COLUMN meal_events.hunger_level IS '식사 전 배고픔 정도: low(매우배고픔), medium(배고픔), high(조금배고픔), craving(갈망/욕구)';
COMMENT ON COLUMN meal_events.mood_before IS '식사 전 현재 기분: fresh(상쾌함), calm(평온함), tired(피곤함), stressed(스트레스)';

-- 6. 성능을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_meal_events_hunger_level ON meal_events(hunger_level);
CREATE INDEX IF NOT EXISTS idx_meal_events_mood_before ON meal_events(mood_before);

-- 7. 결과 확인
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    CASE 
        WHEN column_name IN ('hunger_level', 'mood_before') THEN '새로 추가됨'
        ELSE '기존 컬럼'
    END as status
FROM information_schema.columns 
WHERE table_name = 'meal_events' 
ORDER BY ordinal_position; 