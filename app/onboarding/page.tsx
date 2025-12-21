'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'household' | 'routine' | 'week_config' | 'preferences' | 'restrictions' | 'staples';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CHILD_AGE_RANGES = ['Toddler (1-3)', 'Kid (4-12)', 'Teen (13-17)'];
const CUISINES = ['Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian', 'Thai'];
const MEAL_STYLES = ['Quick (30 min)', 'Slow-cooker', 'One-pan', 'Sheet-pan', 'Instant Pot', 'Make-ahead'];
const COMMON_ALLERGIES = ['Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Shellfish', 'Fish'];
const LOCK_OPTIONS = [
  { value: '', label: 'Cook' },
  { value: 'date_night', label: 'Date Night' },
  { value: 'takeout', label: 'Takeout' },
  { value: 'leftovers', label: 'Leftovers' },
  { value: 'other', label: 'Other' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('household');
  const [loading, setLoading] = useState(false);
  // Form state
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [childAgeRanges, setChildAgeRanges] = useState<string[]>([]);
  const [shoppingDay, setShoppingDay] = useState('Saturday');
  const [dinnerDaysPerWeek, setDinnerDaysPerWeek] = useState(5);
  const [plansLeftovers, setPlansLeftovers] = useState(true);
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const [mealStylePreferences, setMealStylePreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [stapleMeals, setStapleMeals] = useState<string[]>(['', '', '']);
  const [lockedDays, setLockedDays] = useState<Record<string, string>>({});

  const steps: Step[] = ['household', 'routine', 'week_config', 'preferences', 'restrictions', 'staples'];
  const stepIndex = steps.indexOf(currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  }

  function handleStapleMealChange(index: number, value: string) {
    const updated = [...stapleMeals];
    updated[index] = value;
    setStapleMeals(updated);
  }

  function updateLockedDay(day: string, value: string) {
    const updated = { ...lockedDays };
    if (value === '') {
      delete updated[day];
    } else {
      updated[day] = value;
    }
    setLockedDays(updated);
  }

  async function handleComplete() {
    setLoading(true);
    try {
      // Store in localStorage (no auth for now)
      const preferences = {
        num_adults: numAdults,
        num_children: numChildren,
        child_age_ranges: childAgeRanges.length > 0 ? childAgeRanges : null,
        shopping_day: shoppingDay,
        dinner_days_per_week: dinnerDaysPerWeek,
        plans_leftovers: plansLeftovers,
        cuisine_preferences: cuisinePreferences.length > 0 ? cuisinePreferences : null,
        meal_style_preferences: mealStylePreferences.length > 0 ? mealStylePreferences : null,
        allergies: allergies.length > 0 ? allergies : null,
        staple_meals: stapleMeals.filter(m => m.trim() !== ''),
        onboarding_completed: true
      };

      localStorage.setItem('meal_planner_preferences', JSON.stringify(preferences));
      localStorage.setItem('weekly_locked_days', JSON.stringify(lockedDays));
      router.push('/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 'household':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Tell us about your household</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of adults
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumAdults(num)}
                    className={`px-4 py-2 rounded-md border ${
                      numAdults === num
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of children
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumChildren(num)}
                    className={`px-4 py-2 rounded-md border ${
                      numChildren === num
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {numChildren > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age ranges (select all that apply)
                </label>
                <div className="space-y-2">
                  {CHILD_AGE_RANGES.map(range => (
                    <label key={range} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={childAgeRanges.includes(range)}
                        onChange={() => setChildAgeRanges(toggleArrayItem(childAgeRanges, range))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">{range}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'routine':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your weekly routine</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When do you usually shop for groceries?
              </label>
              <select
                value={shoppingDay}
                onChange={(e) => setShoppingDay(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many dinners do you cook per week?
              </label>
              <div className="flex gap-2">
                {[3, 4, 5, 6, 7].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDinnerDaysPerWeek(num)}
                    className={`px-4 py-2 rounded-md border ${
                      dinnerDaysPerWeek === num
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do you plan for leftovers?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPlansLeftovers(true)}
                  className={`px-6 py-2 rounded-md border ${
                    plansLeftovers
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setPlansLeftovers(false)}
                  className={`px-6 py-2 rounded-md border ${
                    !plansLeftovers
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        );

      case 'week_config':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Configure Your Typical Week</h2>
            <p className="text-gray-600">
              Which days do you typically cook vs. go out, have leftovers, etc.? This helps us create a more realistic meal plan for you.
            </p>

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

            <p className="text-sm text-gray-500">
              Don&apos;t worry, you can change these settings anytime from the dashboard.
            </p>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">What do you like to eat?</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favorite cuisines (select all you enjoy)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CUISINES.map(cuisine => (
                  <label key={cuisine} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={cuisinePreferences.includes(cuisine)}
                      onChange={() => setCuisinePreferences(toggleArrayItem(cuisinePreferences, cuisine))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">{cuisine}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred meal styles (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MEAL_STYLES.map(style => (
                  <label key={style} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={mealStylePreferences.includes(style)}
                      onChange={() => setMealStylePreferences(toggleArrayItem(mealStylePreferences, style))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">{style}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'restrictions':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Any dietary restrictions?</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies or foods to avoid (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_ALLERGIES.map(allergy => (
                  <label key={allergy} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={allergies.includes(allergy)}
                      onChange={() => setAllergies(toggleArrayItem(allergies, allergy))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">{allergy}</span>
                  </label>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500">
              You can skip this if you don&apos;t have any restrictions.
            </p>
          </div>
        );

      case 'staples':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Any family favorites?</h2>
            <p className="text-gray-600">
              Are there meals you make regularly? (Optional - we&apos;ll include these in your plans)
            </p>

            <div className="space-y-3">
              {stapleMeals.map((meal, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meal {index + 1}
                  </label>
                  <input
                    type="text"
                    value={meal}
                    onChange={(e) => handleStapleMealChange(index, e.target.value)}
                    placeholder="e.g., Taco Tuesday, Pasta night"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500">
              Don&apos;t worry, you can always add or change these later.
            </p>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {stepIndex + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current step */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {stepIndex > 0 ? (
              <button
                onClick={() => setCurrentStep(steps[stepIndex - 1])}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {stepIndex < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(steps[stepIndex + 1])}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
