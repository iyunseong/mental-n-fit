-- =============================================
-- Update workout_logs table structure
-- Replace plain text description with structured JSONB data
-- =============================================

-- Start transaction to ensure atomicity
BEGIN;

-- Step 1: Add the new workout_data JSONB column
ALTER TABLE workout_logs 
ADD COLUMN workout_data JSONB;

-- Step 2: Add comment to explain the new column structure
COMMENT ON COLUMN workout_logs.workout_data IS 
'Structured workout data stored as JSONB array. Example: [{"name": "Squat", "sets": 3, "reps": 10, "weight_kg": 80}, {"name": "Bench Press", "sets": 3, "reps": 8, "weight_kg": 60}]';

-- Step 3: Create an index on the JSONB column for better query performance
CREATE INDEX idx_workout_logs_workout_data ON workout_logs USING GIN (workout_data);

-- Step 4: (Optional) Migrate existing data if any exists
-- This converts existing description text to a simple JSON structure
-- Uncomment the following lines if you want to preserve existing data:

/*
UPDATE workout_logs 
SET workout_data = jsonb_build_array(
    jsonb_build_object(
        'name', 'Legacy Workout',
        'description', description,
        'notes', 'Migrated from text description'
    )
)
WHERE description IS NOT NULL 
AND description != '' 
AND workout_data IS NULL;
*/

-- Step 5: Drop the old description column
ALTER TABLE workout_logs 
DROP COLUMN description;

-- Step 6: Add a check constraint to ensure workout_data is a valid array
ALTER TABLE workout_logs 
ADD CONSTRAINT check_workout_data_is_array 
CHECK (jsonb_typeof(workout_data) = 'array' OR workout_data IS NULL);

-- Commit the transaction
COMMIT;

-- =============================================
-- Example usage after the update:
-- =============================================

/*
-- Insert a new workout log with structured data
INSERT INTO workout_logs (user_id, log_date, fatigue_before, mood_after, workout_data)
VALUES (
    'user-uuid-here',
    '2025-01-07',
    'medium',
    'refreshed',
    '[
        {
            "name": "Squat",
            "sets": 3,
            "reps": 10,
            "weight_kg": 80,
            "rest_seconds": 180
        },
        {
            "name": "Bench Press", 
            "sets": 3,
            "reps": 8,
            "weight_kg": 60,
            "rest_seconds": 120
        },
        {
            "name": "Deadlift",
            "sets": 1,
            "reps": 5,
            "weight_kg": 100,
            "rest_seconds": 300
        }
    ]'::jsonb
);

-- Query examples:

-- 1. Get all workouts that include squats
SELECT * FROM workout_logs 
WHERE workout_data @> '[{"name": "Squat"}]';

-- 2. Get workouts with specific exercise and weight
SELECT * FROM workout_logs 
WHERE workout_data @> '[{"name": "Bench Press", "weight_kg": 60}]';

-- 3. Extract exercise names from a workout
SELECT 
    log_date,
    jsonb_array_elements(workout_data) ->> 'name' as exercise_name
FROM workout_logs 
WHERE user_id = 'user-uuid-here';

-- 4. Get total sets for a specific exercise across all workouts
SELECT 
    SUM((jsonb_array_elements(workout_data) ->> 'sets')::int) as total_sets
FROM workout_logs 
WHERE workout_data @> '[{"name": "Squat"}]'
AND user_id = 'user-uuid-here';

-- 5. Get average weight for bench press
SELECT 
    AVG((exercise ->> 'weight_kg')::numeric) as avg_bench_weight
FROM workout_logs,
     jsonb_array_elements(workout_data) as exercise
WHERE exercise ->> 'name' = 'Bench Press'
AND user_id = 'user-uuid-here';
*/

-- =============================================
-- Table structure after the update:
-- =============================================

/*
workout_logs table columns:
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID (references auth.users)
- log_date: DATE
- fatigue_before: fatigue_enum
- mood_after: workout_mood_enum  
- workout_data: JSONB (NEW - structured workout data)
- created_at: TIMESTAMPTZ

Example workout_data structure:
[
    {
        "name": "Exercise Name",
        "sets": 3,
        "reps": 10,
        "weight_kg": 80,
        "rest_seconds": 180,
        "notes": "Optional notes"
    }
]
*/ 