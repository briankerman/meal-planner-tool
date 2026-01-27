import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: 'Pin data required' }, { status: 400 });
    }

    // Get the best image URL
    const imageUrl = pin.media?.images?.['600x']?.url ||
      pin.media?.images?.['400x300']?.url ||
      pin.media?.images?.['1200x']?.url ||
      null;

    // If pin has a link, try to extract recipe details using AI
    let recipeData = {
      name: pin.title || 'Untitled Recipe',
      description: pin.description || null,
      ingredients: [] as any[],
      instructions: [] as string[],
      prep_time_minutes: null as number | null,
      cook_time_minutes: null as number | null,
      tags: ['pinterest'] as string[],
      image_url: imageUrl,
    };

    if (pin.link) {
      try {
        // Fetch the recipe page content
        const pageResponse = await fetch(pin.link, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SimplerSundays/1.0)',
          },
        });

        if (pageResponse.ok) {
          const html = await pageResponse.text();

          // Use AI to extract recipe data from the page
          const extraction = await extractRecipeWithAI(html, pin.title, pin.description);
          if (extraction) {
            recipeData = {
              ...recipeData,
              ...extraction,
              tags: [...(extraction.tags || []), 'pinterest'],
            };
          }
        }
      } catch (fetchError) {
        console.error('Error fetching recipe page:', fetchError);
        // Continue with basic pin data
      }
    }

    // Check if recipe already exists
    const { data: existing } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', recipeData.name)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Recipe already saved' }, { status: 409 });
    }

    // Save the recipe
    const { data: recipe, error: saveError } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: user.id,
        name: recipeData.name,
        description: recipeData.description,
        meal_type: 'dinner',
        source: 'pinterest',
        source_url: pin.link || null,
        pinterest_pin_id: pin.id,
        image_url: recipeData.image_url,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prep_time_minutes: recipeData.prep_time_minutes,
        cook_time_minutes: recipeData.cook_time_minutes,
        tags: recipeData.tags,
        times_used: 0,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({ recipe });
  } catch (error: any) {
    console.error('Error importing Pinterest recipe:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import recipe' },
      { status: 500 }
    );
  }
}

async function extractRecipeWithAI(
  html: string,
  pinTitle: string | null,
  pinDescription: string | null
): Promise<{
  name: string;
  description: string | null;
  ingredients: any[];
  instructions: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[];
} | null> {
  try {
    // Truncate HTML to avoid token limits
    const truncatedHtml = html.slice(0, 30000);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Extract recipe information from this webpage HTML. The pin title is "${pinTitle || 'Unknown'}" and description is "${pinDescription || 'None'}".

Return a JSON object with:
- name: recipe name (string)
- description: brief description (string or null)
- ingredients: array of objects with {name, amount, unit}
- instructions: array of step strings
- prep_time_minutes: number or null
- cook_time_minutes: number or null
- tags: array of relevant tags like cuisine type, dietary info, etc.

If you can't find recipe information, return null.

HTML content:
${truncatedHtml}

Respond with only valid JSON, no markdown or explanation.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;

    // Parse the JSON response
    const result = JSON.parse(content.text);
    return result;
  } catch (error) {
    console.error('AI extraction error:', error);
    return null;
  }
}
