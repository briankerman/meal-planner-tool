# Feature Update Summary

## Overview
Five major features have been added to the Simpler Sundays meal planning tool to enhance functionality and user experience.

---

## 1. Breakfast & Lunch Support ✅

### What Changed:
- Users can now enable **breakfast** and **lunch** in addition to dinner
- Toggles added to onboarding flow (routine step)
- Dinner is always included, breakfast/lunch are optional
- Claude API now generates all enabled meal types for the full week

### Database Changes:
- Added `breakfast_enabled` column to `profiles` table
- Added `lunch_enabled` column to `profiles` table
- Added `meal_type` column to `meals` table (values: 'breakfast', 'lunch', 'dinner')
- Added `meal_type` column to `saved_recipes` table

### Files Modified:
- [supabase-setup.sql](supabase-setup.sql) - Full schema with new columns
- [migration-add-meal-types.sql](migration-add-meal-types.sql) - Migration for existing DBs
- [lib/types/database.ts](lib/types/database.ts) - TypeScript types
- [lib/anthropic/client.ts](lib/anthropic/client.ts) - AI generation logic
- [app/onboarding/page.tsx](app/onboarding/page.tsx) - Onboarding UI
- [app/dashboard/page.tsx](app/dashboard/page.tsx) - Display logic
- [lib/utils/groceryList.ts](lib/utils/groceryList.ts) - Meal interface

### Usage:
1. In onboarding, check "Breakfast" and/or "Lunch" boxes
2. Generate meal plan - all selected meal types appear for each day
3. Grocery list automatically includes ingredients from all meals

---

## 2. Simplified Onboarding ✅

### What Changed:
- **Removed** the "week_config" step (day-by-day Cook/Takeout/Leftovers selection)
- Kept only the "number of dinners per week" input
- Reduced onboarding from 6 steps to 5 steps
- Cleaner, faster user experience

### Files Modified:
- [app/onboarding/page.tsx](app/onboarding/page.tsx:7) - Removed Step type and render logic

### Reasoning:
Day-by-day configuration didn't impact meal generation output and added unnecessary complexity. Users can still specify total dinners per week, which is what matters for meal planning.

---

## 3. Meal Plan History ✅

### What Changed:
- New **History** page accessible from dashboard header
- View all previous meal plans sorted by week
- Expandable week cards showing all meals
- Click any meal to view full recipe details (ingredients, instructions)
- Current week badge for active meal plan

### Files Created:
- [app/history/page.tsx](app/history/page.tsx) - Full history UI

### Files Modified:
- [app/dashboard/page.tsx](app/dashboard/page.tsx:329-331) - Added "History" link in header

### Usage:
1. Click "History" in dashboard header
2. Browse previous weeks
3. Click "View" to expand a week
4. Click any meal to see recipe details

---

## 4. My Cookbook (Save Recipes) ✅

### What Changed:
- **Save to Cookbook** button in meal detail modals
- New **My Cookbook** page to view all saved recipes
- Filter saved recipes by meal type (All, Breakfast, Lunch, Dinner)
- Delete recipes from cookbook
- Prevents duplicate saves (alerts user if recipe already saved)

### Database Usage:
Uses existing `saved_recipes` table with fields:
- `name`, `description`, `meal_type`, `source`
- `ingredients`, `instructions`, `prep_time_minutes`, `cook_time_minutes`
- `tags`, `cuisine`, `times_used`, `last_used_date`

### Files Created:
- [app/cookbook/page.tsx](app/cookbook/page.tsx) - Cookbook UI
- [app/api/saved-recipes/route.ts](app/api/saved-recipes/route.ts) - API (GET, POST, DELETE)

### Files Modified:
- [app/dashboard/page.tsx](app/dashboard/page.tsx) - Save button in meal modal + "My Cookbook" link in header

### Usage:
1. Open any meal detail modal from dashboard
2. Click "Save to Cookbook" (green button)
3. Access saved recipes via "My Cookbook" in header
4. Filter by meal type or delete recipes

---

## 5. Grocery List Grouping Options ✅

### What Changed:
- Toggle between **By Category** and **By Meal** grouping
- **By Category** (default): Consolidates all ingredients by type (produce, meat, dairy, etc.)
- **By Meal**: Shows ingredients grouped by each individual meal

### Files Modified:
- [lib/utils/groceryList.ts](lib/utils/groceryList.ts) - Added `generateGroceryListByMeal()` function
- [app/dashboard/page.tsx](app/dashboard/page.tsx) - Toggle buttons and dual rendering logic

### Usage:
1. Generate a meal plan
2. Expand grocery list (click "Show")
3. Toggle between "By Category" and "By Meal" buttons
4. **By Category**: Best for shopping - consolidated view
5. **By Meal**: Best for meal prep - see what each recipe needs

---

## Migration Instructions

### For New Installations:
Run [supabase-setup.sql](supabase-setup.sql) in Supabase SQL Editor (already includes all new columns).

### For Existing Databases:
Run [migration-add-meal-types.sql](migration-add-meal-types.sql) in Supabase SQL Editor to add:
- `profiles.breakfast_enabled`
- `profiles.lunch_enabled`
- `meals.meal_type`
- `saved_recipes.meal_type`

---

## Testing Checklist

- [ ] Onboarding flow (5 steps, breakfast/lunch toggles work)
- [ ] Meal plan generation with breakfast/lunch enabled
- [ ] Meals display grouped by day with meal type badges
- [ ] History page shows past meal plans
- [ ] Save recipe to cookbook (prevents duplicates)
- [ ] My Cookbook page filters and deletes recipes
- [ ] Grocery list toggles between category/meal grouping
- [ ] Print/export grocery list works for both modes

---

## Notes

1. **Claude API Token Limit**: Increased from 4096 to 8192 to handle breakfast + lunch + dinner for 7 days
2. **Meal Generation**: Always generates 7 full days; locked days are handled by not including dinner on those days
3. **Grocery List**: Category grouping supports checkboxes with localStorage persistence; meal grouping is view-only (no checkboxes needed)
4. **Navigation**: Dashboard header now has History + My Cookbook links

---

## File Structure

```
mealplanningtool/
├── app/
│   ├── api/
│   │   ├── generate-meal-plan/route.ts (updated)
│   │   └── saved-recipes/route.ts (NEW)
│   ├── cookbook/page.tsx (NEW)
│   ├── dashboard/page.tsx (updated)
│   ├── history/page.tsx (NEW)
│   └── onboarding/page.tsx (updated)
├── lib/
│   ├── anthropic/client.ts (updated)
│   ├── types/database.ts (updated)
│   └── utils/groceryList.ts (updated)
├── migration-add-meal-types.sql (NEW)
├── supabase-setup.sql (updated)
└── FEATURE_UPDATE_SUMMARY.md (NEW)
```

---

## Future Enhancements

Potential improvements to consider:
- Recipe ratings and notes in cookbook
- Search/filter cookbook by cuisine, tags, prep time
- Export cookbook to PDF
- Swap meals between days (drag-and-drop)
- Recipe sharing between users
- Nutritional information display
