'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed');
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('welcomeBannerDismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="border-b border-gray-800">
      {/* Development Banner */}
      <div className="bg-gray-900 py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center relative">
          <p className="text-sm text-gray-400 text-center flex items-center gap-2 justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-blue-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            This site is under active development. Data coverage is expanding hourly.
          </p>
          <button
            onClick={dismiss}
            className="absolute right-0 text-gray-600 hover:text-gray-400 p-1"
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Sponsor Banner */}
      <Link
        href="/daycareslots"
        className="block bg-gradient-to-r from-yellow-600/20 via-yellow-500/30 to-yellow-600/20 py-1.5 px-4 hover:from-yellow-600/30 hover:via-yellow-500/40 hover:to-yellow-600/30 transition-all"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <div className="relative w-5 h-5">
            <Image
              src="/slots/toshi-logo.svg"
              alt="Toshi"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-xs text-yellow-400 font-semibold tracking-wide">
            SPONSORED BY TOSHI BET — TRY THE DAYCARE SLOTS
          </span>
          <div className="relative w-5 h-5">
            <Image
              src="/slots/toshi-logo.svg"
              alt="Toshi"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}

