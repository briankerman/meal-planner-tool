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

    // Start with basic pin data
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

    let extractionSucceeded = false;

    // Try to fetch and extract from the linked page
    if (pin.link) {
      try {
        const pageResponse = await fetch(pin.link, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
          },
          redirect: 'follow',
        });

        if (pageResponse.ok) {
          const html = await pageResponse.text();

          // First try to find JSON-LD structured data (most recipe sites have this)
          const jsonLdRecipe = extractJsonLdRecipe(html);
          if (jsonLdRecipe) {
            recipeData = {
              ...recipeData,
              ...jsonLdRecipe,
              tags: [...(jsonLdRecipe.tags || []), 'pinterest'],
            };
            extractionSucceeded = true;
          } else {
            // Fall back to AI extraction from HTML
            const extraction = await extractRecipeWithAI(html, pin.title, pin.description);
            if (extraction && extraction.ingredients && extraction.ingredients.length > 0) {
              recipeData = {
                ...recipeData,
                ...extraction,
                tags: [...(extraction.tags || []), 'pinterest'],
              };
              extractionSucceeded = true;
            }
          }
        }
      } catch (fetchError) {
        console.error('Error fetching recipe page:', fetchError);
      }
    }

    // If page extraction failed, try to generate recipe from pin description using AI
    if (!extractionSucceeded && pin.description) {
      try {
        const generatedRecipe = await generateRecipeFromDescription(
          pin.title || 'Recipe',
          pin.description
        );
        if (generatedRecipe && generatedRecipe.ingredients && generatedRecipe.ingredients.length > 0) {
          recipeData = {
            ...recipeData,
            ...generatedRecipe,
            tags: [...(generatedRecipe.tags || []), 'pinterest', 'ai-generated'],
          };
        }
      } catch (genError) {
        console.error('Error generating recipe:', genError);
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

// Extract recipe from JSON-LD structured data (Schema.org Recipe format)
function extractJsonLdRecipe(html: string): {
  name: string;
  description: string | null;
  ingredients: any[];
  instructions: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[];
} | null {
  try {
    // Find all JSON-LD scripts
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (!jsonLdMatches) return null;

    for (const match of jsonLdMatches) {
      const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
      try {
        const data = JSON.parse(jsonContent);

        // Handle @graph format
        const recipes = data['@graph']
          ? data['@graph'].filter((item: any) => item['@type'] === 'Recipe')
          : [data];

        const recipe = recipes.find((r: any) => r['@type'] === 'Recipe');
        if (!recipe) continue;

        // Parse ingredients
        const ingredients = (recipe.recipeIngredient || []).map((ing: string) => {
          const parsed = parseIngredient(ing);
          return parsed;
        });

        // Parse instructions
        let instructions: string[] = [];
        if (recipe.recipeInstructions) {
          if (Array.isArray(recipe.recipeInstructions)) {
            instructions = recipe.recipeInstructions.map((inst: any) => {
              if (typeof inst === 'string') return inst;
              if (inst.text) return inst.text;
              if (inst.itemListElement) {
                return inst.itemListElement.map((i: any) => i.text || i).join(' ');
              }
              return '';
            }).filter(Boolean);
          } else if (typeof recipe.recipeInstructions === 'string') {
            instructions = recipe.recipeInstructions.split(/\n+/).filter(Boolean);
          }
        }

        // Parse times (ISO 8601 duration format: PT30M, PT1H30M)
        const prepTime = parseDuration(recipe.prepTime);
        const cookTime = parseDuration(recipe.cookTime);

        // Get tags from keywords or category
        const tags: string[] = [];
        if (recipe.keywords) {
          const keywords = typeof recipe.keywords === 'string'
            ? recipe.keywords.split(',').map((k: string) => k.trim())
            : recipe.keywords;
          tags.push(...keywords.slice(0, 5));
        }
        if (recipe.recipeCategory) {
          tags.push(recipe.recipeCategory);
        }
        if (recipe.recipeCuisine) {
          tags.push(recipe.recipeCuisine);
        }

        return {
          name: recipe.name || 'Recipe',
          description: recipe.description || null,
          ingredients,
          instructions,
          prep_time_minutes: prepTime,
          cook_time_minutes: cookTime,
          tags: [...new Set(tags)].slice(0, 8),
        };
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Parse ingredient string into structured format
function parseIngredient(ingredientStr: string): { name: string; amount: string; unit: string } {
  const str = ingredientStr.trim();

  // Common patterns: "2 cups flour", "1/2 tsp salt", "3 large eggs"
  const match = str.match(/^([\d\/\.\s]+)?\s*(cups?|tbsp?|tsp?|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|liters?|pieces?|cloves?|cans?|packages?|large|medium|small)?\s*(.+)$/i);

  if (match) {
    return {
      amount: (match[1] || '').trim(),
      unit: (match[2] || '').trim(),
      name: (match[3] || str).trim(),
    };
  }

  return { amount: '', unit: '', name: str };
}

// Parse ISO 8601 duration to minutes
function parseDuration(duration: string | undefined): number | null {
  if (!duration) return null;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);

  return hours * 60 + minutes || null;
}

// AI extraction from HTML
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
    // Strip scripts, styles, and reduce HTML
    let cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate to reasonable size
    cleanHtml = cleanHtml.slice(0, 15000);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Extract recipe information from this webpage text. The pin title is "${pinTitle || 'Unknown'}" and description is "${pinDescription || 'None'}".

Return a JSON object with:
- name: recipe name (string)
- description: brief 1-2 sentence description (string or null)
- ingredients: array of objects with {name, amount, unit}
- instructions: array of step strings
- prep_time_minutes: number or null
- cook_time_minutes: number or null
- tags: array of relevant tags (cuisine type, dietary info, etc.)

If you cannot find recipe information, return null.

Page text:
${cleanHtml}

Respond with only valid JSON, no markdown.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;

    const text = content.text.trim();
    if (text === 'null' || text === '') return null;

    return JSON.parse(text);
  } catch (error) {
    console.error('AI extraction error:', error);
    return null;
  }
}

// Generate recipe from pin description when page extraction fails
async function generateRecipeFromDescription(
  title: string,
  description: string
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
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Based on this Pinterest pin title and description, generate a complete recipe.

Title: ${title}
Description: ${description}

Return a JSON object with:
- name: recipe name (string)
- description: brief 1-2 sentence description (string)
- ingredients: array of objects with {name, amount, unit} - include all typical ingredients for this dish
- instructions: array of step strings - clear cooking instructions
- prep_time_minutes: estimated prep time (number)
- cook_time_minutes: estimated cook time (number)
- tags: array of relevant tags (cuisine type, dietary info, etc.)

Generate a realistic, cookable recipe based on the dish described.

Respond with only valid JSON, no markdown.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;

    return JSON.parse(content.text.trim());
  } catch (error) {
    console.error('Recipe generation error:', error);
    return null;
  }
}
