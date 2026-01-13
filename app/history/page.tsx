'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface MealPlan {
  id: string;
  week_start_date: string;
  week_end_date: string;
  created_at: string;
  meals: Meal[];
}

interface Meal {
  id: string;
  name: string;
  description: string;
  meal_type: string;
  day_of_week: string;
  date: string;
  ingredients: any[];
  instructions: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[];
}

export default function HistoryPage() {
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    async function loadHistory() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Load all meal plans for this user, ordered by week start date descending
        const { data: plansData, error: plansError } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('week_start_date', { ascending: false });

        if (plansError) throw plansError;

        // Load meals for each plan
        const plansWithMeals = await Promise.all(
          (plansData || []).map(async (plan) => {
            const { data: mealsData, error: mealsError } = await supabase
              .from('meals')
              .select('*')
              .eq('meal_plan_id', plan.id)
              .order('date', { ascending: true });

            if (mealsError) throw mealsError;

            return {
              ...plan,
              meals: mealsData || [],
            };
          })
        );

        setMealPlans(plansWithMeals);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [router]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function isCurrentWeek(plan: MealPlan) {
    const now = new Date();
    const start = new Date(plan.week_start_date);
    const end = new Date(plan.week_end_date);
    return now >= start && now <= end;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meal Plan History</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Back to Dashboard
          </Link>
        </div>

        {mealPlans.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No meal plans yet.</p>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first meal plan
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mealPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Week of {formatDate(plan.week_start_date)}
                      {isCurrentWeek(plan) && (
                        <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Current Week
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(plan.week_start_date)} - {formatDate(plan.week_end_date)} • {plan.meals.length} meals
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    {selectedPlan?.id === plan.id ? 'Hide' : 'View'}
                  </button>
                </div>

                {selectedPlan?.id === plan.id && (
                  <div className="mt-6 space-y-6">
                    {DAYS_OF_WEEK.map(day => {
                      const dayMeals = plan.meals.filter((m) => m.day_of_week === day);
                      if (dayMeals.length === 0) return null;

                      return (
                        <div key={day} className="border-t border-gray-200 pt-4 first:border-0">
                          <h4 className="text-md font-semibold text-gray-700 mb-3">{day}</h4>
                          <div className="space-y-3">
                            {dayMeals.map((meal) => (
                              <div
                                key={meal.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors cursor-pointer"
                                onClick={() => setSelectedMeal(meal)}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-blue-600 uppercase">
                                    {meal.meal_type}
                                  </span>
                                </div>
                                <h5 className="text-lg font-semibold text-gray-900">{meal.name}</h5>
                                <p className="text-gray-600 text-sm mt-2">{meal.description}</p>
                                <div className="flex gap-2 flex-wrap mt-3">
                                  {meal.tags?.map((tag: string) => (
                                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedMeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedMeal(null)}>
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase">{selectedMeal.meal_type}</span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{selectedMeal.name}</h3>
                  <p className="text-gray-600 mt-2">{selectedMeal.description}</p>
                </div>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-6 text-sm text-gray-600 mb-6">
                <div>
                  <span className="font-medium">Prep:</span> {selectedMeal.prep_time_minutes || 0} min
                </div>
                <div>
                  <span className="font-medium">Cook:</span> {selectedMeal.cook_time_minutes || 0} min
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Ingredients</h4>
                <ul className="space-y-2">
                  {selectedMeal.ingredients.map((ing: any, idx: number) => (
                    <li key={idx} className="text-gray-700">
                      {ing.amount} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Instructions</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {selectedMeal.instructions.map((step: string, idx: number) => (
                    <li key={idx} className="text-gray-700">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {selectedMeal.tags && selectedMeal.tags.length > 0 && (
                <div className="mt-6">
                  <div className="flex gap-2 flex-wrap">
                    {selectedMeal.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
