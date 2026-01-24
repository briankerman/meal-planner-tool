'use client';

import { type Meal } from '@/lib/utils/groceryList';
import DayCard from './DayCard';

interface SavedRecipe {
  id: string;
  name: string;
  description: string | null;
  meal_type: string | null;
  ingredients: any[];
  instructions: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[];
}

interface WeeklyMealGridProps {
  mealPlan: { meals: Meal[] } | null;
  onMealClick: (meal: Meal) => void;
  regeneratingDay: string | null;
  editMode?: boolean;
  editedMeals?: { meals: Meal[] } | null;
  savedRecipes?: SavedRecipe[];
  onMealChange?: (day: string, mealType: string, meal: Meal | null) => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WeeklyMealGrid({
  mealPlan,
  onMealClick,
  regeneratingDay,
  editMode = false,
  editedMeals,
  savedRecipes = [],
  onMealChange,
}: WeeklyMealGridProps) {
  const today = new Date();
  const todayName = DAYS_OF_WEEK[today.getDay()];

  // In edit mode, use editedMeals if available, otherwise fall back to mealPlan
  const activePlan = editMode && editedMeals ? editedMeals : mealPlan;

  const getMealsForDay = (day: string): Meal[] => {
    if (!activePlan?.meals) return [];
    return activePlan.meals.filter((m) => m.day === day);
  };

  if (!mealPlan && !editMode) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No meal plan yet</h3>
        <p className="text-gray-500">Click &quot;Generate Plan&quot; to create your weekly meal plan.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {DAYS_OF_WEEK.map((day) => (
        <DayCard
          key={day}
          day={day}
          meals={getMealsForDay(day)}
          onMealClick={onMealClick}
          regeneratingDay={regeneratingDay}
          isToday={day === todayName}
          editMode={editMode}
          savedRecipes={savedRecipes}
          onMealChange={onMealChange}
        />
      ))}
    </div>
  );
}
