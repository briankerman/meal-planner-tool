'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  onSignOut: () => void;
  onGroceryListClick?: () => void;
}

const navItems = [
  { name: 'Weekly Plan', href: '/dashboard', icon: 'calendar' },
  { name: 'Grocery List', href: '#grocery', icon: 'shopping-cart', isAction: true },
  { name: 'My Cookbook', href: '/cookbook', icon: 'book' },
  { name: 'Meal History', href: '/history', icon: 'clock' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
];

export default function Sidebar({ onSignOut, onGroceryListClick }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '#grocery') return false;
    return pathname === href;
  };

  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    if (item.isAction && onGroceryListClick) {
      e.preventDefault();
      onGroceryListClick();
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard">
          <img
            src="/images/simplersundayswordmark.png"
            alt="Simpler Sundays"
            className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <a
              key={item.name}
              href={item.isAction ? '#' : item.href}
              onClick={(e) => handleNavClick(item, e)}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'bg-simpler-green-50 text-simpler-green-600 border-r-2 border-simpler-green-400'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.icon === 'calendar' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {item.icon === 'shopping-cart' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
              {item.icon === 'book' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )}
              {item.icon === 'clock' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {item.icon === 'settings' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {item.name}
            </a>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-6 border-t border-gray-100">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors w-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
