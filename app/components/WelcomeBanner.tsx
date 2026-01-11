'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function WelcomeBanner() {
  const [devBannerVisible, setDevBannerVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed');
    if (!dismissed) {
      setDevBannerVisible(true);
    }
  }, []);

  const dismissDevBanner = () => {
    localStorage.setItem('welcomeBannerDismissed', 'true');
    setDevBannerVisible(false);
  };

  return (
    <div className="border-b border-gray-800">
      {/* Development Banner - Dismissible */}
      {devBannerVisible && (
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
              onClick={dismissDevBanner}
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
      )}

      {/* Toshi Sponsor Banner - Marquee Scroll */}
      <a
        href="https://toshi.bet/r/mulligann"
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block bg-gradient-to-r from-yellow-900/30 via-yellow-600/20 to-yellow-900/30 py-1.5 overflow-hidden"
      >
        <div className="animate-marquee flex whitespace-nowrap">
          {/* Two identical content blocks for seamless loop */}
          {[0, 1].map((groupIdx) => (
            <div key={groupIdx} className="flex shrink-0">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-6 px-8">
                  <div className="relative w-5 h-5 flex-shrink-0">
                    <Image
                      src="/slots/toshi-logo.svg"
                      alt=""
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-yellow-400 font-bold text-sm tracking-wide">
                    TOSHI.BET — 200% DEPOSIT MATCH
                  </span>
                  <span className="text-yellow-500/80 text-sm">
                    WIN UP TO 20,000x
                  </span>
                  <span className="text-green-400 font-bold text-sm">
                    PLAY NOW →
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </a>
    </div>
  );
}

