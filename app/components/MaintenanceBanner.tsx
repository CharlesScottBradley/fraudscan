"use client";

import { useState } from "react";

export default function MaintenanceBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mx-4 max-w-2xl animate-pulse-slow">
        {/* Glowing border effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl blur-sm opacity-75 animate-pulse"></div>
        
        {/* Main content */}
        <div className="relative bg-gray-900 border-2 border-yellow-500 rounded-2xl p-8 text-center">
          {/* Warning icon */}
          <div className="flex justify-center mb-4">
            <svg className="w-20 h-20 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Construction icon */}
          <div className="text-6xl mb-4">🚧</div>

          {/* Main text */}
          <h2 className="text-3xl md:text-4xl font-black text-yellow-400 mb-4 tracking-tight uppercase">
            Database Under Construction
          </h2>

          {/* Time */}
          <div className="bg-black/50 rounded-xl py-4 px-6 mb-6 inline-block">
            <p className="text-2xl md:text-3xl font-mono font-bold text-white">
              11:00 AM - 12:30 PM EST
            </p>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-lg mb-6">
            We&apos;re performing scheduled maintenance. Some features may be temporarily unavailable.
          </p>

          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-colors text-lg"
          >
            I Understand, Continue to Site
          </button>
        </div>
      </div>
    </div>
  );
}

