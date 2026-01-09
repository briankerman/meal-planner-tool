import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('week_start');

    let query = supabase
      .from('meal_plans')
      .select('*, meals(*)')
      .eq('user_id', user.id)
      .order('week_start_date', { ascending: false });

    if (weekStart) {
      query = query.eq('week_start_date', weekStart);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ meal_plans: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { week_start_date, week_end_date, nights_out, special_plans, weekly_preferences, meals } = body;

    // Create meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        week_start_date,
        week_end_date,
        nights_out,
        special_plans,
        weekly_preferences,
      })
      .select()
      .single();

    if (mealPlanError) {
      return NextResponse.json({ error: mealPlanError.message }, { status: 500 });
    }

    // Create meals if provided
    if (meals && meals.length > 0) {
      const mealsToInsert = meals.map((meal: any) => ({
        ...meal,
        user_id: user.id,
        meal_plan_id: mealPlan.id,
      }));

      const { error: mealsError } = await supabase
        .from('meals')
        .insert(mealsToInsert);

      if (mealsError) {
        return NextResponse.json({ error: mealsError.message }, { status: 500 });
      }
    }

    // Fetch the complete meal plan with meals
    const { data: completePlan, error: fetchError } = await supabase
      .from('meal_plans')
      .select('*, meals(*)')
      .eq('id', mealPlan.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ meal_plan: completePlan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
