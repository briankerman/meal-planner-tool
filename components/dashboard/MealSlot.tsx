'use client';

import { type Meal } from '@/lib/utils/groceryList';

interface MealSlotProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  meal: Meal | undefined;
  onMealClick: (meal: Meal) => void;
  isRegenerating: boolean;
}

const mealTypeConfig = {
  breakfast: {
    label: 'Breakfast',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-500',
  },
  lunch: {
    label: 'Lunch',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    iconColor: 'text-green-500',
  },
  dinner: {
    label: 'Dinner',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-500',
  },
};

export default function MealSlot({
  mealType,
  meal,
  onMealClick,
  isRegenerating,
}: MealSlotProps) {
  const config = mealTypeConfig[mealType];

  return (
    <div className={`p-3 min-h-[70px] ${config.bgColor}`}>
      {/* Meal type label */}
      <span className={`text-xs font-semibold uppercase ${config.textColor}`}>
        {config.label}
      </span>

      {isRegenerating ? (
        <div className="mt-1 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
          <span className="text-xs text-gray-500">Regenerating...</span>
        </div>
      ) : meal ? (
        <div
          onClick={() => onMealClick(meal)}
          className="cursor-pointer mt-1 group"
        >
          <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-simpler-green-600 transition-colors">
            {meal.name}
          </p>
          {meal.prepTime && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {meal.prepTime}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-1 italic">No meal planned</p>
      )}
    </div>
  );
}
