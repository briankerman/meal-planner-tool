'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/dashboard';

const CUISINES = ['Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian', 'Thai'];
const MEAL_STYLES = ['Quick (30 min)', 'Slow-cooker', 'One-pan', 'Sheet-pan', 'Instant Pot', 'Make-ahead'];
const COMMON_ALLERGIES = ['Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Shellfish', 'Fish'];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Household
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);

  // Pinterest
  const [pinterestConnected, setPinterestConnected] = useState(false);
  const [pinterestUsername, setPinterestUsername] = useState<string | null>(null);
  const [pinterestLoading, setPinterestLoading] = useState(false);
  const [pinterestMessage, setPinterestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preferences
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const [mealStylePreferences, setMealStylePreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
    loadPinterestStatus();

    // Check for Pinterest callback messages
    const pinterestConnected = searchParams.get('pinterest_connected');
    const pinterestError = searchParams.get('pinterest_error');

    if (pinterestConnected === 'true') {
      setPinterestMessage({ type: 'success', text: 'Pinterest connected successfully!' });
      // Clear URL params
      router.replace('/settings', { scroll: false });
    } else if (pinterestError) {
      setPinterestMessage({ type: 'error', text: `Pinterest connection failed: ${pinterestError}` });
      router.replace('/settings', { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  async function loadPinterestStatus() {
    try {
      const response = await fetch('/api/pinterest/status');
      if (response.ok) {
        const data = await response.json();
        setPinterestConnected(data.connected);
        setPinterestUsername(data.username || null);
      }
    } catch (error) {
      console.error('Error loading Pinterest status:', error);
    }
  }

  async function connectPinterest() {
    setPinterestLoading(true);
    setPinterestMessage(null);
    try {
      const response = await fetch('/api/pinterest/auth');
      if (!response.ok) throw new Error('Failed to get auth URL');

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting Pinterest:', error);
      setPinterestMessage({ type: 'error', text: 'Failed to connect Pinterest' });
      setPinterestLoading(false);
    }
  }

  async function disconnectPinterest() {
    if (!confirm('Disconnect your Pinterest account?')) return;

    setPinterestLoading(true);
    try {
      const response = await fetch('/api/pinterest/status', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to disconnect');

      setPinterestConnected(false);
      setPinterestUsername(null);
      setPinterestMessage({ type: 'success', text: 'Pinterest disconnected' });
    } catch (error) {
      console.error('Error disconnecting Pinterest:', error);
      setPinterestMessage({ type: 'error', text: 'Failed to disconnect Pinterest' });
    } finally {
      setPinterestLoading(false);
    }
  }

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

      setFirstName(user.user_metadata?.first_name || '');
      setLastName(user.user_metadata?.last_name || '');
      setPhone(user.user_metadata?.phone || '');
      setEmail(user.email || '');

      // Load household info
      setNumAdults(profileData.num_adults || 2);
      setNumChildren(profileData.num_children || 0);

      // Load preferences
      setCuisinePreferences(profileData.cuisine_preferences || []);
      setMealStylePreferences(profileData.meal_style_preferences || []);
      setAllergies(profileData.allergies || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Update name and phone in auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
        },
      });
      if (authError) throw authError;

      // Update profile settings
      const { error } = await supabase
        .from('profiles')
        .update({
          num_adults: numAdults,
          num_children: numChildren,
          cuisine_preferences: cuisinePreferences.length > 0 ? cuisinePreferences : null,
          meal_style_preferences: mealStylePreferences.length > 0 ? mealStylePreferences : null,
          allergies: allergies.length > 0 ? allergies : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('Settings saved!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    localStorage.removeItem('meal_planner_preferences');
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onSignOut={handleSignOut} />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-3xl">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600 mb-8">Update your account and meal planning preferences</p>

            {/* Personal Information Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-simpler-green-400 focus:border-transparent"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-simpler-green-400 focus:border-transparent"
                    placeholder="Last name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-simpler-green-400 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Household Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Household</h2>

              <div className="space-y-4">
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
                        className={`px-4 py-2 rounded-lg border ${
                          numAdults === num
                            ? 'bg-simpler-green-400 text-white border-simpler-green-400'
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
                        className={`px-4 py-2 rounded-lg border ${
                          numChildren === num
                            ? 'bg-simpler-green-400 text-white border-simpler-green-400'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Food Preferences Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Food Preferences</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favorite cuisines
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CUISINES.map(cuisine => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => setCuisinePreferences(toggleArrayItem(cuisinePreferences, cuisine))}
                        className={`px-3 py-1.5 rounded-full text-sm border ${
                          cuisinePreferences.includes(cuisine)
                            ? 'bg-simpler-green-400 text-white border-simpler-green-400'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred meal styles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MEAL_STYLES.map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setMealStylePreferences(toggleArrayItem(mealStylePreferences, style))}
                        className={`px-3 py-1.5 rounded-full text-sm border ${
                          mealStylePreferences.includes(style)
                            ? 'bg-simpler-green-400 text-white border-simpler-green-400'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Apps Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Apps</h2>

              {pinterestMessage && (
                <div
                  className={`mb-4 p-3 rounded-lg ${
                    pinterestMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {pinterestMessage.text}
                </div>
              )}

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Pinterest</h3>
                      {pinterestConnected ? (
                        <p className="text-sm text-green-600">Connected as @{pinterestUsername}</p>
                      ) : (
                        <p className="text-sm text-gray-500">Import recipes from your Pinterest boards</p>
                      )}
                    </div>
                  </div>

                  {pinterestConnected ? (
                    <button
                      onClick={disconnectPinterest}
                      disabled={pinterestLoading}
                      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      {pinterestLoading ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      onClick={connectPinterest}
                      disabled={pinterestLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {pinterestLoading ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>

                {pinterestConnected && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Go to your <a href="/cookbook" className="text-simpler-green-600 hover:underline">Cookbook</a> to import recipes from Pinterest.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dietary Restrictions Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Dietary Restrictions</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies or foods to avoid
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGIES.map(allergy => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => setAllergies(toggleArrayItem(allergies, allergy))}
                      className={`px-3 py-1.5 rounded-full text-sm border ${
                        allergies.includes(allergy)
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select any foods you need to avoid. These will never appear in your meal plans.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-4">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex-1 bg-simpler-green-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-simpler-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
