'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface SavedRecipe {
  id: string;
  name: string;
  description: string | null;
  meal_type: string | null;
  source: string | null;
  ingredients: any[];
  instructions: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[];
  cuisine: string | null;
  times_used: number;
  last_used_date: string | null;
  created_at: string;
}

export default function CookbookPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const [filterMealType, setFilterMealType] = useState<string>('all');

  useEffect(() => {
    async function loadRecipes() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/saved-recipes');
        if (!response.ok) throw new Error('Failed to load recipes');

        const data = await response.json();
        setRecipes(data.recipes || []);
      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, [router]);

  async function deleteRecipe(recipeId: string) {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const response = await fetch(`/api/saved-recipes?id=${recipeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete recipe');

      setRecipes(recipes.filter((r) => r.id !== recipeId));
      setSelectedRecipe(null);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe');
    }
  }

  const filteredRecipes =
    filterMealType === 'all'
      ? recipes
      : recipes.filter((r) => r.meal_type === filterMealType);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading cookbook...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Cookbook</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Back to Dashboard
          </Link>
        </div>

        {recipes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No saved recipes yet.</p>
            <p className="text-gray-500 text-sm">
              Save recipes from your meal plans to build your personal cookbook.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => setFilterMealType('all')}
                className={`px-4 py-2 rounded-md font-medium ${
                  filterMealType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All ({recipes.length})
              </button>
              <button
                onClick={() => setFilterMealType('breakfast')}
                className={`px-4 py-2 rounded-md font-medium ${
                  filterMealType === 'breakfast'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Breakfast ({recipes.filter((r) => r.meal_type === 'breakfast').length})
              </button>
              <button
                onClick={() => setFilterMealType('lunch')}
                className={`px-4 py-2 rounded-md font-medium ${
                  filterMealType === 'lunch'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Lunch ({recipes.filter((r) => r.meal_type === 'lunch').length})
              </button>
              <button
                onClick={() => setFilterMealType('dinner')}
                className={`px-4 py-2 rounded-md font-medium ${
                  filterMealType === 'dinner'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Dinner ({recipes.filter((r) => r.meal_type === 'dinner').length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-600 uppercase">
                      {recipe.meal_type || 'dinner'}
                    </span>
                    {recipe.times_used > 0 && (
                      <span className="text-xs text-gray-500">Used {recipe.times_used}x</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{recipe.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{recipe.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500 mb-3">
                    {recipe.prep_time_minutes && <span>Prep: {recipe.prep_time_minutes}m</span>}
                    {recipe.cook_time_minutes && <span>Cook: {recipe.cook_time_minutes}m</span>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {recipe.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedRecipe && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedRecipe(null)}
          >
            <div
              className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <span className="text-xs font-semibold text-blue-600 uppercase">
                    {selectedRecipe.meal_type || 'dinner'}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{selectedRecipe.name}</h3>
                  <p className="text-gray-600 mt-2">{selectedRecipe.description}</p>
                </div>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-500 hover:text-gray-700 ml-4"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-6 text-sm text-gray-600 mb-6">
                {selectedRecipe.prep_time_minutes && (
                  <div>
                    <span className="font-medium">Prep:</span> {selectedRecipe.prep_time_minutes} min
                  </div>
                )}
                {selectedRecipe.cook_time_minutes && (
                  <div>
                    <span className="font-medium">Cook:</span> {selectedRecipe.cook_time_minutes} min
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Ingredients</h4>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ing: any, idx: number) => (
                    <li key={idx} className="text-gray-700">
                      {ing.amount} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Instructions</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {selectedRecipe.instructions.map((step: string, idx: number) => (
                    <li key={idx} className="text-gray-700">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex gap-2 flex-wrap">
                    {selectedRecipe.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => deleteRecipe(selectedRecipe.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                >
                  Delete Recipe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
