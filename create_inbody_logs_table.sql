-- InBody 로그 테이블 생성 스크립트
-- InBody 로그 테이블 생성 (IF NOT EXISTS 사용으로 안전하게 생성)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inbody_logs') THEN
        CREATE TABLE inbody_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            log_date DATE NOT NULL,
            weight_kg DECIMAL(5,2) NOT NULL,
            skeletal_muscle_kg DECIMAL(5,2),
            body_fat_percentage DECIMAL(4,2),
            body_fat_kg DECIMAL(5,2),
            bmi DECIMAL(4,2),
            body_water_percentage DECIMAL(4,2),
            protein_percentage DECIMAL(4,2),
            mineral_percentage DECIMAL(4,2),
            visceral_fat_level INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            -- 사용자별로 같은 날짜에는 하나의 기록만 허용
            CONSTRAINT unique_user_date UNIQUE(user_id, log_date)
        );
        
        RAISE NOTICE 'inbody_logs 테이블이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'inbody_logs 테이블이 이미 존재합니다.';
    END IF;
END $$;

-- 인덱스 생성 (성능 향상)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_inbody_logs_user_date') THEN
        CREATE INDEX idx_inbody_logs_user_date ON inbody_logs(user_id, log_date DESC);
        RAISE NOTICE 'inbody_logs 인덱스가 생성되었습니다.';
    ELSE
        RAISE NOTICE 'inbody_logs 인덱스가 이미 존재합니다.';
    END IF;
END $$;

-- Row Level Security (RLS) 활성화
ALTER TABLE inbody_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (사용자가 자신의 데이터만 볼 수 있도록)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'inbody_logs' AND policyname = 'Users can view own inbody_logs') THEN
        CREATE POLICY "Users can view own inbody_logs" ON inbody_logs
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE 'inbody_logs SELECT 정책이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'inbody_logs SELECT 정책이 이미 존재합니다.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'inbody_logs' AND policyname = 'Users can insert own inbody_logs') THEN
        CREATE POLICY "Users can insert own inbody_logs" ON inbody_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'inbody_logs INSERT 정책이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'inbody_logs INSERT 정책이 이미 존재합니다.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'inbody_logs' AND policyname = 'Users can update own inbody_logs') THEN
        CREATE POLICY "Users can update own inbody_logs" ON inbody_logs
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE 'inbody_logs UPDATE 정책이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'inbody_logs UPDATE 정책이 이미 존재합니다.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'inbody_logs' AND policyname = 'Users can delete own inbody_logs') THEN
        CREATE POLICY "Users can delete own inbody_logs" ON inbody_logs
            FOR DELETE USING (auth.uid() = user_id);
        RAISE NOTICE 'inbody_logs DELETE 정책이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'inbody_logs DELETE 정책이 이미 존재합니다.';
    END IF;
END $$;

-- 완료 메시지
SELECT 'InBody 로그 테이블 설정이 완료되었습니다!' as result; 