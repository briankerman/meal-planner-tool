'use client';

import {
  type GroceryList,
  type GroceryByMeal,
  type GroupingMode,
  getGroceryListItemCount,
} from '@/lib/utils/groceryList';

interface GroceryListModalProps {
  isOpen: boolean;
  onClose: () => void;
  groceryList: GroceryList | null;
  groceryListByMeal: GroceryByMeal | null;
  groupingMode: GroupingMode;
  onGroupingModeChange: (mode: GroupingMode) => void;
  onToggleItem: (category: string, itemName: string) => void;
  onPrint: () => void;
}

export default function GroceryListModal({
  isOpen,
  onClose,
  groceryList,
  groceryListByMeal,
  groupingMode,
  onGroupingModeChange,
  onToggleItem,
  onPrint,
}: GroceryListModalProps) {
  if (!isOpen || !groceryList) return null;

  const itemCount = getGroceryListItemCount(groceryList);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Grocery List</h2>
            <span className="px-3 py-1 bg-simpler-green-100 text-simpler-green-700 rounded-full text-sm font-medium">
              {itemCount} items
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onPrint}
              className="px-4 py-2 text-sm font-medium text-white bg-simpler-green-400 rounded-lg hover:bg-simpler-green-500 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Grouping Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => onGroupingModeChange('category')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                groupingMode === 'category'
                  ? 'bg-simpler-green-400 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              By Category
            </button>
            <button
              onClick={() => onGroupingModeChange('meal')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                groupingMode === 'meal'
                  ? 'bg-simpler-green-400 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              By Meal
            </button>
          </div>

          {/* Category View */}
          {groupingMode === 'category' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(groceryList).map(([category, items]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-simpler-green-400"></span>
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 py-2 px-3 cursor-pointer hover:bg-white rounded-md transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => onToggleItem(category, item.name)}
                          className="w-5 h-5 text-simpler-green-400 border-gray-300 rounded focus:ring-simpler-green-400"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            item.checked ? 'line-through text-gray-400' : 'text-gray-700'
                          }`}
                        >
                          <span className="font-medium">{item.totalAmount} {item.unit}</span> {item.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Meal View */
            <div className="space-y-6">
              {groceryListByMeal &&
                Object.entries(groceryListByMeal).map(([mealKey, meal]) => (
                  <div key={mealKey} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 text-xs font-bold text-simpler-green-700 bg-simpler-green-100 rounded uppercase">
                        {meal.day}
                      </span>
                      <h4 className="text-sm font-semibold text-gray-800">
                        {mealKey.split('_').slice(1).join(' ')}
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {meal.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="text-sm text-gray-700 bg-white px-3 py-2 rounded"
                        >
                          <span className="font-medium">{item.totalAmount} {item.unit}</span> {item.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
