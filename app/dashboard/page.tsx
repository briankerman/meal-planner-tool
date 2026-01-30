'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CookingLoader from '@/components/CookingLoader';
import {
  Sidebar,
  DashboardHeader,
  WeeklyMealGrid,
  WeekNavigator,
  MealDetailModal,
  GroceryListModal,
  GeneratePlanModal,
  type MealPlanConfig,
} from '@/components/dashboard';
import {
  generateGroceryList,
  generateGroceryListByMeal,
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
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [weeklyContext, setWeeklyContext] = useState('');
  const [mealsThisWeek, setMealsThisWeek] = useState<number>(5);
  const [currentWeekExpired, setCurrentWeekExpired] = useState(false);
  const [currentMealPlanId, setCurrentMealPlanId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedMeals, setEditedMeals] = useState<{ meals: Meal[] } | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [savingEdits, setSavingEdits] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = previous week

  // Calculate week start date based on offset
  const getWeekStartDate = (offset: number): Date => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + offset * 7);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const selectedWeekStart = getWeekStartDate(weekOffset);
  const isCurrentWeek = weekOffset === 0;
  const isFutureWeek = weekOffset > 0;

  // Load meal plan for a specific week
  async function loadMealPlanForWeek(weekStart: Date) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

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
      // Normalize database field names to match API response format
      const normalizedMeals = (currentPlan.meals || []).map((meal: any) => ({
        ...meal,
        day: meal.day_of_week || meal.day,
        mealType: meal.meal_type || meal.mealType || 'dinner',
        prepTime: meal.prep_time_minutes ? `${meal.prep_time_minutes} min` : meal.prepTime,
        cookTime: meal.cook_time_minutes ? `${meal.cook_time_minutes} min` : meal.cookTime,
      }));
      setMealPlan({ meals: normalizedMeals });
      setLockedDays(currentPlan.nights_out || {});
      setCurrentMealPlanId(currentPlan.id);

      // Check if the week has expired (past Saturday 11:59pm)
      const weekEndDate = new Date(currentPlan.week_end_date);
      weekEndDate.setHours(23, 59, 59, 999);
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
      // No meal plan for this week
      setMealPlan(null);
      setLockedDays({});
      setCurrentMealPlanId(null);
      setCurrentWeekExpired(false);
    }
  }

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

        // Get user's name from auth metadata
        const firstName =
          user.user_metadata?.first_name ||
          user.user_metadata?.full_name?.split(' ')[0] ||
          user.user_metadata?.name?.split(' ')[0] ||
          null;

        setProfile({ ...profileData, first_name: firstName });
        setMealsThisWeek(profileData.dinner_days_per_week || 5);

        // Load current week's meal plan
        await loadMealPlanForWeek(getWeekStartDate(0));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Load meal plan when week changes
  useEffect(() => {
    if (!loading && profile) {
      loadMealPlanForWeek(selectedWeekStart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  // Week navigation handlers
  function goToPreviousWeek() {
    if (weekOffset > -4) { // Allow going back 4 weeks
      setWeekOffset((prev) => prev - 1);
    }
  }

  function goToNextWeek() {
    if (weekOffset < 1) { // Allow going forward 1 week
      setWeekOffset((prev) => prev + 1);
    }
  }

  useEffect(() => {
    if (mealPlan?.meals) {
      const list = generateGroceryList(mealPlan.meals);
      const listWithChecked = loadCheckedState(list);
      setGroceryList(listWithChecked);

      const listByMeal = generateGroceryListByMeal(mealPlan.meals);
      setGroceryListByMeal(listByMeal);
    }
  }, [mealPlan]);

  async function generateNewMealPlan(config: MealPlanConfig) {
    setShowGenerateModal(false);
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
          breakfast_enabled: config.breakfastEnabled,
          breakfast_days_per_week: config.breakfastCount,
          lunch_enabled: config.lunchEnabled,
          lunch_days_per_week: config.lunchCount,
          dinner_days_per_week: config.dinnerCount,
          weekly_context: config.weeklyContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const plan = await response.json();

      // Use selected week dates
      const weekStart = new Date(selectedWeekStart);
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

      const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
      setCurrentMealPlanId(mealPlanData.id);
      setCurrentWeekExpired(false);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateMeal(day: string, mealType: string = 'dinner') {
    const regenerateKey = `${day}-${mealType}`;
    setRegeneratingDay(regenerateKey);
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
          mealType,
          preferences: profile,
          existingMeals: mealPlan.meals,
          lockedDays,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate meal');
      }

      const newMeal = await response.json();

      // Update meal in Supabase
      if (currentMealPlanId) {
        const { data: existingMeal } = await supabase
          .from('meals')
          .select('id')
          .eq('meal_plan_id', currentMealPlanId)
          .eq('day_of_week', day)
          .eq('meal_type', mealType)
          .single();

        if (existingMeal) {
          await supabase
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
        }
      }

      // Update local state
      setMealPlan((prev: any) => {
        if (!prev) return prev;
        const updatedMeals = prev.meals.map((meal: Meal) =>
          meal.day === day && (meal.mealType || 'dinner') === mealType
            ? { ...newMeal, day, mealType }
            : meal
        );
        return { ...prev, meals: updatedMeals };
      });

      setSelectedMeal(null);
    } catch (error) {
      console.error('Error regenerating meal:', error);
      alert('Failed to regenerate meal. Please try again.');
    } finally {
      setRegeneratingDay(null);
    }
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
                background: #f4f7f2;
                color: #637a50;
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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('meal_planner_preferences');
    router.push('/');
  }

  async function handleEditPlan() {
    // Load saved recipes for the dropdown
    try {
      const response = await fetch('/api/saved-recipes');
      if (response.ok) {
        const data = await response.json();
        setSavedRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    }

    // Copy current meal plan to edited meals
    if (mealPlan) {
      setEditedMeals({ meals: [...mealPlan.meals] });
    }

    setEditMode(true);
  }

  function handleCancelEdit() {
    setEditMode(false);
    setEditedMeals(null);
  }

  function handleMealChange(day: string, mealType: string, meal: Meal | null) {
    setEditedMeals((prev) => {
      if (!prev) {
        // If no edited meals yet, start with empty array
        return meal ? { meals: [meal] } : { meals: [] };
      }

      const existingIndex = prev.meals.findIndex(
        (m) => m.day === day && (m.mealType || 'dinner') === mealType
      );

      if (meal === null) {
        // Remove meal
        if (existingIndex >= 0) {
          const updatedMeals = [...prev.meals];
          updatedMeals.splice(existingIndex, 1);
          return { meals: updatedMeals };
        }
        return prev;
      }

      if (existingIndex >= 0) {
        // Update existing meal
        const updatedMeals = [...prev.meals];
        updatedMeals[existingIndex] = meal;
        return { meals: updatedMeals };
      } else {
        // Add new meal
        return { meals: [...prev.meals, meal] };
      }
    });
  }

  async function handleSaveEdits() {
    if (!editedMeals || !currentMealPlanId) return;

    setSavingEdits(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekStart = new Date(selectedWeekStart);

      // Process each meal in editedMeals
      for (const meal of editedMeals.meals) {
        const dayDate = new Date(weekStart);
        const dayIndex = DAYS_OF_WEEK.indexOf(meal.day);
        dayDate.setDate(weekStart.getDate() + (dayIndex >= 0 ? dayIndex : 0));

        // Check if meal already exists in database
        const { data: existingMeal } = await supabase
          .from('meals')
          .select('id')
          .eq('meal_plan_id', currentMealPlanId)
          .eq('day_of_week', meal.day)
          .eq('meal_type', meal.mealType || 'dinner')
          .single();

        const mealData = {
          name: meal.name,
          description: meal.description || 'Custom meal',
          meal_type: meal.mealType || 'dinner',
          day_of_week: meal.day,
          date: dayDate.toISOString().split('T')[0],
          ingredients: meal.ingredients || [],
          instructions: meal.instructions || [],
          prep_time_minutes: meal.prepTime ? parseInt(meal.prepTime) : null,
          cook_time_minutes: meal.cookTime ? parseInt(meal.cookTime) : null,
          tags: meal.tags || [],
        };

        if (existingMeal) {
          // Update existing meal
          await supabase
            .from('meals')
            .update(mealData)
            .eq('id', existingMeal.id);
        } else {
          // Insert new meal
          await supabase
            .from('meals')
            .insert({
              ...mealData,
              user_id: user.id,
              meal_plan_id: currentMealPlanId,
            });
        }
      }

      // Update local meal plan state
      setMealPlan(editedMeals);
      setEditMode(false);
      setEditedMeals(null);
    } catch (error) {
      console.error('Error saving edits:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSavingEdits(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        onSignOut={handleSignOut}
        onGroceryListClick={() => setShowGroceryModal(true)}
      />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <CookingLoader isVisible={generating} />

        {/* Header */}
        <DashboardHeader
          profile={profile}
          onGeneratePlan={() => setShowGenerateModal(true)}
          onEditPlan={handleEditPlan}
          onShowGroceryList={() => setShowGroceryModal(true)}
          onSaveEdits={handleSaveEdits}
          onCancelEdit={handleCancelEdit}
          generating={generating}
          saving={savingEdits}
          hasMealPlan={!!mealPlan}
          editMode={editMode}
        />

        {/* Week Navigator */}
        <WeekNavigator
          weekStartDate={selectedWeekStart}
          onPrevWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          canGoPrev={weekOffset > -4}
          canGoNext={weekOffset < 1}
          isCurrentWeek={isCurrentWeek}
          isFutureWeek={isFutureWeek}
        />

        {/* Weekly Meal Grid */}
        <WeeklyMealGrid
          mealPlan={mealPlan}
          onMealClick={setSelectedMeal}
          regeneratingDay={regeneratingDay}
          editMode={editMode}
          editedMeals={editedMeals}
          savedRecipes={savedRecipes}
          onMealChange={handleMealChange}
          isCurrentWeek={isCurrentWeek}
        />

        {/* Week Expired Notice - only show when viewing current week */}
        {currentWeekExpired && mealPlan && isCurrentWeek && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-1">This week&apos;s plan has expired</h4>
                <p className="text-sm text-amber-800">
                  Your meal plan is now in your history. Use the arrows to navigate to next week and generate a new plan.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onSaveToCookbook={saveRecipeToCookbook}
          onRegenerateMeal={regenerateMeal}
          savingRecipe={savingRecipe}
          regeneratingDay={regeneratingDay}
          currentWeekExpired={currentWeekExpired}
        />
      )}

      {/* Grocery List Modal */}
      <GroceryListModal
        isOpen={showGroceryModal}
        onClose={() => setShowGroceryModal(false)}
        groceryList={groceryList}
        groceryListByMeal={groceryListByMeal}
        groupingMode={groupingMode}
        onGroupingModeChange={setGroupingMode}
        onToggleItem={toggleGroceryItem}
        onPrint={printGroceryList}
      />

      {/* Generate Plan Modal */}
      <GeneratePlanModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={generateNewMealPlan}
        isGenerating={generating}
      />
    </div>
  );
}
