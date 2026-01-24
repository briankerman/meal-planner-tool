'use client';

import { type Meal } from '@/lib/utils/groceryList';
import MealSlot from './MealSlot';
import EditableMealSlot from './EditableMealSlot';

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

interface DayCardProps {
  day: string;
  meals: Meal[];
  onMealClick: (meal: Meal) => void;
  regeneratingDay: string | null;
  isToday: boolean;
  editMode?: boolean;
  savedRecipes?: SavedRecipe[];
  onMealChange?: (day: string, mealType: string, meal: Meal | null) => void;
}

export default function DayCard({
  day,
  meals,
  onMealClick,
  regeneratingDay,
  isToday,
  editMode = false,
  savedRecipes = [],
  onMealChange,
}: DayCardProps) {
  const getMealForType = (mealType: string) => {
    return meals.find((m) => (m.mealType || 'dinner') === mealType);
  };

  const isRegeneratingMeal = (mealType: string) => {
    return regeneratingDay === `${day}-${mealType}`;
  };

  const handleMealChange = (dayName: string, mealType: string, meal: Meal | null) => {
    if (onMealChange) {
      onMealChange(dayName, mealType, meal);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
        isToday ? 'border-simpler-green-400 ring-2 ring-simpler-green-100' : 'border-gray-200'
      }`}
    >
      {/* Day header */}
      <div className={`px-4 py-3 border-b ${isToday ? 'bg-simpler-green-50 border-simpler-green-100' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`font-semibold text-center ${isToday ? 'text-simpler-green-700' : 'text-gray-900'}`}>
          {day}
        </h3>
        {isToday && (
          <span className="block text-xs text-center text-simpler-green-600 font-medium">
            Today
          </span>
        )}
      </div>

      {/* Meal slots */}
      <div className="divide-y divide-gray-100">
        {editMode ? (
          <>
            <EditableMealSlot
              mealType="breakfast"
              meal={getMealForType('breakfast')}
              day={day}
              savedRecipes={savedRecipes}
              onMealChange={handleMealChange}
            />
            <EditableMealSlot
              mealType="lunch"
              meal={getMealForType('lunch')}
              day={day}
              savedRecipes={savedRecipes}
              onMealChange={handleMealChange}
            />
            <EditableMealSlot
              mealType="dinner"
              meal={getMealForType('dinner')}
              day={day}
              savedRecipes={savedRecipes}
              onMealChange={handleMealChange}
            />
          </>
        ) : (
          <>
            <MealSlot
              mealType="breakfast"
              meal={getMealForType('breakfast')}
              onMealClick={onMealClick}
              isRegenerating={isRegeneratingMeal('breakfast')}
            />
            <MealSlot
              mealType="lunch"
              meal={getMealForType('lunch')}
              onMealClick={onMealClick}
              isRegenerating={isRegeneratingMeal('lunch')}
            />
            <MealSlot
              mealType="dinner"
              meal={getMealForType('dinner')}
              onMealClick={onMealClick}
              isRegenerating={isRegeneratingMeal('dinner')}
            />
          </>
        )}
      </div>
    </div>
  );
}
