import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface CachedRecipe {
  id: string;
  name: string;
  description: string | null;
  ingredients: any;
  instructions: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[] | null;
  cuisine: string | null;
  times_generated: number;
  last_used_date: string;
  created_at: string;
}

export async function searchRecipeCache(params: {
  cuisine?: string;
  tags?: string[];
  excludeNames?: string[];
  limit?: number;
}): Promise<CachedRecipe[]> {
  const { cuisine, tags, excludeNames, limit = 10 } = params;

  let query = supabase
    .from('recipe_cache')
    .select('*')
    .order('times_generated', { ascending: false })
    .limit(limit);

  if (cuisine) {
    query = query.eq('cuisine', cuisine);
  }

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  if (excludeNames && excludeNames.length > 0) {
    query = query.not('name', 'in', `(${excludeNames.map(n => `"${n}"`).join(',')})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching recipe cache:', error);
    return [];
  }

  return data || [];
}

export async function cacheRecipe(recipe: {
  name: string;
  description?: string;
  ingredients: any;
  instructions: string[];
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  tags?: string[];
  cuisine?: string;
}): Promise<void> {
  const { name, description, ingredients, instructions, prep_time_minutes, cook_time_minutes, tags, cuisine } = recipe;

  // Check if recipe already exists
  const { data: existing } = await supabase
    .from('recipe_cache')
    .select('id, times_generated')
    .eq('name', name)
    .maybeSingle();

  if (existing) {
    // Update existing recipe
    await supabase
      .from('recipe_cache')
      .update({
        times_generated: existing.times_generated + 1,
        last_used_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', existing.id);
  } else {
    // Insert new recipe
    await supabase
      .from('recipe_cache')
      .insert({
        name,
        description,
        ingredients,
        instructions,
        prep_time_minutes,
        cook_time_minutes,
        tags,
        cuisine,
      });
  }
}

export async function getCachedRecipesByPreferences(params: {
  cuisinePreferences?: string[];
  mealStyles?: string[];
  excludeNames?: string[];
  count: number;
}): Promise<CachedRecipe[]> {
  const { cuisinePreferences, mealStyles, excludeNames, count } = params;

  // Try to get recipes matching preferences
  const recipes: CachedRecipe[] = [];

  // First try with cuisine preferences
  if (cuisinePreferences && cuisinePreferences.length > 0) {
    for (const cuisine of cuisinePreferences) {
      if (recipes.length >= count) break;

      const cachedRecipes = await searchRecipeCache({
        cuisine: cuisine.toLowerCase(),
        excludeNames,
        limit: count - recipes.length,
      });

      recipes.push(...cachedRecipes);
    }
  }

  // Then try with meal style tags
  if (recipes.length < count && mealStyles && mealStyles.length > 0) {
    const cachedRecipes = await searchRecipeCache({
      tags: mealStyles.map(s => s.toLowerCase()),
      excludeNames: [...(excludeNames || []), ...recipes.map(r => r.name)],
      limit: count - recipes.length,
    });

    recipes.push(...cachedRecipes);
  }

  return recipes.slice(0, count);
}
