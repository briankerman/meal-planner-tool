# Deployment Guide - Meal Prep & Persistence Features

This guide walks you through deploying the new meal prep, breakfast/lunch support, and persistence features.

## 📋 Pre-Deployment Checklist

- [ ] Review all changes in the PR
- [ ] Backup your Supabase database
- [ ] Test locally before deploying to production
- [ ] Have Supabase SQL editor ready

---

## 🗄️ Step 1: Run Database Migration

**IMPORTANT: Run this BEFORE deploying the code changes**

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `migration-complete.sql`
4. Paste into the SQL editor
5. Click **Run**

### Option B: Via Command Line

```bash
psql $DATABASE_URL < migration-complete.sql
```

### Verify Migration Success

Run this query in SQL editor to verify:

```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('breakfast_days_per_week', 'lunch_days_per_week');

-- Should return 2 rows
```

---

## 🚀 Step 2: Create & Merge Pull Request

1. **Create PR**: Click this link
   ```
   https://github.com/briankerman/meal-planner-tool/compare/main...claude/verify-vercel-domain-hcZ0r
   ```

2. **Review Changes**: Verify all files look correct

3. **Merge to Main**: Click "Merge pull request"

4. **Wait for Deployment**: Vercel will automatically deploy (usually 2-3 minutes)

---

## 🧪 Step 3: Test the Deployment

### A. Test Meal Prep Generation (Local First)

1. Start your local dev server:
   ```bash
   npm run dev
   ```

2. Run the test script:
   ```bash
   node test-meal-prep-generation.js
   ```

3. **Expected Results:**
   - 3 unique breakfast recipes distributed across 7 days
   - 3 unique lunch recipes distributed across 7 days
   - 5 dinner recipes
   - Breakfast/lunch recipes have "meal-prep" tags
   - Storage instructions in recipe steps

### B. Test in Production

1. Visit your Vercel deployment URL

2. **Test Onboarding Flow:**
   - Sign up as a new user
   - Complete onboarding
   - Enable breakfast (select 3 recipes)
   - Enable lunch (select 3 recipes)
   - Select 5 dinners per week
   - Complete onboarding

3. **Test Meal Generation:**
   - Click "Generate This Week's Plan"
   - Verify you see breakfast, lunch, and dinner meals
   - Check that meals are color-coded (amber, green, blue)
   - Verify meal prep recipes have storage instructions

4. **Test Persistence:**
   - Regenerate a single meal
   - Refresh the page
   - Verify the regenerated meal is still there (not lost)

5. **Test Week Expiration:**
   - Wait until after Saturday 11:59pm OR manually update database
   - Verify expiration banner appears
   - Verify regenerate buttons are disabled

6. **Test History:**
   - Go to `/history`
   - Add notes to a past meal
   - Verify notes save and display correctly

---

## 📊 Step 4: Monitor & Validate

### Check Error Logs

**Vercel Dashboard:**
1. Go to your project in Vercel
2. Click "Functions" tab
3. Check for any errors in `api/generate-meal-plan`

**Expected Log Output:**
```
Generating meal plan with preferences: {...}
Generated plan successfully with 15 meals
```

### Database Queries to Monitor

```sql
-- Check if new meal types are being created
SELECT meal_type, COUNT(*) as count
FROM meals
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY meal_type;

-- Check if users have breakfast/lunch preferences
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE breakfast_enabled = true) as breakfast_users,
  COUNT(*) FILTER (WHERE lunch_enabled = true) as lunch_users
FROM profiles
WHERE onboarding_completed = true;
```

---

## 🐛 Troubleshooting

### Issue: "Column does not exist" error

**Cause:** Migration not run yet  
**Fix:** Run `migration-complete.sql` in Supabase

### Issue: Meals not persisting after regeneration

**Cause:** Code deployed before migration  
**Fix:** Clear browser cache, hard refresh (Cmd+Shift+R)

### Issue: AI generates 7 breakfasts instead of user's selection

**Cause:** Preferences not being passed correctly  
**Fix:** Check that `breakfast_days_per_week` is in the API request body

### Issue: Grocery list missing breakfast/lunch items

**Cause:** Grocery list not filtering by enabled meal types  
**Fix:** Already fixed in this deployment - verify by checking grocery list

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong, here's how to rollback:

### 1. Revert Code Deployment

In GitHub:
```bash
git revert <merge-commit-hash>
git push origin main
```

### 2. Rollback Database (Optional)

If you need to remove the new columns:

```sql
-- Rollback migration
DROP INDEX IF EXISTS idx_meals_meal_type;
DROP INDEX IF EXISTS idx_meals_user_meal_type;
ALTER TABLE profiles DROP COLUMN IF EXISTS breakfast_days_per_week;
ALTER TABLE profiles DROP COLUMN IF EXISTS lunch_days_per_week;
```

**Note:** Only rollback database if absolutely necessary. The new columns are backward compatible and won't break existing functionality.

---

## ✅ Post-Deployment Checklist

- [ ] Migration ran successfully
- [ ] PR merged and deployed to Vercel
- [ ] Test user can complete onboarding with breakfast/lunch
- [ ] Meal generation works for all meal types
- [ ] Meals persist across page refreshes
- [ ] Week expiration works correctly
- [ ] History page shows past plans
- [ ] Notes can be added to meals
- [ ] Grocery list includes all meal types
- [ ] No errors in Vercel function logs
- [ ] No errors in browser console

---

## 📞 Support

If you encounter any issues during deployment:

1. Check the error logs in Vercel Dashboard
2. Verify database migration ran successfully
3. Test locally with the provided test script
4. Check browser console for frontend errors

---

## 🎉 Success Metrics

After deployment, you should see:

- **User Experience:**
  - Users can select breakfast/lunch meal counts
  - Meal prep recipes with storage instructions
  - Persistent meal plans that survive page refreshes
  - Expired plans move to history automatically

- **Database:**
  - New `breakfast_days_per_week` and `lunch_days_per_week` columns populated
  - Meals table contains 'breakfast' and 'lunch' `meal_type` values
  - Indexes created for faster queries

- **API Performance:**
  - Meal generation completes in <10 seconds
  - No errors in function logs
  - Proper caching of recipes

---

**Deployment Complete! 🚀**

Your meal planner now supports comprehensive meal prep with breakfast and lunch planning.
