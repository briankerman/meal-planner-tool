# Supabase Setup Instructions

## 1. Database Schema Setup

Run the SQL script to create all necessary tables:

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the entire contents of `supabase-setup.sql`
5. Click **Run** to execute the script

This will create:
- `profiles` - User profiles and preferences
- `meal_plans` - Weekly meal plan metadata
- `meals` - Individual meal recipes
- `saved_recipes` - User's saved recipes
- `grocery_lists` - Shopping lists
- `preference_signals` - User preference tracking
- `recipe_cache` - Global recipe cache (saves API costs!)

## 2. Environment Variables

Ensure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## 3. What Changed

### Authentication
- ✅ Proper Supabase auth with session management
- ✅ Signup/login using Supabase client (no hardcoded credentials)
- ✅ Auth middleware protecting routes
- ✅ Auto-redirect to login if not authenticated

### Data Persistence
- ✅ User profiles saved to Supabase (not localStorage)
- ✅ Meal plans saved to database with full history
- ✅ Meals saved with all recipe details
- ✅ Data persists across devices/browsers

### Recipe Caching System
- ✅ Global recipe cache table
- ✅ API checks cache before calling Claude
- ✅ Up to 50% of meals can come from cache
- ✅ Saves significant API costs over time
- ✅ Newly generated recipes automatically cached

### API Routes
- ✅ `/api/profile` - GET/PUT user profile
- ✅ `/api/meal-plans` - GET/POST meal plans
- ✅ `/api/meals` - GET/POST/PATCH meals
- ✅ `/api/recipe-cache` - GET/POST recipe cache
- ✅ All routes enforce auth and RLS

## 4. How Recipe Caching Works

1. User requests a meal plan
2. System checks `recipe_cache` for matching recipes (by cuisine, tags, etc.)
3. Uses up to 50% cached recipes (reduces Claude API calls)
4. Generates remaining meals with Claude API
5. Newly generated recipes are automatically cached
6. Over time, cache grows and API costs decrease

## 5. Testing

To test the integration:

1. Sign up with a new account
2. Complete onboarding
3. Generate a meal plan
4. Check Supabase dashboard to verify:
   - Profile was created
   - Meal plan was saved
   - Meals were saved
   - Recipes were cached

## 6. Migration Notes

Existing users with localStorage data:
- First login will create Supabase profile
- Onboarding data will save to Supabase
- Old localStorage meal plans won't migrate (generate new plan)
- Locked days still use localStorage temporarily (can migrate later)

## 7. Next Steps (Optional Enhancements)

- [ ] Add grocery list persistence to Supabase
- [ ] Implement preference signals tracking
- [ ] Add "save recipe" functionality
- [ ] Build recipe search/browse feature
- [ ] Add meal plan history view
- [ ] Implement recipe ratings and feedback
