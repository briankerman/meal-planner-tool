export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      meal_plans: {
        Row: MealPlan;
        Insert: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MealPlan, 'id' | 'user_id' | 'created_at'>>;
      };
      meals: {
        Row: Meal;
        Insert: Omit<Meal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Meal, 'id' | 'user_id' | 'created_at'>>;
      };
      saved_recipes: {
        Row: SavedRecipe;
        Insert: Omit<SavedRecipe, 'id' | 'created_at'>;
        Update: Partial<Omit<SavedRecipe, 'id' | 'user_id' | 'created_at'>>;
      };
      grocery_lists: {
        Row: GroceryList;
        Insert: Omit<GroceryList, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GroceryList, 'id' | 'user_id' | 'created_at'>>;
      };
      preference_signals: {
        Row: PreferenceSignal;
        Insert: Omit<PreferenceSignal, 'id' | 'created_at'>;
        Update: Partial<Omit<PreferenceSignal, 'id' | 'user_id' | 'created_at'>>;
      };
    };
  };
}

export interface Profile {
  id: string;
  email: string | null;
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
  num_adults: number;
  num_children: number;
  child_age_ranges: string[] | null;
  shopping_day: string;
  dinner_days_per_week: number;
  plans_leftovers: boolean;
  cuisine_preferences: string[] | null;
  meal_style_preferences: string[] | null;
  allergies: string[] | null;
  staple_meals: string[] | null;
}

export interface MealPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  nights_out: string[] | null;
  special_plans: Record<string, any> | null;
  weekly_preferences: string[] | null;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: string;
}

export interface Meal {
  id: string;
  user_id: string;
  meal_plan_id: string | null;
  name: string;
  description: string | null;
  day_of_week: string;
  date: string;
  ingredients: Ingredient[];
  instructions: string[] | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[] | null;
  cuisine: string | null;
  is_liked: boolean | null;
  is_saved: boolean;
  user_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedRecipe {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  source: string | null;
  ingredients: Ingredient[];
  instructions: string[] | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[] | null;
  cuisine: string | null;
  times_used: number;
  last_used_date: string | null;
  created_at: string;
}

export interface GroceryItem {
  name: string;
  amount: string;
  unit: string;
  category: string;
  checked: boolean;
}

export interface GroceryList {
  id: string;
  user_id: string;
  meal_plan_id: string;
  items: GroceryItem[];
  created_at: string;
  updated_at: string;
}

export interface PreferenceSignal {
  id: string;
  user_id: string;
  meal_id: string | null;
  signal_type: 'like' | 'dislike' | 'skip' | 'save' | 'repeat';
  meal_name: string | null;
  cuisine: string | null;
  tags: string[] | null;
  created_at: string;
}
