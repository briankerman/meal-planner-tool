'use client';

import { useState, useRef, useEffect } from 'react';
import { type Meal } from '@/lib/utils/groceryList';

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

interface EditableMealSlotProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  meal: Meal | undefined;
  day: string;
  savedRecipes: SavedRecipe[];
  onMealChange: (day: string, mealType: string, meal: Meal | null) => void;
}

const mealTypeConfig = {
  breakfast: {
    label: 'Breakfast',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    focusColor: 'focus:ring-amber-300',
  },
  lunch: {
    label: 'Lunch',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    focusColor: 'focus:ring-green-300',
  },
  dinner: {
    label: 'Dinner',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    focusColor: 'focus:ring-blue-300',
  },
};

export default function EditableMealSlot({
  mealType,
  meal,
  day,
  savedRecipes,
  onMealChange,
}: EditableMealSlotProps) {
  const config = mealTypeConfig[mealType];
  const [customName, setCustomName] = useState(meal?.name || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter recipes by meal type and search query
  const filteredRecipes = savedRecipes.filter((recipe) => {
    const matchesMealType = !recipe.meal_type || recipe.meal_type === mealType;
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMealType && matchesSearch;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update custom name when meal changes
  useEffect(() => {
    setCustomName(meal?.name || '');
  }, [meal?.name]);

  function handleCustomNameChange(value: string) {
    setCustomName(value);
    setSearchQuery(value);

    if (value.trim()) {
      // Create a simple custom meal with just the name
      const customMeal: Meal = {
        day,
        mealType,
        name: value,
        description: 'Custom meal',
        prepTime: '',
        cookTime: '',
        servings: 4,
        ingredients: [],
        instructions: [],
        tags: ['custom'],
      };
      onMealChange(day, mealType, customMeal);
    } else {
      onMealChange(day, mealType, null);
    }
  }

  function handleSelectRecipe(recipe: SavedRecipe) {
    const mealFromRecipe: Meal = {
      day,
      mealType,
      name: recipe.name,
      description: recipe.description || '',
      prepTime: recipe.prep_time_minutes ? `${recipe.prep_time_minutes} min` : '',
      cookTime: recipe.cook_time_minutes ? `${recipe.cook_time_minutes} min` : '',
      servings: 4,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      tags: recipe.tags || [],
    };

    setCustomName(recipe.name);
    setShowDropdown(false);
    onMealChange(day, mealType, mealFromRecipe);
  }

  function handleClearMeal() {
    setCustomName('');
    setSearchQuery('');
    onMealChange(day, mealType, null);
  }

  return (
    <div className={`p-3 min-h-[80px] ${config.bgColor}`} ref={dropdownRef}>
      {/* Meal type label */}
      <span className={`text-xs font-semibold uppercase ${config.textColor}`}>
        {config.label}
      </span>

      {/* Editable input */}
      <div className="mt-1 relative">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={customName}
            onChange={(e) => handleCustomNameChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type or select..."
            className={`w-full px-2 py-1.5 text-sm border ${config.borderColor} rounded focus:outline-none focus:ring-2 ${config.focusColor} bg-white`}
          />
          {customName && (
            <button
              onClick={handleClearMeal}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Clear meal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown for saved recipes */}
        {showDropdown && filteredRecipes.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
              From My Cookbook
            </div>
            {filteredRecipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleSelectRecipe(recipe)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{recipe.name}</p>
                  {recipe.prep_time_minutes && (
                    <p className="text-xs text-gray-500">{recipe.prep_time_minutes} min prep</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-simpler-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Show "no recipes" hint */}
        {showDropdown && filteredRecipes.length === 0 && savedRecipes.length > 0 && searchQuery && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <p className="text-xs text-gray-500 text-center">
              No matching recipes. Press Enter to use &quot;{searchQuery}&quot; as a custom meal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
