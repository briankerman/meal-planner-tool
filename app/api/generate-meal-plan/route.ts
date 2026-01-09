import { NextRequest, NextResponse } from 'next/server';
import { generateMealPlan } from '@/lib/anthropic/client';
import { getCachedRecipesByPreferences, cacheRecipe } from '@/lib/recipeCache';

export async function POST(request: NextRequest) {
  try {
    const preferences = await request.json();

    // Calculate how many meals to generate
    const lockedDays = preferences.locked_days || {};
    const cookingDays = preferences.dinner_days_per_week;

    // Try to get some meals from cache first (up to 50% of needed meals)
    const maxCachedMeals = Math.floor(cookingDays / 2);
    const cachedRecipes = await getCachedRecipesByPreferences({
      cuisinePreferences: preferences.cuisine_preferences,
      mealStyles: preferences.meal_style_preferences,
      count: maxCachedMeals,
    });

    console.log(`Found ${cachedRecipes.length} cached recipes`);

    let meals: any[] = [];

    // If we got some cached recipes, use them
    if (cachedRecipes.length > 0) {
      // Convert cached recipes to meal format
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const availableDays = daysOfWeek.filter(day => !lockedDays[day]);

      meals = cachedRecipes.slice(0, Math.min(cachedRecipes.length, availableDays.length)).map((recipe, index) => ({
        day: availableDays[index],
        name: recipe.name,
        description: recipe.description || '',
        prepTime: recipe.prep_time_minutes ? `${recipe.prep_time_minutes} min` : '15 min',
        cookTime: recipe.cook_time_minutes ? `${recipe.cook_time_minutes} min` : '30 min',
        servings: preferences.num_adults + preferences.num_children,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        tags: recipe.tags || [],
      }));
    }

    // If we need more meals, generate them with Claude
    const remainingMeals = cookingDays - meals.length;

    if (remainingMeals > 0) {
      console.log(`Generating ${remainingMeals} new meals with Claude API`);

      // Adjust preferences to generate only remaining meals
      const adjustedPreferences = {
        ...preferences,
        dinner_days_per_week: remainingMeals,
      };

      const generatedPlan = await generateMealPlan(adjustedPreferences);

      // Cache the newly generated recipes
      if (generatedPlan.meals) {
        for (const meal of generatedPlan.meals) {
          await cacheRecipe({
            name: meal.name,
            description: meal.description,
            ingredients: meal.ingredients,
            instructions: meal.instructions,
            prep_time_minutes: parseInt(meal.prepTime) || undefined,
            cook_time_minutes: parseInt(meal.cookTime) || undefined,
            tags: meal.tags,
            cuisine: preferences.cuisine_preferences?.[0] || undefined,
          });
        }

        meals.push(...generatedPlan.meals);
      }
    }

    return NextResponse.json({ meals });
  } catch (error: any) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}
