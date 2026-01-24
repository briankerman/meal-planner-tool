'use client';

interface Profile {
  first_name?: string;
  [key: string]: any;
}

interface DashboardHeaderProps {
  profile: Profile | null;
  onGeneratePlan: () => void;
  onEditPlan: () => void;
  onShowGroceryList: () => void;
  generating: boolean;
  hasMealPlan: boolean;
}

export default function DashboardHeader({
  profile,
  onGeneratePlan,
  onEditPlan,
  onShowGroceryList,
  generating,
  hasMealPlan,
}: DashboardHeaderProps) {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const firstName = profile?.first_name || 'there';

  return (
    <div className="mb-8">
      <div className="flex justify-between items-start">
        {/* Greeting */}
        <div>
          <p className="text-sm text-gray-500 mb-1">{dateString}</p>
          <h1 className="text-3xl font-bold text-gray-900">Hello, {firstName}</h1>
          <p className="text-gray-600 mt-1">Let&apos;s have a great week.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onGeneratePlan}
            disabled={generating}
            className="px-5 py-2.5 bg-simpler-green-400 text-white rounded-lg font-medium hover:bg-simpler-green-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : hasMealPlan ? 'Regenerate Plan' : 'Generate Plan'}
          </button>
          {hasMealPlan && (
            <>
              <button
                onClick={onEditPlan}
                disabled={generating}
                className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Edit Plan
              </button>
              <button
                onClick={onShowGroceryList}
                disabled={generating}
                className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Grocery List
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
