-- Migration: Add breakfast_days_per_week and lunch_days_per_week columns to profiles table

-- Add columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS breakfast_days_per_week INTEGER,
ADD COLUMN IF NOT EXISTS lunch_days_per_week INTEGER;

-- Add comments to document the columns
COMMENT ON COLUMN profiles.breakfast_days_per_week IS 'Number of unique breakfast recipes per week (2-7). User will meal prep and repeat recipes.';
COMMENT ON COLUMN profiles.lunch_days_per_week IS 'Number of unique lunch recipes per week (2-7). User will meal prep and repeat recipes.';
