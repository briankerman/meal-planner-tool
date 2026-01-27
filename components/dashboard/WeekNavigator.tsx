'use client';

interface WeekNavigatorProps {
  weekStartDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  isCurrentWeek: boolean;
  isFutureWeek: boolean;
}

export default function WeekNavigator({
  weekStartDate,
  onPrevWeek,
  onNextWeek,
  canGoPrev,
  canGoNext,
  isCurrentWeek,
  isFutureWeek,
}: WeekNavigatorProps) {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWeekLabel = () => {
    if (isCurrentWeek) return 'This Week';
    if (isFutureWeek) return 'Next Week';
    return 'Past Week';
  };

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      {/* Previous Week Button */}
      <button
        onClick={onPrevWeek}
        disabled={!canGoPrev}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Previous week"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Week Display */}
      <div className="text-center min-w-[200px]">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg font-semibold text-gray-900">
            {formatDate(weekStartDate)} - {formatDate(weekEndDate)}
          </span>
          {isCurrentWeek && (
            <span className="px-2 py-0.5 text-xs font-medium bg-simpler-green-100 text-simpler-green-700 rounded-full">
              Current
            </span>
          )}
          {isFutureWeek && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              Upcoming
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{getWeekLabel()}</p>
      </div>

      {/* Next Week Button */}
      <button
        onClick={onNextWeek}
        disabled={!canGoNext}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Next week"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
