export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-4">
          Meal Planner Tool
        </h1>
        <p className="text-center text-lg text-gray-600 dark:text-gray-400 mb-8">
          AI-powered meal planning made simple
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="mb-4">
            Welcome to your Meal Planner Tool! This application will help you:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Generate personalized meal plans</li>
            <li>Discover new recipes based on your preferences</li>
            <li>Track your favorite meals</li>
            <li>Create shopping lists automatically</li>
          </ul>

          <div className="flex gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">
              Sign Up
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-semibold py-2 px-6 rounded-lg transition">
              Learn More
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
