'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  generateGroceryList,
  generateGroceryListByMeal,
  formatGroceryListForPrint,
  getGroceryListItemCount,
  loadCheckedState,
  saveCheckedState,
  type GroceryList,
  type GroceryByMeal,
  type GroupingMode,
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
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [groceryListByMeal, setGroceryListByMeal] = useState<GroceryByMeal | null>(null);
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('category');
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [weeklyContext, setWeeklyContext] = useState('');
  const [mealsThisWeek, setMealsThisWeek] = useState<number>(5);
  const [currentWeekExpired, setCurrentWeekExpired] = useState(false);
  const [currentMealPlanId, setCurrentMealPlanId] = useState<string | null>(null);

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Load profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          router.push('/onboarding');
          return;
        }

        if (!profileData.onboarding_completed) {
          router.push('/onboarding');
          return;
        }

        setProfile(profileData);
        setMealsThisWeek(profileData.dinner_days_per_week || 5);

        // Load current week's meal plan from Supabase
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];

        const { data: mealPlans } = await supabase
          .from('meal_plans')
          .select('*, meals(*)')
          .eq('user_id', user.id)
          .eq('week_start_date', weekStartStr)
          .order('created_at', { ascending: false })
          .limit(1);

        if (mealPlans && mealPlans.length > 0) {
          const currentPlan = mealPlans[0];
          setMealPlan({ meals: currentPlan.meals });
          setLockedDays(currentPlan.nights_out || {});
          setCurrentMealPlanId(currentPlan.id);

          // Check if the week has expired (past Saturday 11:59pm)
          const weekEndDate = new Date(currentPlan.week_end_date);
          weekEndDate.setHours(23, 59, 59, 999); // Set to Saturday 11:59:59pm
          const now = new Date();
          const isExpired = now > weekEndDate;
          setCurrentWeekExpired(isExpired);

          // Lock the meal plan in database if expired and not already locked
          if (isExpired && !currentPlan.is_locked) {
            await supabase
              .from('meal_plans')
              .update({ is_locked: true })
              .eq('id', currentPlan.id);
          }
        } else {
          // Fallback to localStorage for locked days
          const storedLockedDays = localStorage.getItem('weekly_locked_days');
          if (storedLockedDays) {
            setLockedDays(JSON.parse(storedLockedDays));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  useEffect(() => {
    if (mealPlan?.meals) {
      const list = generateGroceryList(mealPlan.meals);
      const listWithChecked = loadCheckedState(list);
      setGroceryList(listWithChecked);

      const listByMeal = generateGroceryListByMeal(mealPlan.meals);
      setGroceryListByMeal(listByMeal);
    }
  }, [mealPlan]);

  async function generateNewMealPlan() {
    setGenerating(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Generate meal plan via API
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          dinner_days_per_week: mealsThisWeek,
          weekly_context: weeklyContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const plan = await response.json();

      // Calculate week dates
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Save to Supabase
      const { data: mealPlanData, error: mealPlanError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          week_start_date: weekStart.toISOString().split('T')[0],
          week_end_date: weekEnd.toISOString().split('T')[0],
          nights_out: Object.keys(lockedDays),
        })
        .select()
        .single();

      if (mealPlanError) throw mealPlanError;

      // Save meals to Supabase
      if (plan.meals && mealPlanData) {
        const mealsToInsert = plan.meals.map((meal: any, index: number) => {
          const dayDate = new Date(weekStart);
          const dayIndex = DAYS_OF_WEEK.indexOf(meal.day);
          dayDate.setDate(weekStart.getDate() + (dayIndex >= 0 ? dayIndex : index));

          return {
            user_id: user.id,
            meal_plan_id: mealPlanData.id,
            name: meal.name,
            description: meal.description,
            meal_type: meal.mealType || 'dinner',
            day_of_week: meal.day,
            date: dayDate.toISOString().split('T')[0],
            ingredients: meal.ingredients,
            instructions: meal.instructions,
            prep_time_minutes: parseInt(meal.prepTime) || null,
            cook_time_minutes: parseInt(meal.cookTime) || null,
            tags: meal.tags,
            cuisine: null,
          };
        });

        const { error: mealsError } = await supabase
          .from('meals')
          .insert(mealsToInsert);

        if (mealsError) throw mealsError;
      }

      setMealPlan(plan);
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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

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

      // Find the existing meal in the database to update
      const existingMeal = mealPlan.meals.find((m: Meal) => m.day === day);
      if (existingMeal && existingMeal.id) {
        // Update the meal in Supabase
        const { error: updateError } = await supabase
          .from('meals')
          .update({
            name: newMeal.name,
            description: newMeal.description,
            ingredients: newMeal.ingredients,
            instructions: newMeal.instructions,
            prep_time_minutes: parseInt(newMeal.prepTime) || null,
            cook_time_minutes: parseInt(newMeal.cookTime) || null,
            tags: newMeal.tags,
          })
          .eq('id', existingMeal.id);

        if (updateError) {
          console.error('Error updating meal in database:', updateError);
          throw updateError;
        }
      }

      const updatedPlan = {
        ...mealPlan,
        meals: mealPlan.meals.map((m: Meal) => (m.day === day ? { ...m, ...newMeal } : m)),
      };

      setMealPlan(updatedPlan);
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

  async function saveRecipeToCookbook(meal: Meal) {
    setSavingRecipe(true);
    try {
      const response = await fetch('/api/saved-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal }),
      });

      if (response.status === 409) {
        alert('This recipe is already in your cookbook!');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save recipe');
      }

      alert('Recipe saved to your cookbook!');
      setSelectedMeal(null);
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe. Please try again.');
    } finally {
      setSavingRecipe(false);
    }
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

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const categoriesHtml = Object.entries(groceryList)
      .map(([category, items]) => `
        <div class="category">
          <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
          <ul>
            ${items.map(item => `
              <li>
                <span class="checkbox"></span>
                <span class="amount">${item.totalAmount} ${item.unit}</span>
                <span class="name">${item.name}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Grocery List - Simpler Sundays</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                color: #1f2937;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
              }
              .header h1 {
                font-size: 28px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 8px;
              }
              .header .date {
                font-size: 14px;
                color: #6b7280;
              }
              .header .count {
                display: inline-block;
                margin-top: 12px;
                padding: 6px 16px;
                background: #eff6ff;
                color: #1d4ed8;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
              }
              .categories {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 24px;
              }
              .category {
                break-inside: avoid;
              }
              .category h3 {
                font-size: 14px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #374151;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e5e7eb;
              }
              .category ul {
                list-style: none;
              }
              .category li {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 0;
                font-size: 14px;
                border-bottom: 1px dotted #e5e7eb;
              }
              .category li:last-child {
                border-bottom: none;
              }
              .checkbox {
                width: 16px;
                height: 16px;
                border: 2px solid #d1d5db;
                border-radius: 3px;
                flex-shrink: 0;
              }
              .amount {
                font-weight: 600;
                color: #374151;
                min-width: 60px;
              }
              .name {
                color: #4b5563;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
              }
              @media print {
                body { padding: 20px; }
                .categories { gap: 16px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Grocery List</h1>
              <div class="date">${dateStr}</div>
              <div class="count">${getGroceryListItemCount(groceryList)} items</div>
            </div>
            <div class="categories">
              ${categoriesHtml}
            </div>
            <div class="footer">
              Generated by Simpler Sundays
            </div>
          </body>
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
            <img
              src="/images/simplersundayswordmark.png"
              alt="Simpler Sundays"
              className="h-12 w-auto"
            />
            <div className="flex items-center gap-4">
              <a href="/history" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                History
              </a>
              <a href="/cookbook" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                My Cookbook
              </a>
              <button onClick={handleSignOut} className="text-sm text-gray-600 hover:text-gray-900">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Welcome back!</h2>
          <p className="text-gray-600 mt-1">What&apos;s going on this week?</p>
          <textarea
            value={weeklyContext}
            onChange={(e) => setWeeklyContext(e.target.value)}
            placeholder="Pizza on Friday, pasta night on Tuesday, going out Saturday, need something quick on Wednesday..."
            className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 placeholder-gray-400"
            rows={3}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            How many meals do you plan to cook this week?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={1}
              max={7}
              value={mealsThisWeek}
              onChange={(e) => setMealsThisWeek(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 px-3 py-2 text-lg font-semibold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-600">dinners</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">This Week&apos;s Plan</h3>
            {mealPlan && !currentWeekExpired && (
              <button
                onClick={generateNewMealPlan}
                disabled={generating}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}
          </div>

          {currentWeekExpired && mealPlan && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 mb-1">This week&apos;s plan has expired</h4>
                  <p className="text-sm text-amber-800 mb-3">
                    Your meal plan is now in your history. Ready to plan for next week?
                  </p>
                  <button
                    onClick={generateNewMealPlan}
                    disabled={generating}
                    className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium disabled:opacity-50 text-sm"
                  >
                    {generating ? 'Generating...' : 'Generate Next Week\'s Plan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!mealPlan ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">You don&apos;t have a meal plan for this week yet.</p>
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                onClick={generateNewMealPlan}
                disabled={generating}
              >
                {generating ? 'Generating...' : "Generate This Week's Plan"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS_OF_WEEK.map(day => {
                const dayMeals = mealPlan.meals?.filter((m: Meal) => m.day === day) || [];
                if (dayMeals.length === 0) return null;

                return (
                  <div key={day} className="border-b border-gray-200 pb-4 last:border-0">
                    <h4 className="text-md font-semibold text-gray-700 mb-3">{day}</h4>
                    <div className="space-y-3">
                      {dayMeals.map((meal: Meal, idx: number) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div
                              onClick={() => setSelectedMeal(meal)}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-blue-600 uppercase">
                                  {meal.mealType || 'dinner'}
                                </span>
                              </div>
                              <h5 className="text-lg font-semibold text-gray-900">{meal.name}</h5>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm text-gray-600">
                                {meal.prepTime} prep + {meal.cookTime} cook
                              </div>
                              {!currentWeekExpired && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    regenerateMeal(meal.day);
                                  }}
                                  disabled={regeneratingDay === meal.day}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 whitespace-nowrap"
                                >
                                  {regeneratingDay === meal.day ? 'Regenerating...' : 'Regenerate'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div
                            onClick={() => setSelectedMeal(meal)}
                            className="cursor-pointer"
                          >
                            <p className="text-gray-600 text-sm mb-3">{meal.description}</p>
                            <div className="flex gap-2 flex-wrap">
                              {meal.tags?.map((tag: string) => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
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

        {mealPlan && groceryList && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Grocery List</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {getGroceryListItemCount(groceryList)} items
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGroceryList(!showGroceryList)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {showGroceryList ? 'Hide List' : 'Show List'}
                </button>
                {showGroceryList && (
                  <button
                    onClick={printGroceryList}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                )}
              </div>
            </div>

            {showGroceryList && (
              <div>
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setGroupingMode('category')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      groupingMode === 'category'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    By Category
                  </button>
                  <button
                    onClick={() => setGroupingMode('meal')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      groupingMode === 'meal'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    By Meal
                  </button>
                </div>

                {groupingMode === 'category' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(groceryList).map(([category, items]) => (
                      <div key={category} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {category}
                        </h4>
                        <div className="space-y-2">
                          {items.map((item, idx) => (
                            <label key={idx} className="flex items-center gap-3 py-2 px-3 cursor-pointer hover:bg-white rounded-md transition-colors">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => toggleGroceryItem(category, item.name)}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                <span className="font-medium">{item.totalAmount} {item.unit}</span> {item.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groceryListByMeal && Object.entries(groceryListByMeal).map(([mealKey, meal]) => (
                      <div key={mealKey} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded uppercase">
                            {meal.day}
                          </span>
                          <h4 className="text-sm font-semibold text-gray-800">{mealKey.split('_').slice(1).join(' ')}</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {meal.items.map((item, idx) => (
                            <div key={idx} className="text-sm text-gray-700 bg-white px-3 py-2 rounded">
                              <span className="font-medium">{item.totalAmount} {item.unit}</span> {item.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    {(selectedMeal.ingredients as any[])?.map((ing: any, idx: number) => (
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
              <div className="flex gap-3">
                <button
                  onClick={() => saveRecipeToCookbook(selectedMeal)}
                  disabled={savingRecipe}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {savingRecipe ? 'Saving...' : 'Save to Cookbook'}
                </button>
                {!currentWeekExpired && (
                  <button
                    onClick={() => regenerateMeal(selectedMeal.day)}
                    disabled={regeneratingDay === selectedMeal.day}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                  >
                    {regeneratingDay === selectedMeal.day ? 'Regenerating...' : 'Regenerate This Meal'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
