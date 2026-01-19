import { NextRequest, NextResponse } from 'next/server';
import { generateMealPlan } from '@/lib/anthropic/client';
import { cacheRecipe } from '@/lib/recipeCache';

export async function POST(request: NextRequest) {
  try {
    // Check for API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not configured');
      return NextResponse.json(
        { error: 'API configuration error - missing Anthropic API key' },
        { status: 500 }
      );
    }

    const preferences = await request.json();
    console.log('Generating meal plan with preferences:', JSON.stringify(preferences, null, 2));

    const generatedPlan = await generateMealPlan(preferences);
    console.log('Generated plan successfully with', generatedPlan.meals?.length || 0, 'meals');

    // Cache the newly generated recipes (all meal types) - non-blocking
    if (generatedPlan.meals) {
      Promise.all(
        generatedPlan.meals.map((meal: any) =>
          cacheRecipe({
            name: meal.name,
            description: meal.description,
            ingredients: meal.ingredients,
            instructions: meal.instructions,
            prep_time_minutes: parseInt(meal.prepTime) || undefined,
            cook_time_minutes: parseInt(meal.cookTime) || undefined,
            tags: meal.tags,
            cuisine: preferences.cuisine_preferences?.[0] || undefined,
          }).catch(err => console.error('Cache error (non-fatal):', err))
        )
      );
    }

    return NextResponse.json({ meals: generatedPlan.meals });
  } catch (error: any) {
    console.error('Error generating meal plan:', error);
    const errorMessage = error.message || 'Failed to generate meal plan';
    const statusCode = error.status || 500;
    return NextResponse.json(
      { error: errorMessage, details: error.toString() },
      { status: statusCode }
    );
  }
}
