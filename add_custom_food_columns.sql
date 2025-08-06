-- meal_items 테이블에 직접 입력 음식 정보 컬럼 추가
-- 실행 시기: MealLogForm에서 직접 입력 기능 추가 후

-- 직접 입력 음식명 컬럼 추가
ALTER TABLE meal_items 
ADD COLUMN IF NOT EXISTS custom_food_name VARCHAR(255);

-- 직접 입력 영양정보 컬럼들 추가
ALTER TABLE meal_items 
ADD COLUMN IF NOT EXISTS custom_calories_per_100g DECIMAL(8,2);

ALTER TABLE meal_items 
ADD COLUMN IF NOT EXISTS custom_protein_per_100g DECIMAL(8,2);

ALTER TABLE meal_items 
ADD COLUMN IF NOT EXISTS custom_carbs_per_100g DECIMAL(8,2);

ALTER TABLE meal_items 
ADD COLUMN IF NOT EXISTS custom_fat_per_100g DECIMAL(8,2);

-- 컬럼에 코멘트 추가
COMMENT ON COLUMN meal_items.custom_food_name IS '직접 입력된 음식명 (food_id가 null인 경우 사용)';
COMMENT ON COLUMN meal_items.custom_calories_per_100g IS '직접 입력된 칼로리 정보 (100g당)';
COMMENT ON COLUMN meal_items.custom_protein_per_100g IS '직접 입력된 단백질 정보 (100g당)';
COMMENT ON COLUMN meal_items.custom_carbs_per_100g IS '직접 입력된 탄수화물 정보 (100g당)';
COMMENT ON COLUMN meal_items.custom_fat_per_100g IS '직접 입력된 지방 정보 (100g당)';

-- food_id 컬럼을 nullable로 변경 (직접 입력 음식의 경우)
ALTER TABLE meal_items 
ALTER COLUMN food_id DROP NOT NULL;

-- 검증 제약조건 추가: food_id가 null이면 custom_food_name은 필수
ALTER TABLE meal_items 
ADD CONSTRAINT check_food_reference 
CHECK (
  (food_id IS NOT NULL AND custom_food_name IS NULL) OR 
  (food_id IS NULL AND custom_food_name IS NOT NULL)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_meal_items_custom_food_name ON meal_items(custom_food_name);

-- 확인 쿼리
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'meal_items' 
AND column_name LIKE '%custom%'; 