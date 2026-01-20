import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper to parse JSON from Claude response with repair for truncated responses
function parseClaudeJson(text: string, stopReason?: string): any {
  console.log('Claude response stop_reason:', stopReason, 'length:', text.length);

  let jsonText = text.trim();

  // Find the first { to start JSON
  const firstBrace = jsonText.indexOf('{');
  if (firstBrace !== -1) {
    jsonText = jsonText.substring(firstBrace);
  }

  try {
    return JSON.parse(jsonText);
  } catch (parseError) {
    // If JSON is truncated, try to repair it
    console.error('JSON parse error, attempting repair...');

    // Strategy: find the last complete meal object and truncate there
    // Look for pattern: },"tags":[...]} or similar endings of a meal object
    const mealEndPattern = /\}\s*\]\s*\}\s*,?\s*$/;
    const mealsArrayPattern = /"meals"\s*:\s*\[/;

    // Find where the meals array starts
    const mealsMatch = jsonText.match(mealsArrayPattern);
    if (!mealsMatch || mealsMatch.index === undefined) {
      console.error('Could not find meals array');
      throw parseError;
    }

    // Find all complete meal objects (ending with }] for tags array then } for meal object)
    // Each meal ends with: ...],"tags":[...]}
    let lastValidEnd = -1;
    let searchFrom = mealsMatch.index;

    // Find each occurrence of }] which ends a tags array, then } which ends the meal
    const tagEndRegex = /\]\s*\}/g;
    let match;
    while ((match = tagEndRegex.exec(jsonText)) !== null) {
      // Check if this could be end of a meal object
      lastValidEnd = match.index + match[0].length;
    }

    if (lastValidEnd > searchFrom) {
      // Truncate to last valid meal end
      let repairedJson = jsonText.substring(0, lastValidEnd);

      // Count remaining open brackets
      let openBraces = 0;
      let openBrackets = 0;
      for (const char of repairedJson) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '[') openBrackets++;
        if (char === ']') openBrackets--;
      }

      // Close the meals array and root object
      for (let i = 0; i < openBrackets; i++) repairedJson += ']';
      for (let i = 0; i < openBraces; i++) repairedJson += '}';

      try {
        const result = JSON.parse(repairedJson);
        console.log('JSON repair successful, meals count:', result.meals?.length);
        return result;
      } catch (repairError2) {
        console.error('JSON repair attempt 1 failed, trying simpler approach');
      }
    }

    // Simpler fallback: just close all open brackets
    let openBraces = 0;
    let openBrackets = 0;
    for (const char of jsonText) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }

    let repairedJson = jsonText;
    for (let i = 0; i < openBrackets; i++) repairedJson += ']';
    for (let i = 0; i < openBraces; i++) repairedJson += '}';

    try {
      const result = JSON.parse(repairedJson);
      console.log('JSON repair (simple) successful, meals count:', result.meals?.length);
      return result;
    } catch (repairError) {
      console.error('All JSON repair attempts failed');
      throw parseError;
    }
  }
}

// Generate meals for a single meal type with retry logic
async function generateMealsForType(
  mealType: 'breakfast' | 'lunch' | 'dinner',
  count: number,
  preferences: any,
  retryCount = 0
): Promise<any[]> {
  const MAX_RETRIES = 2;
  const servings = preferences.num_adults + preferences.num_children;

  const typeGuidelines: Record<string, string> = {
    breakfast: `Create ${count} unique BREAKFAST recipes for meal prep.
- Focus on batch-friendly options: overnight oats, egg muffins, breakfast burritos, smoothie packs
- Each should be make-ahead friendly
- Include storage/reheating tips in instructions`,
    lunch: `Create ${count} unique LUNCH recipes for meal prep.
- Focus on portable, make-ahead options: grain bowls, salads, wraps, soups
- Should hold up well for 3-5 days in fridge
- Good for taking to work/school`,
    dinner: `Create ${count} unique DINNER recipes.
${preferences.weekly_context ? `Consider user's context: "${preferences.weekly_context}"` : ''}
${preferences.plans_leftovers ? '- Plan meals that create intentional leftovers when practical. Add "leftovers" tag.' : ''}`
  };

  const prompt = `Generate exactly ${count} ${mealType} recipes as JSON.

Preferences:
- Household: ${preferences.num_adults} adults, ${preferences.num_children} children
- Cuisine: ${preferences.cuisine_preferences?.join(', ') || 'Any'}
- Allergies: ${preferences.allergies?.join(', ') || 'None'}

${typeGuidelines[mealType]}

KEEP RECIPES CONCISE - 5-6 ingredients, 3-4 instruction steps max.

Output JSON format:
{
  "meals": [
    {
      "day": "Monday",
      "mealType": "${mealType}",
      "name": "Recipe Name",
      "description": "Brief description",
      "prepTime": "10 min",
      "cookTime": "20 min",
      "servings": ${servings},
      "ingredients": [{"name": "item", "amount": "1", "unit": "cup", "category": "produce"}],
      "instructions": ["Step 1", "Step 2"],
      "tags": ["tag1"]
    }
  ]
}

Assign each meal to a different day. Categories: produce, meat, seafood, dairy, pantry, spices, frozen, bakery, other`;

  try {
    console.log(`[${mealType}] Starting generation for ${count} meals (attempt ${retryCount + 1})`);

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      system: 'You are a meal planning JSON generator. Output ONLY valid JSON. Start with { and end with }.',
    });

    console.log(`[${mealType}] API response received, stop_reason: ${message.stop_reason}`);

    const content = message.content[0];
    if (content.type === 'text') {
      const parsed = parseClaudeJson(content.text, message.stop_reason);
      const meals = parsed.meals || [];
      console.log(`[${mealType}] Successfully parsed ${meals.length} meals`);
      return meals;
    }
    return [];
  } catch (error: any) {
    console.error(`[${mealType}] Error on attempt ${retryCount + 1}:`, error.message || error);

    if (retryCount < MAX_RETRIES) {
      console.log(`[${mealType}] Retrying in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateMealsForType(mealType, count, preferences, retryCount + 1);
    }

    console.error(`[${mealType}] All retries exhausted, returning empty array`);
    return [];
  }
}

