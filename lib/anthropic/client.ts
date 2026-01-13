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
  locked_days?: Record<string, string>;
}) {
  // Calculate actual cooking days
  const lockedDays = preferences.locked_days || {};
  const lockedCount = Object.keys(lockedDays).length;
  const cookingDays = preferences.dinner_days_per_week;

  // Determine which meal types to generate
  const mealTypes: string[] = [];
  if (preferences.breakfast_enabled) mealTypes.push('breakfast');
  if (preferences.lunch_enabled) mealTypes.push('lunch');
  mealTypes.push('dinner'); // Always include dinner

  const totalMealsPerDay = mealTypes.length;
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Build locked days description
  const lockedDaysDesc = Object.entries(lockedDays)
    .map(([day, type]) => `${day}: ${type}`)
    .join(', ') || 'None';

  const prompt = `Generate a weekly meal plan based on these preferences:
- Household: ${preferences.num_adults} adults, ${preferences.num_children} children
- Age ranges: ${preferences.child_age_ranges?.join(', ') || 'None'}
- Meal types: ${mealTypes.join(', ')}
- Dinners needed: ${cookingDays} per week
- Shopping day: ${preferences.shopping_day}
- Locked days (no cooking): ${lockedDaysDesc}
- Plans for leftovers: ${preferences.plans_leftovers ? 'Yes' : 'No'}
- Cuisine preferences: ${preferences.cuisine_preferences?.join(', ') || 'Any'}
- Meal styles: ${preferences.meal_style_preferences?.join(', ') || 'Any'}
- Allergies/restrictions: ${preferences.allergies?.join(', ') || 'None'}
- Family favorites: ${preferences.staple_meals?.join(', ') || 'None'}

${preferences.plans_leftovers
  ? `IMPORTANT: Plan meals to create intentional leftovers. Include 1-2 "leftover nights" that repurpose previous meals (e.g., roast chicken Monday → chicken tacos Wednesday, or double the pasta sauce for two nights). Mark leftover-friendly meals with a "leftovers" tag and mention in the description how leftovers can be used.`
  : ''}

Generate meals for ALL 7 days of the week with the following meal types per day:
${preferences.breakfast_enabled ? '- 1 breakfast (quick, healthy options like overnight oats, smoothies, egg dishes)' : ''}
${preferences.lunch_enabled ? '- 1 lunch (portable, work-friendly options)' : ''}
- 1 dinner (main family meal)

${lockedCount > 0 ? `For locked days (${Object.keys(lockedDays).join(', ')}), still generate breakfast and lunch if enabled, but you may skip dinner or note it as "${lockedDaysDesc}".` : ''}

For each meal, provide:
1. Meal name
2. Meal type (breakfast, lunch, or dinner)
3. Brief description (1 sentence, mention if it creates/uses leftovers)
4. Prep time and cook time
5. Structured ingredients with quantities, units, and categories
6. Step-by-step instructions
7. Servings (for ${preferences.num_adults + preferences.num_children} people)
8. Tags (include "leftovers" if applicable, "quick" for breakfast/lunch)

Format as JSON with this EXACT structure:
{
  "meals": [
    {
      "day": "Monday",
      "mealType": "breakfast",
      "name": "Meal Name",
      "description": "Brief description",
      "prepTime": "5 min",
      "cookTime": "10 min",
      "servings": 4,
      "ingredients": [
        {
          "name": "oats",
          "amount": "2",
          "unit": "cups",
          "category": "pantry"
        },
        {
          "name": "milk",
          "amount": "3",
          "unit": "cups",
          "category": "dairy"
        }
      ],
      "instructions": ["step 1", "step 2", "step 3"],
      "tags": ["quick", "healthy"]
    },
    {
      "day": "Monday",
      "mealType": "dinner",
      "name": "Another Meal Name",
      "description": "Brief description",
      "prepTime": "15 min",
      "cookTime": "30 min",
      "servings": 4,
      "ingredients": [...],
      "instructions": [...],
      "tags": ["one-pan"]
    }
  ]
}

Categories for ingredients: produce, meat, seafood, dairy, pantry, spices, frozen, bakery, other
IMPORTANT: Return meals for all 7 days. Group meals by day and include the mealType field for each meal.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 8192,
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
    model: 'claude-3-5-haiku-20241022',
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
