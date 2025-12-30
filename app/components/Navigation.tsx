'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: 'Map', href: '/' },
  { label: 'Cases', href: '/cases' },
  {
    label: 'Database',
    children: [
      { label: 'Childcare Providers', href: '/database' },
      { label: 'HCBS Providers', href: '/hcbs' },
      { label: 'PPP Loans', href: '/ppp' },
      { label: 'Nursing Homes', href: '/nursing-homes' },
      { label: 'Improper Payments', href: '/improper-payments' },
    ],
  },
  {
    label: 'Political',
    children: [
      { label: 'Politicians', href: '/politicians' },
      { label: 'Donations', href: '/donations' },
      { label: 'Leaderboard', href: '/leaderboard' },
      { label: 'Network', href: '/donations/network' },
    ],
  },
  { label: 'News', href: '/news' },
  {
    label: 'Resources',
    children: [
      { label: 'FOIA Request Generator', href: '/foia' },
      { label: 'About', href: '/about' },
      { label: 'API Docs', href: '/api/docs' },
    ],
  },
];

function NavDropdown({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 ${isActive ? 'text-white' : 'text-gray-400'} hover:text-white`}
      >
        {item.label}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 py-2 bg-gray-900 border border-gray-800 rounded min-w-[180px] z-50">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      
      {/* Slide-out menu */}
      <div className="fixed right-0 top-0 h-full w-64 bg-black border-l border-gray-800 p-6">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <nav className="mt-12 flex flex-col gap-2">
          {navItems.map((item) => {
            if (item.href) {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`py-2 ${isActive ? 'text-white' : 'text-gray-400'} hover:text-white`}
                >
                  {item.label}
                </Link>
              );
            }

            const isExpanded = expandedItems.includes(item.label);
            const hasActiveChild = item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex items-center justify-between py-2 ${hasActiveChild ? 'text-white' : 'text-gray-400'} hover:text-white`}
                >
                  {item.label}
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="ml-4 flex flex-col gap-1 border-l border-gray-800 pl-4">
                    {item.children?.map((child) => {
                      const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={`py-1.5 text-sm ${isChildActive ? 'text-white' : 'text-gray-500'} hover:text-white`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <Link
            href="/tip"
            onClick={onClose}
            className="mt-4 py-2 text-green-500 hover:text-green-400"
          >
            Submit Tip
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isItemActive = (item: NavItem): boolean => {
    if (item.href) {
      return pathname === item.href;
    }
    return item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/')) ?? false;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex gap-6 text-sm">
        {navItems.map((item) => {
          const isActive = isItemActive(item);

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${isActive ? 'text-white' : 'text-gray-400'} hover:text-white`}
              >
                {item.label}
              </Link>
            );
          }

          return <NavDropdown key={item.label} item={item} isActive={isActive} />;
        })}
        <Link href="/tip" className="text-green-500 hover:text-green-400">
          Submit Tip
        </Link>
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden text-gray-400 hover:text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

