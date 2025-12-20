import { NextRequest, NextResponse } from 'next/server';
import { generateMealPlan } from '@/lib/anthropic/client';

export async function POST(request: NextRequest) {
  try {
    const preferences = await request.json();

    const mealPlan = await generateMealPlan(preferences);

    return NextResponse.json(mealPlan);
  } catch (error: any) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}
