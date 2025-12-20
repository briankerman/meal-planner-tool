import { NextRequest, NextResponse } from 'next/server';
import { regenerateSingleMeal } from '@/lib/anthropic/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { day, preferences, existingMeals, lockedDays } = body;

    if (!day || !preferences) {
      return NextResponse.json(
        { error: 'Missing required parameters: day, preferences' },
        { status: 400 }
      );
    }

    // Extract existing meal names to avoid duplicates
    const existingMealNames = existingMeals?.map((m: any) => m.name) || [];

    const newMeal = await regenerateSingleMeal({
      day,
      preferences,
      existingMealNames,
      lockedDays,
    });

    return NextResponse.json(newMeal);
  } catch (error: any) {
    console.error('Error regenerating meal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate meal' },
      { status: 500 }
    );
  }
}
