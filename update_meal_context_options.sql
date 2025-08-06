-- meal_events 테이블의 컨텍스트 옵션 업데이트
-- 배고픔 정도: craving → not_hungry
-- 기분: stressed → anxious

-- 1. 기존 제약조건 제거
ALTER TABLE meal_events 
DROP CONSTRAINT IF EXISTS meal_events_hunger_level_check;

ALTER TABLE meal_events 
DROP CONSTRAINT IF EXISTS meal_events_mood_before_check;

-- 2. 기존 데이터 업데이트 (만약 있다면)
UPDATE meal_events 
SET hunger_level = 'not_hungry' 
WHERE hunger_level = 'craving';

UPDATE meal_events 
SET mood_before = 'anxious' 
WHERE mood_before = 'stressed';

-- 3. 새로운 제약조건 추가
ALTER TABLE meal_events 
ADD CONSTRAINT meal_events_hunger_level_check 
CHECK (hunger_level IN ('low', 'medium', 'high', 'not_hungry'));

ALTER TABLE meal_events 
ADD CONSTRAINT meal_events_mood_before_check 
CHECK (mood_before IN ('fresh', 'calm', 'tired', 'anxious'));

-- 4. 컬럼 코멘트 업데이트
COMMENT ON COLUMN meal_events.hunger_level IS '식사 전 배고픔 정도: low(매우배고픔), medium(배고픔), high(조금배고픔), not_hungry(배고프지않음)';
COMMENT ON COLUMN meal_events.mood_before IS '식사 전 기분: fresh(상쾌함), calm(평온함), tired(피곤함), anxious(불안함)';

-- 5. 확인 쿼리
SELECT 
    column_name,
    CASE 
        WHEN column_name = 'hunger_level' THEN 'low, medium, high, not_hungry'
        WHEN column_name = 'mood_before' THEN 'fresh, calm, tired, anxious'
        ELSE 'N/A'
    END as allowed_values
FROM information_schema.columns 
WHERE table_name = 'meal_events' 
AND column_name IN ('hunger_level', 'mood_before'); 