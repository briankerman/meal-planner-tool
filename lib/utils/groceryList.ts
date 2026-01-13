export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: string;
}

export interface GroceryItem {
  name: string;
  totalAmount: string;
  unit: string;
  checked: boolean;
}

export interface GroceryList {
  [category: string]: GroceryItem[];
}

export interface Meal {
  day: string;
  mealType?: string;
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
}

export type GroupingMode = 'category' | 'meal';

export interface GroceryByMeal {
  [mealName: string]: {
    day: string;
    mealType?: string;
    items: GroceryItem[];
  };
}

/**
 * Generate a consolidated grocery list from meal plan grouped by category
 */
export function generateGroceryList(meals: Meal[]): GroceryList {
  const itemsByCategory: GroceryList = {};

  // Extract all ingredients
  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      const category = ingredient.category || 'other';
      const key = `${ingredient.name.toLowerCase()}_${ingredient.unit}`;

      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }

      // Find existing item with same name and unit
      const existingItem = itemsByCategory[category].find(
        (item) =>
          item.name.toLowerCase() === ingredient.name.toLowerCase() &&
          item.unit === ingredient.unit
      );

      if (existingItem) {
        // Consolidate quantities (simple addition for same units)
        const existingAmount = parseFloat(existingItem.totalAmount) || 0;
        const newAmount = parseFloat(ingredient.amount) || 0;
        existingItem.totalAmount = (existingAmount + newAmount).toString();
      } else {
        // Add new item
        itemsByCategory[category].push({
          name: ingredient.name,
          totalAmount: ingredient.amount,
          unit: ingredient.unit,
          checked: false,
        });
      }
    }
  }

  // Sort items within each category alphabetically
  for (const category in itemsByCategory) {
    itemsByCategory[category].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }

  // Return in preferred category order
  const categoryOrder = [
    'produce',
    'meat',
    'seafood',
    'dairy',
    'bakery',
    'pantry',
    'spices',
    'frozen',
    'other',
  ];

  const sortedList: GroceryList = {};
  for (const category of categoryOrder) {
    if (itemsByCategory[category]) {
      sortedList[category] = itemsByCategory[category];
    }
  }

  // Add any remaining categories not in the preferred order
  for (const category in itemsByCategory) {
    if (!sortedList[category]) {
      sortedList[category] = itemsByCategory[category];
    }
  }

  return sortedList;
}

/**
 * Generate a grocery list grouped by meal
 */
export function generateGroceryListByMeal(meals: Meal[]): GroceryByMeal {
  const itemsByMeal: GroceryByMeal = {};

  for (const meal of meals) {
    const mealKey = `${meal.day}_${meal.name}`;
    itemsByMeal[mealKey] = {
      day: meal.day,
      mealType: meal.mealType,
      items: meal.ingredients.map((ing) => ({
        name: ing.name,
        totalAmount: ing.amount,
        unit: ing.unit,
        checked: false,
      })),
    };
  }

  return itemsByMeal;
}

/**
 * Format grocery list for printing/export
 */
export function formatGroceryListForPrint(groceryList: GroceryList, weekStart?: string): string {
  const header = weekStart
    ? `GROCERY LIST - Week of ${weekStart}`
    : 'GROCERY LIST';

  let output = `${header}\n${'='.repeat(header.length)}\n\n`;

  for (const [category, items] of Object.entries(groceryList)) {
    output += `${category.toUpperCase()}\n`;
    for (const item of items) {
      const amount = item.totalAmount && item.unit
        ? `${item.totalAmount} ${item.unit}`
        : item.totalAmount || '';
      output += `☐ ${amount} ${item.name}\n`;
    }
    output += '\n';
  }

  return output;
}

/**
 * Get total item count for grocery list
 */
export function getGroceryListItemCount(groceryList: GroceryList): number {
  return Object.values(groceryList).reduce(
    (total, items) => total + items.length,
    0
  );
}

/**
 * Load checked state from localStorage
 */
export function loadCheckedState(groceryList: GroceryList): GroceryList {
  const stored = localStorage.getItem('grocery_list_checked');
  if (!stored) return groceryList;

  try {
    const checkedState: Record<string, boolean> = JSON.parse(stored);
    const updatedList: GroceryList = {};

    for (const [category, items] of Object.entries(groceryList)) {
      updatedList[category] = items.map((item) => ({
        ...item,
        checked: checkedState[`${category}_${item.name}`] || false,
      }));
    }

    return updatedList;
  } catch {
    return groceryList;
  }
}

/**
 * Save checked state to localStorage
 */
export function saveCheckedState(groceryList: GroceryList): void {
  const checkedState: Record<string, boolean> = {};

  for (const [category, items] of Object.entries(groceryList)) {
    for (const item of items) {
      if (item.checked) {
        checkedState[`${category}_${item.name}`] = true;
      }
    }
  }

  localStorage.setItem('grocery_list_checked', JSON.stringify(checkedState));
}
