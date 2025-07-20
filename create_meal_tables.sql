-- =============================================
-- 식사 로그 시스템 테이블 생성
-- =============================================

-- Start transaction
BEGIN;

-- 1. food_db 테이블 생성 (음식 데이터베이스)
CREATE TABLE IF NOT EXISTS food_db (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    calories_per_100g DECIMAL(8,2),
    protein_per_100g DECIMAL(8,2),
    carbs_per_100g DECIMAL(8,2),
    fat_per_100g DECIMAL(8,2),
    fiber_per_100g DECIMAL(8,2),
    sugar_per_100g DECIMAL(8,2),
    sodium_per_100g DECIMAL(8,2),
    category VARCHAR(100),
    brand VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. meal_events 테이블 생성 (식사 이벤트)
CREATE TABLE IF NOT EXISTS meal_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    total_calories INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. meal_items 테이블 생성 (식사 아이템)
CREATE TABLE IF NOT EXISTS meal_items (
    id BIGSERIAL PRIMARY KEY,
    meal_event_id BIGINT REFERENCES meal_events(id) ON DELETE CASCADE,
    food_id BIGINT REFERENCES food_db(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL, -- 그램 단위
    calories INTEGER DEFAULT 0, -- 계산된 칼로리
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_food_db_name ON food_db(name);
CREATE INDEX IF NOT EXISTS idx_meal_events_user_date ON meal_events(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_meal_events_meal_type ON meal_events(meal_type);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_event ON meal_items(meal_event_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_food ON meal_items(food_id);

-- RLS (Row Level Security) 설정
ALTER TABLE meal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

-- meal_events RLS 정책
CREATE POLICY "Users can view own meal events" ON meal_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal events" ON meal_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal events" ON meal_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal events" ON meal_events
    FOR DELETE USING (auth.uid() = user_id);

-- meal_items RLS 정책 (meal_events를 통한 간접 접근)
CREATE POLICY "Users can view own meal items" ON meal_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_events 
            WHERE meal_events.id = meal_items.meal_event_id 
            AND meal_events.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own meal items" ON meal_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_events 
            WHERE meal_events.id = meal_items.meal_event_id 
            AND meal_events.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own meal items" ON meal_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meal_events 
            WHERE meal_events.id = meal_items.meal_event_id 
            AND meal_events.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own meal items" ON meal_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meal_events 
            WHERE meal_events.id = meal_items.meal_event_id 
            AND meal_events.user_id = auth.uid()
        )
    );

-- food_db는 모든 사용자가 읽을 수 있도록 설정
ALTER TABLE food_db ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view food database" ON food_db FOR SELECT USING (true);

-- 샘플 음식 데이터 추가
INSERT INTO food_db (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category) VALUES
('백미밥', 130, 2.5, 28, 0.3, '주식'),
('현미밥', 112, 2.8, 23, 0.9, '주식'),
('닭가슴살', 165, 31, 0, 3.6, '단백질'),
('계란', 155, 13, 1.1, 11, '단백질'),
('바나나', 89, 1.1, 23, 0.3, '과일'),
('사과', 52, 0.3, 14, 0.2, '과일'),
('브로콜리', 34, 2.8, 7, 0.4, '채소'),
('시금치', 23, 2.9, 3.6, 0.4, '채소'),
('아보카도', 160, 2, 9, 15, '과일'),
('연어', 208, 25, 0, 12, '단백질'),
('우유', 42, 3.4, 5, 1, '유제품'),
('요거트', 59, 10, 3.6, 0.4, '유제품'),
('오트밀', 389, 17, 66, 7, '곡물'),
('고구마', 86, 1.6, 20, 0.1, '채소'),
('토마토', 18, 0.9, 3.9, 0.2, '채소');

-- Commit the transaction
COMMIT;

-- =============================================
-- 사용 예시:
-- =============================================

/*
-- 1. 아침 식사 이벤트 생성
INSERT INTO meal_events (user_id, log_date, meal_type, total_calories)
VALUES ('user-uuid-here', '2025-01-16', 'breakfast', 520);

-- 2. 아침 식사에 음식 아이템 추가
INSERT INTO meal_items (meal_event_id, food_id, quantity, calories)
VALUES 
    (1, 1, 200, 260), -- 백미밥 200g
    (1, 3, 100, 165), -- 닭가슴살 100g
    (1, 4, 50, 78);   -- 계란 50g

-- 3. 사용자의 모든 식사 기록 조회
SELECT 
    me.log_date,
    me.meal_type,
    me.total_calories,
    COUNT(mi.id) as item_count
FROM meal_events me
LEFT JOIN meal_items mi ON me.id = mi.meal_event_id
WHERE me.user_id = 'user-uuid-here'
GROUP BY me.id, me.log_date, me.meal_type, me.total_calories
ORDER BY me.log_date DESC, me.meal_type;

-- 4. 특정 식사의 상세 정보 조회
SELECT 
    me.log_date,
    me.meal_type,
    fd.name as food_name,
    mi.quantity,
    mi.calories
FROM meal_events me
JOIN meal_items mi ON me.id = mi.meal_event_id
JOIN food_db fd ON mi.food_id = fd.id
WHERE me.user_id = 'user-uuid-here'
AND me.log_date = '2025-01-16'
AND me.meal_type = 'breakfast';
*/ 