'use client';

import { useState } from 'react';

interface GeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: MealPlanConfig) => void;
  isGenerating: boolean;
}

export interface MealPlanConfig {
  breakfastEnabled: boolean;
  breakfastCount: number;
  lunchEnabled: boolean;
  lunchCount: number;
  dinnerCount: number;
  weeklyContext: string;
}

export default function GeneratePlanModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: GeneratePlanModalProps) {
  const [breakfastEnabled, setBreakfastEnabled] = useState(false);
  const [breakfastCount, setBreakfastCount] = useState(3);
  const [lunchEnabled, setLunchEnabled] = useState(false);
  const [lunchCount, setLunchCount] = useState(3);
  const [dinnerCount, setDinnerCount] = useState(5);
  const [weeklyContext, setWeeklyContext] = useState('');

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGenerate({
      breakfastEnabled,
      breakfastCount,
      lunchEnabled,
      lunchCount,
      dinnerCount,
      weeklyContext,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-simpler-green-50 mb-4">
              <svg className="w-8 h-8 text-simpler-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Let&apos;s plan your week</h2>
            <p className="text-gray-600 mt-1">How many meals are we planning for?</p>
          </div>

          {/* Meal Type Toggles */}
          <div className="space-y-4 mb-8">
            {/* Breakfast */}
            <div className={`p-4 rounded-xl border-2 transition-colors ${breakfastEnabled ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍳</span>
                  <span className="font-medium text-gray-900">Breakfast</span>
                </div>
                <button
                  onClick={() => setBreakfastEnabled(!breakfastEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    breakfastEnabled ? 'bg-amber-400' : 'bg-gray-300'
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
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-sm text-gray-600">How many unique recipes?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBreakfastCount(Math.max(1, breakfastCount - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-amber-600">{breakfastCount}</span>
                    <button
                      onClick={() => setBreakfastCount(Math.min(7, breakfastCount + 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lunch */}
            <div className={`p-4 rounded-xl border-2 transition-colors ${lunchEnabled ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥗</span>
                  <span className="font-medium text-gray-900">Lunch</span>
                </div>
                <button
                  onClick={() => setLunchEnabled(!lunchEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    lunchEnabled ? 'bg-green-400' : 'bg-gray-300'
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
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-sm text-gray-600">How many unique recipes?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLunchCount(Math.max(1, lunchCount - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-green-600">{lunchCount}</span>
                    <button
                      onClick={() => setLunchCount(Math.min(7, lunchCount + 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dinner (always on) */}
            <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍽️</span>
                  <span className="font-medium text-gray-900">Dinner</span>
                </div>
                <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">Always on</span>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className="text-sm text-gray-600">How many dinners this week?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDinnerCount(Math.max(1, dinnerCount - 1))}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-blue-600">{dinnerCount}</span>
                  <button
                    onClick={() => setDinnerCount(Math.min(7, dinnerCount + 1))}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Context */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anything we need to know this week?
            </label>
            <textarea
              value={weeklyContext}
              onChange={(e) => setWeeklyContext(e.target.value)}
              placeholder="E.g., &quot;No red sauce this week&quot; or &quot;We have leftover chicken to use up&quot; or &quot;Kids are home from school&quot;"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-simpler-green-400 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 bg-simpler-green-400 text-white rounded-xl font-medium hover:bg-simpler-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
