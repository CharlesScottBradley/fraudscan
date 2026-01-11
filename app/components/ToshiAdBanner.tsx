'use client';

import Image from 'next/image';

interface ToshiAdBannerProps {
  className?: string;
}

export default function ToshiAdBanner({ className = '' }: ToshiAdBannerProps) {
  return (
    <div className={`w-full ${className}`}>
      <a
        href="https://toshi.bet/r/mulligann"
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-lg p-5 hover:border-yellow-600/50 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 transition-all group"
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          {/* Text Content - Left Side */}
          <div className="text-center md:text-left">
            <p
              className="text-yellow-400 text-xl md:text-2xl font-black tracking-wide"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              TOSHI BET CASINO
            </p>
            <p className="text-gray-200 mt-1 font-mono text-sm md:text-base tracking-tight">
              Win up to <span className="text-green-400 font-bold">20,000x</span> on slots
            </p>
            <p className="text-gray-500 text-xs md:text-sm italic tracking-wide">
              and support the movement
            </p>
          </div>

          {/* Banner Image - Right Side */}
          <div className="flex-shrink-0">
            <Image
              src="/slots/toshibutton.png"
              alt="Toshi Bet - 200% Deposit Match - Play Now"
              width={500}
              height={90}
              className="rounded shadow-lg group-hover:shadow-yellow-500/30 group-hover:scale-[1.02] transition-all"
              priority
            />
          </div>
        </div>

        {/* Sponsor disclosure */}
        <p className="text-center text-gray-600 text-[10px] mt-3">
          Sponsored | 18+ | Gamble Responsibly
        </p>
      </a>
    </div>
  );
}
