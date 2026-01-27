'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/dashboard';
import PinterestImportModal from '@/components/pinterest/PinterestImportModal';

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
  const [showPinterestModal, setShowPinterestModal] = useState(false);

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

  useEffect(() => {
    loadRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function handleSignOut() {
    localStorage.removeItem('meal_planner_preferences');
    router.push('/');
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onSignOut={handleSignOut} />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Cookbook</h1>
            <button
              onClick={() => setShowPinterestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
              </svg>
              Import from Pinterest
            </button>
          </div>

          {recipes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">No saved recipes yet.</p>
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
                      ? 'bg-simpler-green-400 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All ({recipes.length})
                </button>
                <button
                  onClick={() => setFilterMealType('breakfast')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    filterMealType === 'breakfast'
                      ? 'bg-simpler-green-400 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Breakfast ({recipes.filter((r) => r.meal_type === 'breakfast').length})
                </button>
                <button
                  onClick={() => setFilterMealType('lunch')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    filterMealType === 'lunch'
                      ? 'bg-simpler-green-400 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Lunch ({recipes.filter((r) => r.meal_type === 'lunch').length})
                </button>
                <button
                  onClick={() => setFilterMealType('dinner')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    filterMealType === 'dinner'
                      ? 'bg-simpler-green-400 text-white'
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
                      <span className="text-xs font-semibold text-simpler-green-600 uppercase">
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
        </div>

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
                  <span className="text-xs font-semibold text-simpler-green-600 uppercase">
                    {selectedRecipe.meal_type || 'dinner'}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{selectedRecipe.name}</h3>
                  <p className="text-gray-600 mt-2">{selectedRecipe.description}</p>
                </div>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-500 hover:text-gray-700 ml-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                <ol className="space-y-2">
                  {selectedRecipe.instructions.map((step: string, idx: number) => (
                    <li key={idx} className="flex gap-3">
                      <span className="font-semibold text-simpler-green-600 min-w-[24px]">{idx + 1}.</span>
                      <span className="text-gray-700">{step}</span>
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

        <PinterestImportModal
          isOpen={showPinterestModal}
          onClose={() => setShowPinterestModal(false)}
          onImportSuccess={loadRecipes}
        />
      </main>
    </div>
  );
}
