-- Simpler Sundays Database Setup
-- Copy and paste this entire file into Supabase SQL Editor

-- 1. User Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false,
  num_adults INTEGER DEFAULT 2,
  num_children INTEGER DEFAULT 0,
  child_age_ranges TEXT[],
  shopping_day TEXT DEFAULT 'Saturday',
  dinner_days_per_week INTEGER DEFAULT 5,
  plans_leftovers BOOLEAN DEFAULT true,
  cuisine_preferences TEXT[],
  meal_style_preferences TEXT[],
  allergies TEXT[],
  staple_meals TEXT[]
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Meal Plans
CREATE TABLE meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  nights_out TEXT[],
  special_plans JSONB,
  weekly_preferences TEXT[]
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own meal plans" ON meal_plans FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_meal_plans_user_week ON meal_plans(user_id, week_start_date);

-- 3. Meals
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  meal_plan_id UUID REFERENCES meal_plans ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  day_of_week TEXT NOT NULL,
  date DATE NOT NULL,
  ingredients JSONB NOT NULL,
  instructions TEXT[],
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  tags TEXT[],
  cuisine TEXT,
  is_liked BOOLEAN DEFAULT NULL,
  is_saved BOOLEAN DEFAULT false,
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own meals" ON meals FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_meals_user_plan ON meals(user_id, meal_plan_id);
CREATE INDEX idx_meals_user_date ON meals(user_id, date);
CREATE INDEX idx_meals_saved ON meals(user_id, is_saved) WHERE is_saved = true;

-- 4. Saved Recipes
CREATE TABLE saved_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT,
  ingredients JSONB NOT NULL,
  instructions TEXT[],
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  tags TEXT[],
  cuisine TEXT,
  times_used INTEGER DEFAULT 0,
  last_used_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved recipes" ON saved_recipes FOR ALL USING (auth.uid() = user_id);

-- 5. Grocery Lists
CREATE TABLE grocery_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  meal_plan_id UUID REFERENCES meal_plans ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own grocery lists" ON grocery_lists FOR ALL USING (auth.uid() = user_id);

-- 6. Preference Signals
CREATE TABLE preference_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  meal_id UUID REFERENCES meals ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  meal_name TEXT,
  cuisine TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE preference_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own signals" ON preference_signals FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_signals_user_type ON preference_signals(user_id, signal_type);

-- 7. Recipe Cache (for AI-generated recipes to reduce API costs)
CREATE TABLE recipe_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,
  instructions TEXT[],
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  tags TEXT[],
  cuisine TEXT,
  times_generated INTEGER DEFAULT 1,
  last_used_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- No RLS needed - this is a global cache shared across all users
CREATE INDEX idx_recipe_cache_name ON recipe_cache(name);
CREATE INDEX idx_recipe_cache_cuisine ON recipe_cache(cuisine);
CREATE INDEX idx_recipe_cache_tags ON recipe_cache USING GIN(tags);

-- Additional Indexes
CREATE INDEX idx_profiles_user_id ON profiles(id);
CREATE INDEX idx_meal_plans_user_locked ON meal_plans(user_id, is_locked);
CREATE INDEX idx_meals_liked ON meals(user_id, is_liked) WHERE is_liked = true;
