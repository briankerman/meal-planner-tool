import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateMealPlan(preferences: {
  dietaryRestrictions?: string[];
  cuisine?: string[];
  mealsPerDay?: number;
  days?: number;
}) {
  const prompt = `Generate a meal plan with the following preferences:
- Dietary restrictions: ${preferences.dietaryRestrictions?.join(', ') || 'None'}
- Cuisine preferences: ${preferences.cuisine?.join(', ') || 'Any'}
- Meals per day: ${preferences.mealsPerDay || 3}
- Number of days: ${preferences.days || 7}

Please provide a detailed meal plan in JSON format with recipes, ingredients, and cooking instructions.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful meal planning assistant. Provide detailed, practical meal plans in valid JSON format.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}
