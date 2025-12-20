import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateMealPlan(preferences: {
  num_adults: number;
  num_children: number;
  child_age_ranges?: string[];
  dinner_days_per_week: number;
  shopping_day: string;
  plans_leftovers: boolean;
  cuisine_preferences?: string[];
  meal_style_preferences?: string[];
  allergies?: string[];
  staple_meals?: string[];
}) {
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

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    system: 'You are a helpful meal planning assistant. Generate practical, family-friendly recipes that match user preferences. Always respond with valid JSON only, no markdown formatting.',
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return JSON.parse(content.text);
  }

  throw new Error('Unexpected response format from Claude API');
}
