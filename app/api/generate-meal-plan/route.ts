import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const preferences = await request.json();

    const prompt = `Generate a weekly meal plan based on these preferences:
- Household: ${preferences.num_adults} adults, ${preferences.num_children} children
- Age ranges: ${preferences.child_age_ranges?.join(', ') || 'None'}
- Dinners needed: ${preferences.dinner_days_per_week} per week
- Shopping day: ${preferences.shopping_day}
- Plans for leftovers: ${preferences.plans_leftovers ? 'Yes' : 'No'}
- Cuisine preferences: ${preferences.cuisine_preferences?.join(', ') || 'Any'}
- Meal styles: ${preferences.meal_style_preferences?.join(', ') || 'Any'}
- Allergies/restrictions: ${preferences.allergies?.join(', ') || 'None'}
- Family favorites: ${preferences.staple_meals?.join(', ') || 'None'}

Generate ${preferences.dinner_days_per_week} dinner recipes for the week. For each meal, provide:
1. Meal name
2. Brief description (1 sentence)
3. Prep time and cook time
4. Ingredients list with quantities
5. Step-by-step instructions
6. Servings (for ${preferences.num_adults + preferences.num_children} people)

Format as JSON with this structure:
{
  "meals": [
    {
      "day": "Monday",
      "name": "Meal Name",
      "description": "Brief description",
      "prepTime": "15 min",
      "cookTime": "30 min",
      "servings": 4,
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": ["step 1", "step 2"],
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful meal planning assistant. Generate practical, family-friendly recipes that match user preferences. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const mealPlan = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(mealPlan);
  } catch (error: any) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}
