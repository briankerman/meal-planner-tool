import Link from 'next/link';
import Header from '@/components/marketing/Header';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-simpler-green-50 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Our Story
          </h1>
          <p className="text-xl text-gray-600">
            Built by a parent, for parents. Because your weekends deserve better
            than spreadsheets and stress.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            It started with a Sunday morning
          </h2>
          <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
            <p>
              Every weekend, I&apos;d watch my wife spend an hour &mdash; sometimes more &mdash;
              planning out our meals for the week. She&apos;d sit at the kitchen table with
              her phone, a notepad, and a calculator, working through the same exhausting
              routine.
            </p>
            <p>
              What are we eating this week? Write it all down. Now figure out the grocery
              list. How many chicken breasts do we actually need if we&apos;re making two
              different recipes? Do we have enough rice? What will our 2-year-old
              actually eat? Cross-reference the recipes. Do the math. Start the list over
              because something doesn&apos;t work.
            </p>
            <p>
              That was an hour of her weekend &mdash; every single week. An hour away from
              the family. An hour away from relaxing. An hour she&apos;ll never get back,
              spent on something that felt like it should be simpler.
            </p>
            <p>
              So I set out to build her a tool that cuts right through all of it. No more
              Google Sheets. No more notes scattered across her phone. No more scrolling
              through TikTok hoping to stumble on a recipe that works. Just a meal plan
              at the click of a button.
            </p>
            <p className="text-gray-900 font-medium">
              That tool became Simpler Sundays.
            </p>
          </div>

          {/* Image placeholder */}
          <div className="mt-12 bg-simpler-green-50 rounded-xl h-64 flex items-center justify-center border-2 border-dashed border-simpler-green-200">
            <p className="text-simpler-green-400 font-medium">Photo placeholder</p>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="bg-simpler-green-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            The Problem &amp; Our Solution
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Problem */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">The weekly grind</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">&#8226;</span>
                  An hour every weekend buried in meal planning
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">&#8226;</span>
                  Juggling Google Sheets, phone notes, and recipe apps
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">&#8226;</span>
                  Doing math to figure out grocery quantities
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">&#8226;</span>
                  Scrolling TikTok and Pinterest for recipe ideas
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">&#8226;</span>
                  Guessing what the kids will actually eat
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-simpler-green-100 text-simpler-green-600 rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">One click, done</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-simpler-green-500 mt-1">&#8226;</span>
                  A full week of meals generated in seconds
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-simpler-green-500 mt-1">&#8226;</span>
                  Grocery list built automatically &mdash; quantities included
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-simpler-green-500 mt-1">&#8226;</span>
                  Plans tailored to your family&apos;s real preferences
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-simpler-green-500 mt-1">&#8226;</span>
                  Kid-friendly options baked in from the start
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-simpler-green-500 mt-1">&#8226;</span>
                  Gets smarter the more you use it
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why We&apos;re Different
          </h2>
          <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
            <p>
              There are a lot of meal planning tools out there. Most of them are built
              around the same idea: count your macros, track your calories, hit your
              protein goals. They&apos;re stressful by design &mdash; one more thing to
              optimize, one more number to obsess over.
            </p>
            <p>
              That&apos;s not what Simpler Sundays is about.
            </p>
            <p>
              We&apos;re not here to help you cut weight or prep for a competition.
              We&apos;re here to give you your time back. This is a tool built for
              <strong> real, everyday people and parents</strong> &mdash; not bodybuilders.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6 rounded-xl bg-simpler-green-50">
              <div className="text-3xl mb-3">&#9201;</div>
              <h4 className="font-semibold text-gray-900 mb-2">Time-focused</h4>
              <p className="text-sm text-gray-600">
                We measure success in hours saved, not calories counted
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-simpler-green-50">
              <div className="text-3xl mb-3">&#128106;</div>
              <h4 className="font-semibold text-gray-900 mb-2">Family-focused</h4>
              <p className="text-sm text-gray-600">
                Plans that work for the whole household, picky eaters included
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-simpler-green-50">
              <div className="text-3xl mb-3">&#10024;</div>
              <h4 className="font-semibold text-gray-900 mb-2">Stress-free</h4>
              <p className="text-sm text-gray-600">
                No macros, no calorie tracking, no guilt &mdash; just good meals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-simpler-green-600 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get your weekends back?
          </h2>
          <p className="text-simpler-green-100 text-lg mb-8">
            Join families who&apos;ve made meal planning the easiest part of their week.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-simpler-green-700 font-semibold rounded-lg hover:bg-simpler-green-50 transition text-lg shadow-lg"
          >
            Start Planning
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
          <p>&copy; 2025 Simpler Sundays. Making meal planning simple.</p>
        </div>
      </footer>
    </div>
  );
}
