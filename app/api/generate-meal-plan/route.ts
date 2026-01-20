import { NextRequest, NextResponse } from 'next/server';
import { generateMealPlan } from '@/lib/anthropic/client';
import { cacheRecipe } from '@/lib/recipeCache';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[generate-meal-plan] Request started');

  try {
    // Check for API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[generate-meal-plan] ANTHROPIC_API_KEY is not configured');
      return NextResponse.json(
        { error: 'API configuration error - missing Anthropic API key' },
        { status: 500 }
      );
    }

    const preferences = await request.json();
    console.log('[generate-meal-plan] Preferences received:', JSON.stringify({
      num_adults: preferences.num_adults,
      num_children: preferences.num_children,
      dinner_days_per_week: preferences.dinner_days_per_week,
      breakfast_enabled: preferences.breakfast_enabled,
      lunch_enabled: preferences.lunch_enabled,
    }));

    const generatedPlan = await generateMealPlan(preferences);
    const elapsed = Date.now() - startTime;
    console.log(`[generate-meal-plan] Generated ${generatedPlan.meals?.length || 0} meals in ${elapsed}ms`);

    // Cache the newly generated recipes (all meal types) - non-blocking
    if (generatedPlan.meals && generatedPlan.meals.length > 0) {
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
          }).catch(err => console.error('[generate-meal-plan] Cache error (non-fatal):', err))
        )
      );
    }

    return NextResponse.json({ meals: generatedPlan.meals });
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[generate-meal-plan] Error after ${elapsed}ms:`, {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      stack: error.stack?.substring(0, 500),
    });

    // Anthropic-specific errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your Anthropic API key configuration.' },
        { status: 500 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limited. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (error.status === 529 || error.message?.includes('overloaded')) {
      return NextResponse.json(
        { error: 'AI service is temporarily overloaded. Please try again in a few seconds.' },
        { status: 503 }
      );
    }

    const errorMessage = error.message || 'Failed to generate meal plan';
    const statusCode = error.status || 500;
    return NextResponse.json(
      { error: errorMessage, details: error.toString() },
      { status: statusCode }
    );
  }
}
