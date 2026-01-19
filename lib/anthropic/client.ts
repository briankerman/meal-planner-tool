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
  const cookingDays = preferences.dinner_days_per_week;
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Calculate total unique meals needed (for meal prep)
  const breakfastMeals = preferences.breakfast_enabled ? (preferences.breakfast_days_per_week || 5) : 0;
  const lunchMeals = preferences.lunch_enabled ? (preferences.lunch_days_per_week || 5) : 0;
  const dinnerMeals = cookingDays;

  // Build meal type context
  const mealTypesNeeded = [];
  if (preferences.breakfast_enabled) {
    mealTypesNeeded.push(`${breakfastMeals} unique breakfast recipes (meal prep-friendly)`);
  }
  if (preferences.lunch_enabled) {
    mealTypesNeeded.push(`${lunchMeals} unique lunch recipes (meal prep-friendly)`);
  }
  mealTypesNeeded.push(`${dinnerMeals} dinner meals`);

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
- Meals needed: ${mealTypesNeeded.join(', ')}
- Cuisine preferences: ${preferences.cuisine_preferences?.join(', ') || 'Any'}
- Meal styles: ${preferences.meal_style_preferences?.join(', ') || 'Any'}
- Allergies/restrictions: ${preferences.allergies?.join(', ') || 'None'}
- Family favorites: ${preferences.staple_meals?.join(', ') || 'None'}
${weeklyContextSection}

${preferences.plans_leftovers
  ? `Plan meals to create intentional leftovers where practical. Mark leftover-friendly meals with a "leftovers" tag.`
  : ''}

MEAL TYPE REQUIREMENTS AND MEAL PREP STRATEGY:
${preferences.breakfast_enabled ? `- BREAKFAST: Create ${breakfastMeals} unique recipes, then assign them to all 7 days (repeating as needed for meal prep)
  * Example: If ${breakfastMeals} recipes, assign each to 1-2 days throughout the week
  * Focus on batch-friendly recipes: overnight oats, egg muffins, breakfast burritos, baked oatmeal
  * Each recipe should include "Makes X servings" in description to indicate batch size
  * Add "meal-prep" tag to batch-friendly recipes
\n` : ''}${preferences.lunch_enabled ? `- LUNCH: Create ${lunchMeals} unique recipes, then assign them to all 7 days (repeating as needed for meal prep)
  * Example: If ${lunchMeals} recipes, assign each to 1-2 days throughout the week
  * Focus on meal prep: mason jar salads, grain bowls, soups, pasta salads, wraps
  * Each recipe should include batch cooking quantities
  * Add "meal-prep" tag to batch-friendly recipes
\n` : ''}- DINNER: Generate EXACTLY ${cookingDays} unique meals (spread across the week sensibly)

${preferences.breakfast_enabled ? `BREAKFAST MEAL PREP GUIDELINES:
- Design recipes for batch cooking on prep day (usually Sunday)
- Include storage instructions: "Store in refrigerator for up to 5 days" or "Freeze for up to 2 weeks"
- Include reheating instructions where needed
- Scale ingredients to make enough for multiple servings
- Examples: Overnight oats (make 5 jars), egg muffins (batch of 12), breakfast burritos (wrap and freeze 6-8)
\n` : ''}
${preferences.lunch_enabled ? `LUNCH MEAL PREP GUIDELINES:
- Design recipes that hold up well for 3-5 days
- Include assembly/storage instructions
- Consider: grain bowls, salads (dressing separate), soups, wraps, leftovers from dinner
- Make lunch-box friendly if kids in household
\n` : ''}

DINNER GUIDELINES:
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
      "mealType": "breakfast",
      "name": "Overnight Oats Meal Prep",
      "description": "Make-ahead overnight oats for the week (makes 5 servings)",
      "prepTime": "15 min",
      "cookTime": "0 min",
      "servings": ${preferences.num_adults + preferences.num_children},
      "ingredients": [
        {"name": "rolled oats", "amount": "2.5", "unit": "cups", "category": "pantry"},
        {"name": "milk", "amount": "2.5", "unit": "cups", "category": "dairy"}
      ],
      "instructions": ["Combine oats and milk in jars", "Add toppings", "Refrigerate overnight", "Storage: Keep refrigerated for up to 5 days"],
      "tags": ["meal-prep", "make-ahead", "quick"]
    }
  ]
}

Categories for ingredients: produce, meat, seafood, dairy, pantry, spices, frozen, bakery, other

CRITICAL - MEAL ASSIGNMENT RULES:
${preferences.breakfast_enabled ? `- BREAKFAST: Create ${breakfastMeals} unique recipes, assign them across ALL 7 days
  * Distribute evenly: if 3 recipes, might be Mon/Tue (recipe 1), Wed/Thu (recipe 2), Fri/Sat/Sun (recipe 3)
  * Each recipe name should indicate it's for multiple days if meal-prep
\n` : ''}${preferences.lunch_enabled ? `- LUNCH: Create ${lunchMeals} unique recipes, assign them across ALL 7 days
  * Distribute evenly: if 3 recipes, might be Mon/Tue (recipe 1), Wed/Thu (recipe 2), Fri/Sat/Sun (recipe 3)
  * Each recipe name should indicate it's for multiple days if meal-prep
\n` : ''}- DINNER: Create ${cookingDays} unique recipes, assign to specific days of week (leave other days without dinner)
- You MUST assign meals to specific days - don't just list recipes without day assignments`;

  // Use Sonnet for larger meal plans (breakfast + lunch + dinner), Haiku for simple dinner-only
  const needsLargeOutput = preferences.breakfast_enabled || preferences.lunch_enabled;
  const model = needsLargeOutput ? 'claude-sonnet-4-20250514' : 'claude-3-haiku-20240307';
  const maxTokens = needsLargeOutput ? 8192 : 4096;

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
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
