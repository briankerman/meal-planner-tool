import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ recipes: data });
  } catch (error: any) {
    console.error('Error fetching saved recipes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch saved recipes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { meal } = body;

    if (!meal) {
      return NextResponse.json({ error: 'Meal data required' }, { status: 400 });
    }

    // Check if recipe already exists for this user
    const { data: existing } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', meal.name)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Recipe already saved' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: user.id,
        name: meal.name,
        description: meal.description,
        meal_type: meal.meal_type || meal.mealType || 'dinner',
        source: 'meal_plan',
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        prep_time_minutes: meal.prep_time_minutes || parseInt(meal.prepTime) || null,
        cook_time_minutes: meal.cook_time_minutes || parseInt(meal.cookTime) || null,
        tags: meal.tags || [],
        cuisine: meal.cuisine || null,
        times_used: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ recipe: data });
  } catch (error: any) {
    console.error('Error saving recipe:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save recipe' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('id');

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}
