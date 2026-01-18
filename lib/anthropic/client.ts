import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateMealPlan(preferences: {
  num_adults: number;
  num_children: number;
  child_age_ranges?: string[];
  dinner_days_per_week: number;
  breakfast_enabled?: boolean;
  lunch_enabled?: boolean;
  shopping_day: string;
  plans_leftovers: boolean;
  cuisine_preferences?: string[];
  meal_style_preferences?: string[];
  allergies?: string[];
  staple_meals?: string[];
  weekly_context?: string;
}) {
  const cookingDays = preferences.dinner_days_per_week;
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Build weekly context section if provided
  const weeklyContextSection = preferences.weekly_context
    ? `
USER'S WEEKLY CONTEXT (IMPORTANT - follow these specific requests):
"${preferences.weekly_context}"

Parse the above for:
- Specific meal requests (e.g., "taco tuesday" → make Tuesday a taco night)
- Days they're going out or not cooking (skip those days)
- Quick meal needs (e.g., "need something quick Wednesday")
- Theme nights (e.g., "pasta night", "pizza friday")

For SIMPLE/THEME nights (taco night, pasta night, pizza night, etc.):
- Use the theme as the meal name (e.g., "Taco Night")
- Provide ONLY a basic ingredient list for shopping - no detailed recipe instructions needed
- Keep instructions minimal: ["Prepare your favorite tacos with the ingredients above"]
- Mark with "simple" tag
- These are family staples where detailed instructions aren't needed
`
    : '';

  const prompt = `Generate a weekly meal plan based on these preferences:
- Household: ${preferences.num_adults} adults, ${preferences.num_children} children
- Age ranges: ${preferences.child_age_ranges?.join(', ') || 'None'}
- Dinners needed: ${cookingDays} per week
- Cuisine preferences: ${preferences.cuisine_preferences?.join(', ') || 'Any'}
- Meal styles: ${preferences.meal_style_preferences?.join(', ') || 'Any'}
- Allergies/restrictions: ${preferences.allergies?.join(', ') || 'None'}
- Family favorites: ${preferences.staple_meals?.join(', ') || 'None'}
${weeklyContextSection}

${preferences.plans_leftovers
  ? `Plan meals to create intentional leftovers where practical. Mark leftover-friendly meals with a "leftovers" tag.`
  : ''}

Generate EXACTLY ${cookingDays} dinner meals for the week. Spread them across the week sensibly.

For FULL RECIPES (most meals), provide:
1. Meal name
2. Brief description (1 sentence)
3. Prep time and cook time
4. Structured ingredients with quantities, units, and categories
5. Step-by-step instructions (4-8 steps)
6. Servings (for ${preferences.num_adults + preferences.num_children} people)
7. Tags

For SIMPLE/THEME NIGHTS (taco night, pasta night, etc. from user context):
1. Theme name (e.g., "Taco Night", "Pasta Night")
2. Brief description
3. Prep time and cook time (can be estimates)
4. Basic ingredient shopping list (just what they'd need to buy)
5. Minimal instructions: just 1-2 steps like "Prepare your favorite tacos"
6. Servings
7. Tags: include "simple"

Format as JSON:
{
  "meals": [
    {
      "day": "Monday",
      "mealType": "dinner",
      "name": "Meal Name",
      "description": "Brief description",
      "prepTime": "15 min",
      "cookTime": "30 min",
      "servings": 4,
      "ingredients": [
        {"name": "chicken breast", "amount": "1.5", "unit": "lbs", "category": "meat"},
        {"name": "olive oil", "amount": "2", "unit": "tbsp", "category": "pantry"}
      ],
      "instructions": ["step 1", "step 2", "step 3"],
      "tags": ["one-pan", "quick"]
    }
  ]
}

Categories for ingredients: produce, meat, seafood, dairy, pantry, spices, frozen, bakery, other
IMPORTANT: Return exactly ${cookingDays} dinner meals spread across the week.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
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

export async function regenerateSingleMeal(params: {
  day: string;
  preferences: {
    num_adults: number;
    num_children: number;
    child_age_ranges?: string[];
    cuisine_preferences?: string[];
    meal_style_preferences?: string[];
    allergies?: string[];
    plans_leftovers: boolean;
  };
  existingMealNames: string[];
  lockedDays?: Record<string, string>;
}) {
  const { day, preferences, existingMealNames, lockedDays = {} } = params;

  const prompt = `Generate ONE dinner recipe for ${day} based on these preferences:
- Household: ${preferences.num_adults} adults, ${preferences.num_children} children
- Age ranges: ${preferences.child_age_ranges?.join(', ') || 'None'}
- Plans for leftovers: ${preferences.plans_leftovers ? 'Yes' : 'No'}
- Cuisine preferences: ${preferences.cuisine_preferences?.join(', ') || 'Any'}
- Meal styles: ${preferences.meal_style_preferences?.join(', ') || 'Any'}
- Allergies/restrictions: ${preferences.allergies?.join(', ') || 'None'}

IMPORTANT: Avoid these meals already planned this week: ${existingMealNames.join(', ')}

${preferences.plans_leftovers
  ? 'Consider if this meal can create or use leftovers from other meals this week. Mark with "leftovers" tag if applicable.'
  : ''}

Provide:
1. Meal name (different from existing meals)
2. Brief description
3. Prep and cook time
4. Structured ingredients with amount, unit, category
5. Step-by-step instructions
6. Servings (for ${preferences.num_adults + preferences.num_children} people)

Format as JSON:
{
  "day": "${day}",
  "name": "Meal Name",
  "description": "Brief description",
  "prepTime": "15 min",
  "cookTime": "30 min",
  "servings": ${preferences.num_adults + preferences.num_children},
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "1",
      "unit": "cup",
      "category": "produce"
    }
  ],
  "instructions": ["step 1", "step 2"],
  "tags": ["tag1", "tag2"]
}

Categories: produce, meat, seafood, dairy, pantry, spices, frozen, bakery, other`;

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    system: 'You are a helpful meal planning assistant. Generate practical, family-friendly recipes. Always respond with valid JSON only, no markdown formatting.',
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return JSON.parse(content.text);
  }

  throw new Error('Unexpected response format from Claude API');
}
