'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

// Slot symbols - now using images
const SYMBOL_IMAGES = [
  '/slots/1.png', // Money bag
  '/slots/2.png', // Capitol
  '/slots/3.png', // Medal
  '/slots/4.png', // Eagle
  '/slots/5.png', // Baby
  '/slots/6.png', // Approved
];

// Fallback emojis for loading states
const SYMBOLS = ['💰', '🏛️', '🎖️', '🦅', '👶', '📋'];

// Win outcomes with their probabilities and messages
const OUTCOMES = [
  { id: 'loan', message: 'LOAN APPROVED', probability: 0.30, minWin: 10000, maxWin: 100000, color: 'text-green-400', glowColor: 'shadow-green-500/50' },
  { id: 'tax', message: 'TAX EVADED', probability: 0.25, minWin: 50000, maxWin: 500000, color: 'text-green-500', glowColor: 'shadow-green-500/50' },
  { id: 'walz', message: 'TIM WALZ MEDAL OF HONOR', probability: 0.15, minWin: 100000, maxWin: 1000000, color: 'text-yellow-400', glowColor: 'shadow-yellow-500/50' },
  { id: 'babies', message: '15 AUTISTIC CHILDREN BIRTHED\nREDEEM $1 BILLION', probability: 0.10, minWin: 500000, maxWin: 5000000, color: 'text-pink-400', glowColor: 'shadow-pink-500/50' },
  { id: 'jackpot', message: '10 BILLION DOLLAR\nGRANT APPROVED', probability: 0.05, minWin: 1000000, maxWin: 10000000, color: 'text-yellow-300', glowColor: 'shadow-yellow-400/80', isJackpot: true },
  { id: 'deported', message: 'DEPORTED', probability: 0.15, minWin: 10000, maxWin: 50000, color: 'text-red-500', glowColor: 'shadow-red-500/50', isDeported: true },
];

const BET_AMOUNTS = [1000, 10000, 100000];

// Number of lights around the machine
const LIGHT_COUNT = 24;

