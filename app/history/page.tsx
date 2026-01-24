'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/dashboard';

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
  user_notes: string | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    async function loadHistory() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: plansData, error: plansError } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('week_start_date', { ascending: false });

        if (plansError) throw plansError;

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

  async function saveNoteToMeal(mealId: string, notes: string) {
    setSavingNote(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('meals')
        .update({ user_notes: notes })
        .eq('id', mealId);

      if (error) throw error;

      setMealPlans(prev => prev.map(plan => ({
        ...plan,
        meals: plan.meals.map(meal =>
          meal.id === mealId ? { ...meal, user_notes: notes } : meal
        )
      })));

      if (selectedMeal?.id === mealId) {
        setSelectedMeal({ ...selectedMeal, user_notes: notes });
      }

      setEditingNotes(null);
      setNoteText('');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  }

  function handleSignOut() {
    localStorage.removeItem('meal_planner_preferences');
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onSignOut={handleSignOut} />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Meal Plan History</h1>

          {mealPlans.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">No meal plans yet.</p>
              <p className="text-gray-500 text-sm">
                Generate your first meal plan to see it here.
              </p>
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
                          <span className="ml-2 text-xs font-normal text-simpler-green-600 bg-simpler-green-50 px-2 py-1 rounded">
                            Current Week
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(plan.week_start_date)} - {formatDate(plan.week_end_date)} • {plan.meals.length} meals
                      </p>
                    </div>
                    <button className="text-simpler-green-600 hover:text-simpler-green-700 font-medium">
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
                                  className="border border-gray-200 rounded-lg p-4"
                                >
                                  <div
                                    className="cursor-pointer"
                                    onClick={() => setSelectedMeal(meal)}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-simpler-green-600 uppercase">
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

                                  <div className="mt-4 pt-3 border-t border-gray-200">
                                    {editingNotes === meal.id ? (
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Your Notes
                                        </label>
                                        <textarea
                                          value={noteText}
                                          onChange={(e) => setNoteText(e.target.value)}
                                          placeholder="How did this meal turn out? Did your family enjoy it?"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-simpler-green-400 focus:border-transparent resize-none"
                                          rows={3}
                                        />
                                        <div className="flex gap-2 mt-2">
                                          <button
                                            onClick={() => saveNoteToMeal(meal.id, noteText)}
                                            disabled={savingNote}
                                            className="px-3 py-1.5 bg-simpler-green-400 text-white text-sm rounded-md hover:bg-simpler-green-500 font-medium disabled:opacity-50"
                                          >
                                            {savingNote ? 'Saving...' : 'Save Note'}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingNotes(null);
                                              setNoteText('');
                                            }}
                                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 font-medium"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div onClick={(e) => e.stopPropagation()}>
                                        {meal.user_notes ? (
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Your Notes</div>
                                              <p className="text-sm text-gray-700 italic">&ldquo;{meal.user_notes}&rdquo;</p>
                                            </div>
                                            <button
                                              onClick={() => {
                                                setEditingNotes(meal.id);
                                                setNoteText(meal.user_notes || '');
                                              }}
                                              className="text-xs text-simpler-green-600 hover:text-simpler-green-700 font-medium whitespace-nowrap"
                                            >
                                              Edit Note
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setEditingNotes(meal.id);
                                              setNoteText('');
                                            }}
                                            className="text-sm text-simpler-green-600 hover:text-simpler-green-700 font-medium flex items-center gap-1"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Note
                                          </button>
                                        )}
                                      </div>
                                    )}
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
        </div>

        {selectedMeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedMeal(null)}>
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold text-simpler-green-600 uppercase">{selectedMeal.meal_type}</span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{selectedMeal.name}</h3>
                  <p className="text-gray-600 mt-2">{selectedMeal.description}</p>
                </div>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                <ol className="space-y-2">
                  {selectedMeal.instructions.map((step: string, idx: number) => (
                    <li key={idx} className="flex gap-3">
                      <span className="font-semibold text-simpler-green-600 min-w-[24px]">{idx + 1}.</span>
                      <span className="text-gray-700">{step}</span>
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

              {selectedMeal.user_notes && (
                <div className="mt-6 p-4 bg-simpler-green-50 border border-simpler-green-200 rounded-lg">
                  <div className="text-xs font-semibold text-simpler-green-700 uppercase mb-1">Your Notes</div>
                  <p className="text-sm text-simpler-green-900 italic">&ldquo;{selectedMeal.user_notes}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
