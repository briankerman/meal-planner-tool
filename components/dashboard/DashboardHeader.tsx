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
  onSaveEdits?: () => void;
  onCancelEdit?: () => void;
  generating: boolean;
  saving?: boolean;
  hasMealPlan: boolean;
  editMode?: boolean;
}

export default function DashboardHeader({
  profile,
  onGeneratePlan,
  onEditPlan,
  onShowGroceryList,
  onSaveEdits,
  onCancelEdit,
  generating,
  saving = false,
  hasMealPlan,
  editMode = false,
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
          <p className="text-gray-600 mt-1">
            {editMode ? 'Edit your meal plan below.' : "Let's have a great week."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {editMode ? (
            <>
              <button
                onClick={onSaveEdits}
                disabled={saving}
                className="px-5 py-2.5 bg-simpler-green-400 text-white rounded-lg font-medium hover:bg-simpler-green-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={onCancelEdit}
                disabled={saving}
                className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Edit mode indicator */}
      {editMode && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Editing mode:</span> Type a custom meal name or select from your cookbook. Click &quot;Save Changes&quot; when done.
          </p>
        </div>
      )}
    </div>
  );
}
