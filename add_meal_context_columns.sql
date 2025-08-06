-- meal_events 테이블에 컨텍스트 로깅 컬럼 추가
-- 실행 시기: MealLogForm에서 컨텍스트 로깅 기능 추가 후

-- hunger_level 컬럼 추가 (식사 전 배고픔 정도)
ALTER TABLE meal_events 
ADD COLUMN IF NOT EXISTS hunger_level VARCHAR(20) DEFAULT 'medium' 
CHECK (hunger_level IN ('low', 'medium', 'high', 'craving'));

-- mood_after 컬럼 추가 (식사 후 예상 기분)
ALTER TABLE meal_events 
ADD COLUMN IF NOT EXISTS mood_after VARCHAR(20) DEFAULT 'normal' 
CHECK (mood_after IN ('energetic', 'normal', 'lethargic', 'bloated'));

-- 컬럼에 코멘트 추가
COMMENT ON COLUMN meal_events.hunger_level IS '식사 전 배고픔 정도: low(매우배고픔), medium(배고픔), high(조금배고픔), craving(갈망/욕구)';
COMMENT ON COLUMN meal_events.mood_after IS '식사 후 예상 기분: energetic(활기참), normal(평범함), lethargic(피곤함), bloated(포만감/더부룩)';

-- 인덱스 추가 (분석 쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_meal_events_hunger_level ON meal_events(hunger_level);
CREATE INDEX IF NOT EXISTS idx_meal_events_mood_after ON meal_events(mood_after);

-- 확인 쿼리
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'meal_events' 
AND column_name IN ('hunger_level', 'mood_after'); 