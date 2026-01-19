-- ============================================
-- COMPLETE MIGRATION FOR MEAL TYPE SUPPORT
-- ============================================
-- This migration adds support for breakfast and lunch meal types
-- Run this on your Supabase database before deploying

-- 1. Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS breakfast_days_per_week INTEGER,
ADD COLUMN IF NOT EXISTS lunch_days_per_week INTEGER;

-- Add comments
COMMENT ON COLUMN profiles.breakfast_days_per_week IS 'Number of unique breakfast recipes per week (2-7). User will meal prep and repeat recipes.';
COMMENT ON COLUMN profiles.lunch_days_per_week IS 'Number of unique lunch recipes per week (2-7). User will meal prep and repeat recipes.';

-- 2. Update meal_type column in meals table to support new types (if it doesn't already)
-- This ensures the meal_type column can store 'breakfast' and 'lunch' values

DO $$
BEGIN
    -- Check if meal_type column exists and update it if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'meals'
        AND column_name = 'meal_type'
    ) THEN
        -- Column exists, no action needed (TEXT type supports any value)
        RAISE NOTICE 'meal_type column already exists';
    ELSE
        -- Add the column if it doesn't exist
        ALTER TABLE meals ADD COLUMN meal_type TEXT DEFAULT 'dinner';
        RAISE NOTICE 'Added meal_type column to meals table';
    END IF;
END $$;

-- 3. Add index for faster queries on meal_type
CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON meals(meal_type);

-- 4. Add index for faster queries on user_id + meal_type
CREATE INDEX IF NOT EXISTS idx_meals_user_meal_type ON meals(user_id, meal_type);

-- 5. Verification queries
-- Run these after the migration to verify everything worked:

-- Check that new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('breakfast_days_per_week', 'lunch_days_per_week');

-- Check meal_type column and indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'meals'
AND (indexname LIKE '%meal_type%' OR indexname LIKE '%user_meal%');

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- Uncomment these lines if you need to rollback the migration

-- DROP INDEX IF EXISTS idx_meals_meal_type;
-- DROP INDEX IF EXISTS idx_meals_user_meal_type;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS breakfast_days_per_week;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS lunch_days_per_week;
