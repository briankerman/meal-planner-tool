'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [breakfastEnabled, setBreakfastEnabled] = useState(false);
  const [lunchEnabled, setLunchEnabled] = useState(false);
  const [breakfastDaysPerWeek, setBreakfastDaysPerWeek] = useState(5);
  const [lunchDaysPerWeek, setLunchDaysPerWeek] = useState(5);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);
      setBreakfastEnabled(profileData.breakfast_enabled || false);
      setLunchEnabled(profileData.lunch_enabled || false);
      setBreakfastDaysPerWeek(profileData.breakfast_days_per_week || 5);
      setLunchDaysPerWeek(profileData.lunch_days_per_week || 5);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          breakfast_enabled: breakfastEnabled,
          lunch_enabled: lunchEnabled,
          breakfast_days_per_week: breakfastEnabled ? breakfastDaysPerWeek : null,
          lunch_days_per_week: lunchEnabled ? lunchDaysPerWeek : null,
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('Settings saved! Generate a new meal plan to see breakfast and lunch meals.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600 mb-8">Update your meal planning preferences</p>

          {/* Breakfast Section */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Breakfast</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Generate breakfast recipes for meal prepping
                </p>
              </div>
              <button
                onClick={() => setBreakfastEnabled(!breakfastEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  breakfastEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    breakfastEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {breakfastEnabled && (
              <div className="ml-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many unique breakfast recipes per week?
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="2"
                    max="7"
                    value={breakfastDaysPerWeek}
                    onChange={(e) => setBreakfastDaysPerWeek(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-blue-600 w-12 text-center">
                    {breakfastDaysPerWeek}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  We&apos;ll generate {breakfastDaysPerWeek} unique recipes that you can meal prep and repeat throughout the week
                </p>
              </div>
            )}
          </div>

          {/* Lunch Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Lunch</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Generate lunch recipes for meal prepping
                </p>
              </div>
              <button
                onClick={() => setLunchEnabled(!lunchEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  lunchEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    lunchEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {lunchEnabled && (
              <div className="ml-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many unique lunch recipes per week?
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="2"
                    max="7"
                    value={lunchDaysPerWeek}
                    onChange={(e) => setLunchDaysPerWeek(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-blue-600 w-12 text-center">
                    {lunchDaysPerWeek}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  We&apos;ll generate {lunchDaysPerWeek} unique recipes that you can meal prep and repeat throughout the week
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
