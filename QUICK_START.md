# Quick Start Guide

## 1. Run the SQL Setup (REQUIRED)

**Before anything else, set up your database:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in sidebar
4. Click **New Query**
5. Copy entire contents of `supabase-setup.sql`
6. Paste into editor
7. Click **Run** (or press Ctrl/Cmd + Enter)
8. Verify tables created in **Table Editor**

## 2. Start the Development Server

```bash
npm run dev
```

## 3. Test the Flow

1. **Sign Up**: http://localhost:3000/signup
   - Create a new account
   - Should auto-redirect to onboarding

2. **Onboarding**: Complete all 6 steps
   - Household info
   - Weekly routine
   - Week configuration
   - Preferences
   - Restrictions
   - Staple meals
   - Click "Complete Setup"

3. **Dashboard**: Generate your first meal plan
   - Click "Generate Meal Plan"
   - Wait ~10-15 seconds
   - View your weekly meals
   - Check grocery list

4. **Verify in Supabase**:
   - Go to Table Editor
   - Check `profiles` table (your profile)
   - Check `meal_plans` table (your plan)
   - Check `meals` table (your meals)
   - Check `recipe_cache` table (cached recipes)

## 4. What to Expect

**First Generation:**
- Takes ~10-15 seconds
- All meals from Claude API
- All recipes cached automatically

**Second Generation:**
- Takes ~5-10 seconds
- 50% from cache, 50% new
- New recipes added to cache

**Future Generations:**
- Gets faster over time
- More cache hits
- Lower API costs

## 5. Key Features

✅ **Authentication**: Secure login/signup
✅ **Data Persistence**: Everything saved to Supabase
✅ **Recipe Caching**: Automatic cost optimization
✅ **Grocery Lists**: Auto-generated from meal plan
✅ **Meal Regeneration**: Regenerate individual meals
✅ **Multi-device**: Access from any device

## 6. Common Issues

**Issue**: Can't sign up
- **Fix**: Check environment variables in `.env.local`
- **Fix**: Verify Supabase URL and anon key

**Issue**: "Not authenticated" error
- **Fix**: Run SQL setup script first
- **Fix**: Check auth trigger created

**Issue**: Meal plan not saving
- **Fix**: Check RLS policies in Supabase
- **Fix**: Verify SQL script ran successfully

**Issue**: Build errors
- **Fix**: Run `npm install` to update dependencies
- **Fix**: Check TypeScript errors with `npm run build`

## 7. Environment Variables

Ensure `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=sk-ant-api03-...
```

## 8. Deployment

**To Vercel:**

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

**To other hosts:**

1. Build: `npm run build`
2. Set environment variables
3. Start: `npm start`

## 9. Monitoring

**Check API usage:**
- Anthropic Console: https://console.anthropic.com
- Monitor token usage
- Track costs

**Check database:**
- Supabase Dashboard
- Table Editor for data
- Auth for users
- SQL Editor for queries

**Check caching effectiveness:**
```sql
-- See most popular cached recipes
SELECT name, times_generated, last_used_date
FROM recipe_cache
ORDER BY times_generated DESC
LIMIT 10;
```

## 10. Support

Need help? Check:
- `SETUP.md` - Detailed setup instructions
- `INTEGRATION_SUMMARY.md` - Complete feature list
- `DATABASE_SCHEMA.md` - Database documentation

---

**You're all set! 🚀**

Generate your first meal plan and start saving on API costs!
