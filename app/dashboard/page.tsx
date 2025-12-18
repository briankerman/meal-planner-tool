'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/database';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
      } else {
        setProfile(data);
        if (!data.onboarding_completed) {
          router.push('/onboarding');
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Simpler Sundays</h1>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome back, {profile?.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600 mt-1">Ready to plan your week?</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600">Household Size</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {(profile?.num_adults || 0) + (profile?.num_children || 0)} people
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600">Dinners per Week</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {profile?.dinner_days_per_week || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600">Shopping Day</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {profile?.shopping_day || 'Not set'}
            </div>
          </div>
        </div>

        {/* Current week placeholder */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Plan</h3>
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">You don't have a meal plan for this week yet.</p>
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              onClick={() => alert('Meal plan generation coming soon!')}
            >
              Generate This Week's Plan
            </button>
          </div>
        </div>

        {/* Preferences summary */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences</h3>
          <div className="space-y-4">
            {profile?.cuisine_preferences && profile.cuisine_preferences.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700">Favorite Cuisines</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.cuisine_preferences.map(cuisine => (
                    <span
                      key={cuisine}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile?.meal_style_preferences && profile.meal_style_preferences.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700">Meal Styles</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.meal_style_preferences.map(style => (
                    <span
                      key={style}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile?.allergies && profile.allergies.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700">Allergies & Restrictions</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.allergies.map(allergy => (
                    <span
                      key={allergy}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile?.staple_meals && profile.staple_meals.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700">Family Favorites</div>
                <ul className="mt-2 space-y-1">
                  {profile.staple_meals.map((meal, idx) => (
                    <li key={idx} className="text-gray-600">• {meal}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/onboarding')}
            className="mt-6 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Update preferences
          </button>
        </div>
      </main>
    </div>
  );
}
