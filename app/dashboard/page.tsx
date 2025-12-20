'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  generateGroceryList,
  formatGroceryListForPrint,
  getGroceryListItemCount,
  loadCheckedState,
  saveCheckedState,
  type GroceryList,
  type Meal,
} from '@/lib/utils/groceryList';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [lockedDays, setLockedDays] = useState<Record<string, string>>({});
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [showGroceryList, setShowGroceryList] = useState(false);

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const LOCK_OPTIONS = [
    { value: '', label: 'Cook' },
    { value: 'date_night', label: 'Date Night' },
    { value: 'takeout', label: 'Takeout' },
    { value: 'leftovers', label: 'Leftovers' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    const stored = localStorage.getItem('meal_planner_preferences');
    if (stored) {
      const prefs = JSON.parse(stored);
      setProfile(prefs);
      if (!prefs.onboarding_completed) {
        router.push('/onboarding');
      }
    } else {
      router.push('/onboarding');
    }

    const storedPlan = localStorage.getItem('current_meal_plan');
    if (storedPlan) {
      setMealPlan(JSON.parse(storedPlan));
    }

    const storedLockedDays = localStorage.getItem('weekly_locked_days');
    if (storedLockedDays) {
      setLockedDays(JSON.parse(storedLockedDays));
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (mealPlan?.meals) {
      const list = generateGroceryList(mealPlan.meals);
      const listWithChecked = loadCheckedState(list);
      setGroceryList(listWithChecked);
    }
  }, [mealPlan]);

  async function generateNewMealPlan() {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, locked_days: lockedDays }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const plan = await response.json();
      setMealPlan(plan);
      localStorage.setItem('current_meal_plan', JSON.stringify(plan));
      setShowGroceryList(false);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateMeal(day: string) {
    setRegeneratingDay(day);
    try {
      const response = await fetch('/api/regenerate-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day,
          preferences: profile,
          existingMeals: mealPlan.meals,
          lockedDays,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate meal');
      }

      const newMeal = await response.json();
      const updatedPlan = {
        ...mealPlan,
        meals: mealPlan.meals.map((m: Meal) => (m.day === day ? newMeal : m)),
      };

      setMealPlan(updatedPlan);
      localStorage.setItem('current_meal_plan', JSON.stringify(updatedPlan));
      setSelectedMeal(null);
    } catch (error) {
      console.error('Error regenerating meal:', error);
      alert('Failed to regenerate meal. Please try again.');
    } finally {
      setRegeneratingDay(null);
    }
  }

  function updateLockedDay(day: string, value: string) {
    const updated = { ...lockedDays };
    if (value === '') {
      delete updated[day];
    } else {
      updated[day] = value;
    }
    setLockedDays(updated);
    localStorage.setItem('weekly_locked_days', JSON.stringify(updated));
  }

  function toggleGroceryItem(category: string, itemName: string) {
    if (!groceryList) return;

    const updated = { ...groceryList };
    updated[category] = updated[category].map((item) =>
      item.name === itemName ? { ...item, checked: !item.checked } : item
    );

    setGroceryList(updated);
    saveCheckedState(updated);
  }

  function printGroceryList() {
    if (!groceryList) return;

    const printContent = formatGroceryListForPrint(groceryList);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Grocery List</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }
              h2 { margin-top: 20px; color: #333; }
              ul { list-style: none; padding: 0; }
              li { padding: 5px 0; }
              @media print { body { padding: 10px; } }
            </style>
          </head>
          <body><pre>${printContent}</pre></body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  function handleSignOut() {
    localStorage.removeItem('meal_planner_preferences');
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Simpler Sundays</h1>
            <button onClick={handleSignOut} className="text-sm text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Welcome back!</h2>
          <p className="text-gray-600 mt-1">Ready to plan your week?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600">Household Size</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {(profile?.num_adults || 0) + (profile?.num_children || 0)} people
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600">Dinners per Week</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {profile?.dinner_days_per_week || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600">Shopping Day</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {profile?.shopping_day || 'Not set'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure This Week</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">{day.slice(0, 3)}</label>
                <select
                  value={lockedDays[day] || ''}
                  onChange={(e) => updateLockedDay(day, e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {LOCK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Select which days you&apos;ll be cooking vs. going out, having leftovers, etc.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">This Week&apos;s Plan</h3>
            {mealPlan && (
              <button
                onClick={generateNewMealPlan}
                disabled={generating}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}
          </div>

          {!mealPlan ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">You don&apos;t have a meal plan for this week yet.</p>
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                onClick={generateNewMealPlan}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate This Week&apos;s Plan'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mealPlan.meals?.map((meal: Meal, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedMeal(meal)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-500">{meal.day}</div>
                      <h4 className="text-lg font-semibold text-gray-900">{meal.name}</h4>
                    </div>
                    <div className="text-sm text-gray-600">
                      {meal.prepTime} prep + {meal.cookTime} cook
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{meal.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    {meal.tags?.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {mealPlan && groceryList && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Grocery List
                {groceryList && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({getGroceryListItemCount(groceryList)} items)
                  </span>
                )}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowGroceryList(!showGroceryList)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showGroceryList ? 'Hide' : 'Show'}
                </button>
                {showGroceryList && (
                  <button
                    onClick={printGroceryList}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Print/Export
                  </button>
                )}
              </div>
            </div>

            {showGroceryList && (
              <div className="space-y-6">
                {Object.entries(groceryList).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">{category}</h4>
                    <div className="space-y-1">
                      {items.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-3 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleGroceryItem(category, item.name)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {item.totalAmount} {item.unit} {item.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences</h3>
          <div className="space-y-4">
            {profile?.cuisine_preferences && profile.cuisine_preferences.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700">Favorite Cuisines</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.cuisine_preferences.map((cuisine: string) => (
                    <span key={cuisine} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{cuisine}</span>
                  ))}
                </div>
              </div>
            )}
            {profile?.meal_style_preferences && profile.meal_style_preferences.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700">Meal Styles</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.meal_style_preferences.map((style: string) => (
                    <span key={style} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{style}</span>
                  ))}
                </div>
              </div>
            )}
            {profile?.allergies && profile.allergies.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700">Allergies & Restrictions</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.allergies.map((allergy: string) => (
                    <span key={allergy} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">{allergy}</span>
                  ))}
                </div>
              </div>
            )}
            {profile?.staple_meals && profile.staple_meals.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700">Family Favorites</div>
                <ul className="mt-2 space-y-1">
                  {profile.staple_meals.map((meal: string, idx: number) => (
                    <li key={idx} className="text-gray-600">• {meal}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button onClick={() => router.push('/onboarding')} className="mt-6 text-sm text-blue-600 hover:text-blue-700 font-medium">
            Update preferences
          </button>
        </div>
      </main>

      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedMeal(null)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">{selectedMeal.day}</div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedMeal.name}</h2>
              </div>
              <button onClick={() => setSelectedMeal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">{selectedMeal.description}</p>
              <div className="flex gap-6 mb-6 text-sm">
                <div><span className="font-medium">Prep:</span> {selectedMeal.prepTime}</div>
                <div><span className="font-medium">Cook:</span> {selectedMeal.cookTime}</div>
                <div><span className="font-medium">Servings:</span> {selectedMeal.servings}</div>
              </div>
              <div className="flex gap-2 flex-wrap mb-6">
                {selectedMeal.tags?.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">{tag}</span>
                ))}
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                {selectedMeal.ingredients && Array.isArray(selectedMeal.ingredients) ? (
                  <div className="space-y-3">
                    {Object.entries(
                      selectedMeal.ingredients.reduce((acc: any, ing: any) => {
                        const category = ing.category || 'other';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(ing);
                        return acc;
                      }, {})
                    ).map(([category, items]: [string, any]) => (
                      <div key={category}>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{category}</div>
                        <ul className="space-y-1">
                          {items.map((ing: any, idx: number) => (
                            <li key={idx} className="text-gray-700">• {ing.amount} {ing.unit} {ing.name}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {selectedMeal.ingredients?.map((ing: any, idx: number) => (
                      <li key={idx} className="text-gray-700">
                        • {typeof ing === 'string' ? ing : `${ing.amount} ${ing.unit} ${ing.name}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
                <ol className="space-y-2">
                  {selectedMeal.instructions?.map((step: string, idx: number) => (
                    <li key={idx} className="flex gap-3">
                      <span className="font-semibold text-blue-600 min-w-[24px]">{idx + 1}.</span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <button
                onClick={() => regenerateMeal(selectedMeal.day)}
                disabled={regeneratingDay === selectedMeal.day}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {regeneratingDay === selectedMeal.day ? 'Regenerating...' : 'Regenerate This Meal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
