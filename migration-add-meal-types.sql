-- Migration: Add breakfast and lunch support
-- Run this if you already have the database set up

-- Add breakfast/lunch enabled columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS breakfast_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lunch_enabled BOOLEAN DEFAULT false;

-- Add meal_type column to meals table
ALTER TABLE meals
ADD COLUMN IF NOT EXISTS meal_type TEXT NOT NULL DEFAULT 'dinner';

-- Add meal_type column to saved_recipes table
ALTER TABLE saved_recipes
ADD COLUMN IF NOT EXISTS meal_type TEXT;

-- Update existing meals to have 'dinner' as meal_type if not set
UPDATE meals SET meal_type = 'dinner' WHERE meal_type IS NULL;
