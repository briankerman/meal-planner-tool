import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const cuisine = searchParams.get('cuisine');
    const tags = searchParams.get('tags');
    const limit = searchParams.get('limit') || '10';

    let query = supabase
      .from('recipe_cache')
      .select('*')
      .order('times_generated', { ascending: false })
      .limit(parseInt(limit));

    if (cuisine) {
      query = query.eq('cuisine', cuisine);
    }

    if (tags) {
      const tagArray = tags.split(',');
      query = query.contains('tags', tagArray);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ recipes: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, description, ingredients, instructions, prep_time_minutes, cook_time_minutes, tags, cuisine } = body;

    // Check if recipe already exists
    const { data: existing } = await supabase
      .from('recipe_cache')
      .select('id, times_generated')
      .eq('name', name)
      .single();

    if (existing) {
      // Update existing recipe
      const { data, error } = await supabase
        .from('recipe_cache')
        .update({
          times_generated: existing.times_generated + 1,
          last_used_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ recipe: data, cached: true });
    }

    // Insert new recipe
    const { data, error } = await supabase
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
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ recipe: data, cached: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
