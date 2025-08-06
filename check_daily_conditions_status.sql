-- check_daily_conditions_status.sql 실행

-- 1. daily_conditions 테이블 구조 확인
SELECT 
    '=== daily_conditions 테이블 구조 ===' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_conditions'
ORDER BY ordinal_position;

-- 2. enum 타입들 존재 여부 확인
SELECT 
    '=== enum 타입들 확인 ===' as info;

SELECT 
    typname as enum_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mood_enum') THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as mood_enum_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fatigue_level_enum') THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as fatigue_level_enum_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sleep_quality_enum') THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as sleep_quality_enum_status
FROM pg_type 
WHERE typname IN ('mood_enum', 'fatigue_level_enum', 'sleep_quality_enum')
LIMIT 1;

-- enum 값들 확인
SELECT t.typname, e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('mood_enum', 'fatigue_level_enum', 'sleep_quality_enum')
ORDER BY t.typname, e.enumsortorder;

-- 3. 테이블 존재 여부 확인
SELECT 
    '=== 테이블 존재 여부 ===' as info;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_conditions') 
        THEN 'daily_conditions 테이블 EXISTS'
        ELSE 'daily_conditions 테이블 NOT EXISTS'
    END as table_status; 