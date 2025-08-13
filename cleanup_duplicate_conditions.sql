-- 중복된 Daily Conditions 기록 정리 스크립트
-- 같은 사용자의 같은 날짜에 여러 기록이 있으면 가장 최근 것만 남김

-- 1. 중복 기록 확인
SELECT 
    user_id, 
    log_date, 
    COUNT(*) as record_count
FROM daily_conditions 
GROUP BY user_id, log_date 
HAVING COUNT(*) > 1
ORDER BY user_id, log_date;

-- 2. 중복 기록 중 가장 오래된 것들 삭제 (가장 최근 것만 유지)
WITH ranked_records AS (
    SELECT 
        id,
        user_id,
        log_date,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, log_date 
            ORDER BY created_at DESC
        ) as rn
    FROM daily_conditions
),
records_to_delete AS (
    SELECT id 
    FROM ranked_records 
    WHERE rn > 1
)
DELETE FROM daily_conditions 
WHERE id IN (SELECT id FROM records_to_delete);

-- 3. 정리 후 결과 확인
SELECT 
    user_id, 
    log_date, 
    COUNT(*) as record_count
FROM daily_conditions 
GROUP BY user_id, log_date 
HAVING COUNT(*) > 1
ORDER BY user_id, log_date;

-- 4. 최종 테이블 상태 확인
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(log_date) as earliest_date,
    MAX(log_date) as latest_date
FROM daily_conditions;

SELECT '중복 Daily Conditions 기록 정리가 완료되었습니다!' as result; 