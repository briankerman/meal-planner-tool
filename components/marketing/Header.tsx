'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="py-4 px-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <img
            src="/images/simplersundayswordmark.png"
            alt="Simpler Sundays Logo"
            className="h-16 w-auto"
          />
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/about"
            className={`font-medium transition ${
              pathname === '/about'
                ? 'text-simpler-green-600'
                : 'text-gray-600 hover:text-simpler-green-600'
            }`}
          >
            About
          </Link>
          <Link
            href="/login"
            className="text-simpler-green-600 hover:text-simpler-green-700 font-medium transition"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
