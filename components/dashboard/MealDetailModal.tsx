'use client';

import { type Meal, type Ingredient } from '@/lib/utils/groceryList';

interface MealDetailModalProps {
  meal: Meal;
  onClose: () => void;
  onSaveToCookbook: (meal: Meal) => void;
  onRegenerateMeal: (day: string, mealType: string) => void;
  savingRecipe: boolean;
  regeneratingDay: string | null;
  currentWeekExpired: boolean;
}

export default function MealDetailModal({
  meal,
  onClose,
  onSaveToCookbook,
  onRegenerateMeal,
  savingRecipe,
  regeneratingDay,
  currentWeekExpired,
}: MealDetailModalProps) {
  const mealType = meal.mealType || 'dinner';
  const isRegenerating = regeneratingDay === `${meal.day}-${mealType}`;

  // Group ingredients by category
  const ingredientsByCategory = meal.ingredients?.reduce((acc: Record<string, Ingredient[]>, ing) => {
    const category = ing.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(ing);
    return acc;
  }, {}) || {};

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">{meal.day}</div>
            <h2 className="text-2xl font-bold text-gray-900">{meal.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <p className="text-gray-600 mb-4">{meal.description}</p>

          {/* Time & Servings */}
          <div className="flex gap-6 mb-6 text-sm">
            <div><span className="font-medium">Prep:</span> {meal.prepTime}</div>
            <div><span className="font-medium">Cook:</span> {meal.cookTime}</div>
            <div><span className="font-medium">Servings:</span> {meal.servings}</div>
          </div>

          {/* Tags */}
          {meal.tags && meal.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {meal.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Ingredients */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
            {Object.keys(ingredientsByCategory).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(ingredientsByCategory).map(([category, items]) => (
                  <div key={category}>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      {category}
                    </div>
                    <ul className="space-y-1">
                      {items.map((ing, idx) => (
                        <li key={idx} className="text-gray-700">
                          • {ing.amount} {ing.unit} {ing.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No ingredients listed</p>
            )}
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
            {meal.instructions && meal.instructions.length > 0 ? (
              <ol className="space-y-2">
                {meal.instructions.map((step: string, idx: number) => (
                  <li key={idx} className="flex gap-3">
                    <span className="font-semibold text-simpler-green-600 min-w-[24px]">
                      {idx + 1}.
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-500 italic">No instructions listed</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onSaveToCookbook(meal)}
              disabled={savingRecipe}
              className="flex-1 px-4 py-2 bg-simpler-green-400 text-white rounded-md hover:bg-simpler-green-500 font-medium disabled:opacity-50"
            >
              {savingRecipe ? 'Saving...' : 'Save to Cookbook'}
            </button>
            {!currentWeekExpired && (
              <button
                onClick={() => onRegenerateMeal(meal.day, mealType)}
                disabled={isRegenerating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate This Meal'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
