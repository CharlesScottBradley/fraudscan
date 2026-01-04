'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavChild {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

interface NavItem {
  label: string;
  href?: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: 'Map', href: '/' },
  {
    label: 'Investigations',
    children: [
      { label: 'Overview', href: '/investigation' },
      { label: 'Cases', href: '/cases' },
      { label: 'MN/OH/WA Analysis', href: '/investigation/mn-oh-wa' },
      { label: 'Address Clusters', href: '/investigation/address-clusters' },
      { label: 'Double Dippers', href: '/investigation/double-dippers' },
    ],
  },
  {
    label: 'Database',
    children: [
      {
        label: 'Organizations',
        href: '/organizations',
        children: [
          { label: 'Childcare Providers', href: '/database' },
          { label: 'HCBS Providers', href: '/hcbs' },
          { label: 'Nursing Homes', href: '/nursing-homes' },
        ],
      },
      { label: 'PPP Loans', href: '/ppp' },
      { label: 'SBA Loans', href: '/sba' },
      { label: 'Government Budgets', href: '/budgets' },
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
  {
    label: 'Crowdsourcing',
    children: [
      { label: 'Data Requests', href: '/crowdsource' },
      { label: 'Bounty Board', href: '/crowdsource/bounties' },
      { label: 'Contributor Leaderboard', href: '/crowdsource/leaderboard' },
      { label: 'Submit Data', href: '/crowdsource/submit' },
    ],
  },
  { label: 'News', href: '/news' },
  {
    label: 'Resources',
    children: [
      { label: 'Data Source Links', href: '/resources/links' },
      { label: 'FOIA Request Generator', href: '/foia' },
      { label: 'District Court Complaint', href: '/lawsuit' },
      { label: 'Grants', href: '/grants' },
      { label: 'Submit a Tip', href: '/tip' },
      { label: 'About', href: '/about' },
      { label: 'API Docs', href: '/api/docs' },
    ],
  },
];

function NavDropdown({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedChild(null);
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
        <div className="absolute top-full left-0 mt-2 py-1 bg-black border border-gray-800 min-w-[200px] z-50 font-mono">
          {item.children?.map((child) => {
            const hasChildren = child.children && child.children.length > 0;
            const isExpanded = expandedChild === child.label;

            if (hasChildren) {
              return (
                <div key={child.label}>
                  <div className="flex items-center px-3 py-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-900/50 text-sm">
                    {child.href ? (
                      <Link
                        href={child.href}
                        onClick={() => setIsOpen(false)}
                        className="flex-1"
                      >
                        <span className="text-gray-600 mr-2">-</span>
                        {child.label}
                      </Link>
                    ) : (
                      <span className="flex-1">
                        <span className="text-gray-600 mr-2">-</span>
                        {child.label}
                      </span>
                    )}
                    <button
                      onClick={() => setExpandedChild(isExpanded ? null : child.label)}
                      className="p-1 hover:text-green-400"
                    >
                      <svg
                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="border-l border-gray-800 ml-4">
                      {child.children?.map((subChild) => (
                        <Link
                          key={subChild.href}
                          href={subChild.href}
                          onClick={() => {
                            setIsOpen(false);
                            setExpandedChild(null);
                          }}
                          className="block px-3 py-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-900/50 text-sm"
                        >
                          <span className="text-gray-600 mr-2">-</span>
                          {subChild.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={child.href || child.label}
                href={child.href || '#'}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-900/50 text-sm"
              >
                <span className="text-gray-600 mr-2">-</span>
                {child.label}
              </Link>
            );
          })}
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
      <div className="fixed right-0 top-0 h-full w-64 bg-black border-l border-gray-800 p-6 overflow-y-auto">
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
            const hasActiveChild = item.children?.some((c) =>
              (c.href && (pathname === c.href || pathname.startsWith(c.href + '/'))) ||
              c.children?.some((sc) => pathname === sc.href || pathname.startsWith(sc.href + '/'))
            );

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
                      const hasSubChildren = child.children && child.children.length > 0;
                      const isSubExpanded = expandedItems.includes(`${item.label}-${child.label}`);
                      const isChildActive = (child.href && (pathname === child.href || pathname.startsWith(child.href + '/'))) ||
                        child.children?.some((sc) => pathname === sc.href || pathname.startsWith(sc.href + '/'));

                      if (hasSubChildren) {
                        return (
                          <div key={child.label}>
                            <div className="flex items-center gap-2">
                              {child.href ? (
                                <Link
                                  href={child.href}
                                  onClick={onClose}
                                  className={`py-1.5 text-sm ${isChildActive ? 'text-white' : 'text-gray-500'} hover:text-white`}
                                >
                                  {child.label}
                                </Link>
                              ) : (
                                <span className={`py-1.5 text-sm ${isChildActive ? 'text-white' : 'text-gray-500'}`}>
                                  {child.label}
                                </span>
                              )}
                              <button
                                onClick={() => toggleExpand(`${item.label}-${child.label}`)}
                                className="text-gray-500 hover:text-white"
                              >
                                <svg
                                  className={`w-3 h-3 transition-transform ${isSubExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                            {isSubExpanded && (
                              <div className="ml-4 flex flex-col gap-1 border-l border-gray-700 pl-4">
                                {child.children?.map((subChild) => {
                                  const isSubChildActive = pathname === subChild.href || pathname.startsWith(subChild.href + '/');
                                  return (
                                    <Link
                                      key={subChild.href}
                                      href={subChild.href}
                                      onClick={onClose}
                                      className={`py-1.5 text-xs ${isSubChildActive ? 'text-white' : 'text-gray-600'} hover:text-white`}
                                    >
                                      {subChild.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={child.href || child.label}
                          href={child.href || '#'}
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
            href="/support"
            onClick={onClose}
            className="mt-4 py-2 px-4 border border-orange-500 text-orange-500 hover:bg-orange-500/10 rounded text-center"
          >
            Support Us
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
    return item.children?.some((c) =>
      (c.href && (pathname === c.href || pathname.startsWith(c.href + '/'))) ||
      c.children?.some((sc) => pathname === sc.href || pathname.startsWith(sc.href + '/'))
    ) ?? false;
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
        <Link 
          href="/support" 
          className="px-4 py-1.5 border border-orange-500 text-orange-500 hover:bg-orange-500/10 rounded text-sm"
        >
          Support Us
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