function formatMoney(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

function formatLargeMoney(amount: number): string {
  if (amount >= 1000000000000) {
    return `$${(amount / 1000000000000).toFixed(2)}T`;
  }
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(2)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  return formatMoney(amount);
}

function getRandomOutcome() {
  const rand = Math.random();
  let cumulative = 0;
  for (const outcome of OUTCOMES) {
    cumulative += outcome.probability;
    if (rand <= cumulative) {
      return outcome;
    }
  }
  return OUTCOMES[0];
}

function getRandomWinAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Confetti particle component
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const particles: Particle[] = [];

    for (let i = 0; i < 150; i++) {
      particles.push({
        id: i,
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    particlesRef.current = particles;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      // Remove particles that are off screen
      particlesRef.current = particlesRef.current.filter(p => p.y < canvas.height + 50);

      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-40 pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

// Sound icon component
function SoundIcon({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  );
}

export default function DaycareSlotsPage() {
  const [balance, setBalance] = useState(100000);
  const [bet, setBet] = useState(1000);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([0, 0, 0]);
  const [reelOffsets, setReelOffsets] = useState([0, 0, 0]); // For smooth scrolling animation
  const [result, setResult] = useState<typeof OUTCOMES[0] | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showNickShirley, setShowNickShirley] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinnerBanner, setShowWinnerBanner] = useState(false);
  const [totalWaste, setTotalWaste] = useState(247835619284); // Start with a big number
  const [lightPhase, setLightPhase] = useState(0);
  const [reelsGlowing, setReelsGlowing] = useState(false);

  // Animate lights
  useEffect(() => {
    const interval = setInterval(() => {
      setLightPhase(prev => (prev + 1) % LIGHT_COUNT);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Animate total waste ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalWaste(prev => prev + Math.floor(Math.random() * 10000) + 1000);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Load balance from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('daycare-slots-balance');
    if (saved) {
      setBalance(parseInt(saved, 10));
    }
    setHasHydrated(true);
  }, []);

  // Save balance to localStorage
  useEffect(() => {
    if (hasHydrated) {
      localStorage.setItem('daycare-slots-balance', balance.toString());
    }
  }, [balance, hasHydrated]);

  const playSound = useCallback((type: 'spin' | 'win' | 'jackpot' | 'deported') => {
    if (!soundEnabled) return;

    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'spin':
        oscillator.frequency.value = 200;
        oscillator.type = 'square';
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'win':
        oscillator.frequency.value = 523;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'jackpot':
        oscillator.frequency.value = 523;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.45);
        oscillator.stop(audioContext.currentTime + 0.6);
        break;
      case 'deported':
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime + 0.4);
        oscillator.stop(audioContext.currentTime + 0.6);
        break;
    }
  }, [soundEnabled]);

  const spin = useCallback(() => {
    if (spinning) return;

    setSpinning(true);
    setShowResult(false);
    setShowNickShirley(false);
    setShowConfetti(false);
    setShowWinnerBanner(false);
    setReelsGlowing(false);
    playSound('spin');

    // Start smooth scroll animation
    let frame = 0;
    const totalFrames = 60;
    const spinInterval = setInterval(() => {
      frame++;

      // Update offsets for smooth scrolling effect
      setReelOffsets([
        Math.sin(frame * 0.5) * 10,
        Math.sin(frame * 0.5 + 1) * 10,
        Math.sin(frame * 0.5 + 2) * 10,
      ]);

      // Randomly change symbols during spin
      if (frame % 3 === 0) {
        setReels([
          Math.floor(Math.random() * SYMBOL_IMAGES.length),
          Math.floor(Math.random() * SYMBOL_IMAGES.length),
          Math.floor(Math.random() * SYMBOL_IMAGES.length),
        ]);
      }

      if (frame >= totalFrames) {
        clearInterval(spinInterval);
        setReelOffsets([0, 0, 0]);

        // Determine outcome
        const outcome = getRandomOutcome();
        const win = getRandomWinAmount(outcome.minWin, outcome.maxWin);

        // Set final reels (matching symbols for visual effect)
        const finalIndex = outcome.isDeported ? 4 :
                          outcome.isJackpot ? 0 :
                          Math.floor(Math.random() * SYMBOL_IMAGES.length);
        setReels([finalIndex, finalIndex, finalIndex]);

        setResult(outcome);
        setWinAmount(win);
        setBalance(prev => prev + win);

        setTimeout(() => {
          setSpinning(false);
          setReelsGlowing(true);

          if (outcome.isDeported) {
            playSound('deported');
            setShowNickShirley(true);
            setTimeout(() => {
              setShowNickShirley(false);
              setShowResult(true);
              setShowWinnerBanner(true);
            }, 2000);
          } else if (outcome.isJackpot) {
            playSound('jackpot');
            setShowConfetti(true);
            setShowResult(true);
            setShowWinnerBanner(true);
          } else {
            playSound('win');
            setShowResult(true);
            setShowWinnerBanner(true);
          }

          // Turn off glow after a few seconds
          setTimeout(() => {
            setReelsGlowing(false);
            setShowWinnerBanner(false);
          }, 3000);
        }, 300);
      }
    }, 50);
  }, [spinning, playSound]);

  const resetBalance = () => {
    setBalance(100000);
    setShowResult(false);
    setShowWinnerBanner(false);
    setReelsGlowing(false);
  };

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 relative">
      {/* Nick Shirley Jumpscare Overlay */}
      {showNickShirley && (
        <div className="fixed inset-0 z-50 bg-red-900 animate-pulse flex items-center justify-center">
          <div className="text-center animate-bounce">
            <div className="relative w-64 h-64 mx-auto mb-4 rounded-full overflow-hidden border-4 border-red-500">
              <Image
                src="/slots/nick-shirley.png"
                alt="DEPORTED"
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-red-800 text-6xl">
                🚨
              </div>
            </div>
            <h1 className="text-6xl font-black text-white animate-pulse tracking-widest" style={{ fontFamily: 'var(--font-cinzel)' }}>
              DEPORTED
            </h1>
          </div>
        </div>
      )}

      {/* Confetti Canvas */}
      <ConfettiCanvas active={showConfetti} />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="relative w-16 h-16 md:w-20 md:h-20">
            <Image
              src="/slots/toshi-logo.svg"
              alt="Toshi"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>
            TOSHI BET&apos;S DAYCARE SLOTS
          </h1>
          <div className="relative w-16 h-16 md:w-20 md:h-20">
            <Image
              src="/slots/toshi-logo.svg"
              alt="Toshi"
              fill
              className="object-contain"
            />
          </div>
        </div>
        <p className="text-gray-500 text-sm">Sponsored by Your Tax Dollars</p>
      </div>

      {/* Sound Toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 text-gray-400 opacity-50 hover:opacity-100 transition-opacity"
        title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
      >
        <SoundIcon enabled={soundEnabled} />
      </button>

      {/* Total Government Waste Ticker */}
      <div className="mb-6 text-center">
        <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Total Government Waste</div>
        <div className="text-2xl md:text-3xl font-mono text-red-500 tabular-nums">
          {formatLargeMoney(totalWaste)}
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg px-8 py-4 mb-6">
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Government Funding</div>
        <div className="text-3xl font-mono text-green-400">{formatMoney(balance)}</div>
      </div>

      {/* Winner Banner */}
      {showWinnerBanner && (
        <div className="mb-4 relative">
          <div
            className={`px-8 py-3 rounded-lg font-black text-2xl tracking-widest animate-pulse ${
              result?.isJackpot
                ? 'bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-black'
                : result?.isDeported
                ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white'
                : 'bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white'
            }`}
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            {result?.isJackpot ? '🎰 JACKPOT! 🎰' : result?.isDeported ? '🚨 WINNER 🚨' : '✨ WINNER ✨'}
          </div>
        </div>
      )}

      {/* Slot Machine with Casino Lights */}
      <div className="relative">
        {/* Casino Lights Border */}
        <div className="absolute -inset-3 rounded-3xl">
          {[...Array(LIGHT_COUNT)].map((_, i) => {
            const angle = (i / LIGHT_COUNT) * 360;
            const isLit = (i + lightPhase) % 3 === 0 || spinning;
            const colors = ['bg-red-500', 'bg-yellow-400', 'bg-green-500', 'bg-blue-500'];
            const color = colors[i % colors.length];

            return (
              <div
                key={i}
                className={`absolute w-3 h-3 rounded-full transition-all duration-100 ${
                  isLit ? `${color} shadow-lg` : 'bg-gray-700'
                }`}
                style={{
                  left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 52}%)`,
                  top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 52}%)`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: isLit ? `0 0 10px 2px currentColor` : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Main Slot Machine */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-4 border-yellow-600 rounded-2xl p-6 shadow-2xl relative z-10">
          {/* Machine Header with Toshi branding */}
          <div className="flex items-center justify-center gap-2 mb-4 pb-4 border-b border-yellow-600/50">
            <div className="relative w-10 h-10">
              <Image
                src="/slots/toshi-logo.svg"
                alt="Toshi"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-yellow-400 font-bold text-lg tracking-wider" style={{ fontFamily: 'var(--font-cinzel)' }}>
              TOSHI BET GAMING
            </span>
            <div className="relative w-10 h-10">
              <Image
                src="/slots/toshi-logo.svg"
                alt="Toshi"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Reels */}
          <div className="flex gap-2 mb-4">
            {reels.map((symbolIndex, i) => (
              <div
                key={i}
                className={`w-24 h-24 md:w-32 md:h-32 bg-black rounded-lg flex items-center justify-center border-4 overflow-hidden transition-all duration-300 ${
                  reelsGlowing && result
                    ? `border-yellow-400 shadow-lg ${result.glowColor}`
                    : 'border-gray-600 shadow-inner'
                } ${spinning ? 'border-yellow-500' : ''}`}
                style={{
                  transform: `translateY(${reelOffsets[i]}px)`,
                  boxShadow: reelsGlowing && result ? `0 0 20px 5px ${result.isJackpot ? 'rgba(250, 204, 21, 0.5)' : result.isDeported ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'}` : undefined,
                }}
              >
                <div className="relative w-20 h-20 md:w-28 md:h-28">
                  <Image
                    src={SYMBOL_IMAGES[symbolIndex]}
                    alt={SYMBOLS[symbolIndex]}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bet Selector */}
          <div className="flex gap-2 justify-center mb-4">
            {BET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => setBet(amount)}
                disabled={spinning}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  bet === amount
                    ? 'bg-yellow-600 text-black font-bold'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                {formatMoney(amount)}
              </button>
            ))}
          </div>

          {/* Spin Button */}
          <button
            onClick={spin}
            disabled={spinning}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-2xl font-black rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            {spinning ? 'SPINNING...' : 'SPIN'}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {showResult && result && (
        <div className="text-center my-6 animate-fade-in">
          <div className={`text-2xl md:text-4xl font-black mb-2 whitespace-pre-line ${result.color}`} style={{ fontFamily: 'var(--font-cinzel)' }}>
            {result.message}
          </div>
          <div className="text-xl text-green-400 font-mono">
            +{formatMoney(winAmount)}
          </div>
          {result.isDeported && (
            <div className="text-gray-500 text-sm mt-2">(jk you still got the money lol)</div>
          )}
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={resetBalance}
        className="text-gray-600 text-sm hover:text-gray-400 transition-colors mt-4"
      >
        Reset Balance to $100K
      </button>

      {/* Disclaimer for satire game */}
      <div className="mt-8 text-center text-gray-600 text-xs max-w-md">
        <p>This is satire. No real money is involved.</p>
        <p className="mt-1">Fun fact: You always win. Just like real government contractors.</p>
      </div>

      {/* Sponsor Section with Clear Separation */}
      <div className="mt-8 pt-6 border-t border-gray-700 w-full max-w-md">
        <p className="text-gray-500 text-xs text-center mb-3 uppercase tracking-wider">
          Sponsored Content
        </p>

        <a
          href="https://toshi.bet/r/mulligann"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg shadow-lg transition-all hover:scale-105"
        >
          <div className="relative w-8 h-8">
            <Image
              src="/slots/toshi-logo.svg"
              alt="Toshi"
              fill
              className="object-contain"
            />
          </div>
          <span style={{ fontFamily: 'var(--font-cinzel)' }}>SIGN UP FOR A CHANCE TO WIN 1 BTC</span>
        </a>

        <div className="mt-3 text-center text-gray-500 text-[10px]">
          <p>
            <strong>DISCLOSURE:</strong> Affiliate link to third-party crypto casino.
            Real gambling with real money. Must be of legal gambling age.
            Gambling may be illegal in your jurisdiction. Gamble responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}
