-- daily_conditions 테이블에 diary_entry 컬럼 추가
-- 일기 기능을 위한 스키마 업데이트

-- diary_entry 컬럼 안전하게 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_conditions' AND column_name = 'diary_entry'
    ) THEN
        ALTER TABLE daily_conditions ADD COLUMN diary_entry TEXT;
    END IF;
END $$;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN daily_conditions.diary_entry IS '일일 일기: 자유 형식의 텍스트로 하루를 기록';

-- 확인 쿼리
SELECT 
    '=== diary_entry 컬럼 추가 완료 ===' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_conditions' AND column_name = 'diary_entry';

SELECT 
    '=== 업데이트 완료! ===' as result; 