import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="py-4 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src="/images/simplersundayslogo.png"
              alt="Simpler Sundays Logo"
              width={200}
              height={80}
              priority
              className="h-16 w-auto"
            />
          </div>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero Section with Image */}
      <div className="relative w-full h-[400px] sm:h-[500px] mb-16">
        <Image
          src="/images/heroimage.jpg"
          alt="Meal Planning Hero"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 drop-shadow-lg">
              Take the stress out of meal planning
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto drop-shadow-md">
              AI-powered meal plans that learn what your family loves.
              Generate a week&apos;s worth of dinners in seconds, complete with grocery lists.
            </p>
            <Link
              href="/onboarding"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-lg shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Meal Plans
            </h3>
            <p className="text-gray-600">
              AI generates personalized weekly meal plans based on your family&apos;s preferences,
              dietary needs, and cooking style.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🛒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Auto Grocery Lists
            </h3>
            <p className="text-gray-600">
              Get organized shopping lists automatically generated from your meal plan.
              Check off items as you shop.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Learns Your Taste
            </h3>
            <p className="text-gray-600">
              Like, save, or skip meals. The system learns what works for your family
              and gets better over time.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How it works
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Tell us about you</h4>
              <p className="text-sm text-gray-600">
                Quick quiz about your household, dietary needs, and preferences
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Generate your plan</h4>
              <p className="text-sm text-gray-600">
                AI creates a full week of dinners tailored to your family
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Shop & cook</h4>
              <p className="text-sm text-gray-600">
                Use your auto-generated grocery list and easy-to-follow recipes
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                4
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Refine & repeat</h4>
              <p className="text-sm text-gray-600">
                Rate meals so future plans get even better
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/signup"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Start Planning
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
          <p>&copy; 2025 Simpler Sundays. Making meal planning simple.</p>
        </div>
      </footer>
    </div>
  );
}