export async function generateMealPlan(preferences: {
  num_adults: number;
  num_children: number;
  child_age_ranges?: string[];
  dinner_days_per_week: number;
  breakfast_enabled?: boolean;
  lunch_enabled?: boolean;
  breakfast_days_per_week?: number;
  lunch_days_per_week?: number;
  shopping_day: string;
  plans_leftovers: boolean;
  cuisine_preferences?: string[];
  meal_style_preferences?: string[];
  allergies?: string[];
  staple_meals?: string[];
  weekly_context?: string;
}) {
  console.log('Starting meal plan generation with preferences:', JSON.stringify({
    dinner_days_per_week: preferences.dinner_days_per_week,
    breakfast_enabled: preferences.breakfast_enabled,
    lunch_enabled: preferences.lunch_enabled,
    breakfast_days_per_week: preferences.breakfast_days_per_week,
    lunch_days_per_week: preferences.lunch_days_per_week,
  }));

  const cookingDays = preferences.dinner_days_per_week;
  const breakfastMeals = preferences.breakfast_enabled ? (preferences.breakfast_days_per_week || 5) : 0;
  const lunchMeals = preferences.lunch_enabled ? (preferences.lunch_days_per_week || 5) : 0;

  // Generate each meal type separately to avoid token limits
  const allMeals: any[] = [];
  const errors: string[] = [];

  // Generate meals in parallel for speed, but use allSettled to handle partial failures
  const tasks: { type: 'breakfast' | 'lunch' | 'dinner'; count: number }[] = [];

  if (breakfastMeals > 0) {
    tasks.push({ type: 'breakfast', count: breakfastMeals });
  }
  if (lunchMeals > 0) {
    tasks.push({ type: 'lunch', count: lunchMeals });
  }
  tasks.push({ type: 'dinner', count: cookingDays });

  console.log(`Generating ${tasks.length} meal types: ${tasks.map(t => `${t.count} ${t.type}`).join(', ')}`);

  const results = await Promise.allSettled(
    tasks.map(task => generateMealsForType(task.type, task.count, preferences))
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const task = tasks[i];

    if (result.status === 'fulfilled') {
      console.log(`[${task.type}] Got ${result.value.length} meals`);
      allMeals.push(...result.value);
    } else {
      console.error(`[${task.type}] Failed:`, result.reason);
      errors.push(`${task.type}: ${result.reason?.message || 'Unknown error'}`);
    }
  }

  console.log(`Generated ${allMeals.length} total meals, ${errors.length} errors`);

  // If we got no meals at all, throw an error
  if (allMeals.length === 0) {
    throw new Error(`Failed to generate any meals. Errors: ${errors.join('; ')}`);
  }

  return { meals: allMeals };
}

export async function regenerateSingleMeal(params: {
  day: string;
  mealType?: string;
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
  const { day, mealType = 'dinner', preferences, existingMealNames, lockedDays = {} } = params;

  // Build meal type specific guidelines
  let mealTypeGuidelines = '';
  if (mealType === 'breakfast') {
    mealTypeGuidelines = `
BREAKFAST GUIDELINES:
- Keep it practical and family-friendly
- Quick options for busy mornings (5-15 min prep)
- Consider both quick options and special breakfast ideas
- Make it appealing for the whole family`;
  } else if (mealType === 'lunch') {
    mealTypeGuidelines = `
LUNCH GUIDELINES:
- Mix of hot and cold options
- Lunch-box friendly for kids if applicable
- Quick to prepare (10-20 min)
- Sandwich, salad, and warm meal variety`;
  } else {
    mealTypeGuidelines = `
DINNER GUIDELINES:
- Family-friendly and satisfying
- Balance of nutrition and taste
- Consider preparation time and complexity`;
  }

  const prompt = `Generate ONE ${mealType} recipe for ${day} based on these preferences:
- Household: ${preferences.num_adults} adults, ${preferences.num_children} children
- Age ranges: ${preferences.child_age_ranges?.join(', ') || 'None'}
- Plans for leftovers: ${preferences.plans_leftovers ? 'Yes' : 'No'}
- Cuisine preferences: ${preferences.cuisine_preferences?.join(', ') || 'Any'}
- Meal styles: ${preferences.meal_style_preferences?.join(', ') || 'Any'}
- Allergies/restrictions: ${preferences.allergies?.join(', ') || 'None'}

IMPORTANT: Avoid these meals already planned this week: ${existingMealNames.join(', ')}

${mealTypeGuidelines}

${preferences.plans_leftovers && mealType === 'dinner'
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
  "mealType": "${mealType}",
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
    system: 'You are a meal planning JSON generator. Output ONLY valid JSON, nothing else. No explanations, no markdown, no text before or after the JSON. Start your response with { and end with }.',
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return parseClaudeJson(content.text, message.stop_reason);
  }

  throw new Error('Unexpected response format from Claude API');
}
