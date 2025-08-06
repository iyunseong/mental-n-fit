-- meal_events 테이블의 mood_after를 mood_before로 변경
-- 실행 시기: MealLogForm에서 식사 전 기분으로 변경 후

-- 기존 제약조건 제거 (mood_after 관련)
ALTER TABLE meal_events 
DROP CONSTRAINT IF EXISTS meal_events_mood_after_check;

-- 컬럼명 변경: mood_after → mood_before
ALTER TABLE meal_events 
RENAME COLUMN mood_after TO mood_before;

-- 새로운 값들에 대한 제약조건 추가
ALTER TABLE meal_events 
ADD CONSTRAINT meal_events_mood_before_check 
CHECK (mood_before IN ('fresh', 'calm', 'tired', 'stressed'));

-- 기본값 변경 (normal → calm)
ALTER TABLE meal_events 
ALTER COLUMN mood_before SET DEFAULT 'calm';

-- 기존 데이터 업데이트 (만약 있다면)
UPDATE meal_events 
SET mood_before = CASE 
  WHEN mood_before = 'energetic' THEN 'fresh'
  WHEN mood_before = 'normal' THEN 'calm'
  WHEN mood_before = 'lethargic' THEN 'tired'
  WHEN mood_before = 'bloated' THEN 'stressed'
  ELSE 'calm'
END;

-- 인덱스 재생성 (이름 변경)
DROP INDEX IF EXISTS idx_meal_events_mood_after;
CREATE INDEX IF NOT EXISTS idx_meal_events_mood_before ON meal_events(mood_before);

-- 컬럼 코멘트 업데이트
COMMENT ON COLUMN meal_events.mood_before IS '식사 전 현재 기분: fresh(상쾌함), calm(평온함), tired(피곤함), stressed(스트레스)';

-- 확인 쿼리
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'meal_events' 
AND column_name = 'mood_before'; 