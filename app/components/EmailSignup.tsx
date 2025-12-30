'use client';

import { useState } from 'react';

interface EmailSignupProps {
  source: string;
  variant?: 'inline' | 'terminal' | 'block';
  label?: string;
}

export default function EmailSignup({ 
  source, 
  variant = 'inline',
  label = 'Get updates'
}: EmailSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe');
        return;
      }

      setStatus('success');
      if (data.already_subscribed) {
        setMessage('Already subscribed');
      } else if (data.resubscribed) {
        setMessage('Resubscribed');
      } else {
        setMessage('Subscribed');
      }
      setEmail('');

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    } catch {
      setStatus('error');
      setMessage('Network error');
    }
  };

  // Inline variant - horizontal, for footer
  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex items-center justify-center gap-2">
        <span className="text-gray-500 text-sm">{label}:</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={status === 'loading'}
          className="bg-transparent border border-gray-800 rounded px-3 py-1 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 w-48 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          className="text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:hover:text-gray-400"
        >
          {status === 'loading' ? '...' : status === 'success' ? message : 'Subscribe'}
        </button>
        {status === 'error' && (
          <span className="text-red-500 text-xs">{message}</span>
        )}
      </form>
    );
  }

  // Terminal variant - with tree chars, for homepage
  if (variant === 'terminal') {
    return (
      <div className="font-mono text-sm">
        <p className="text-gray-500">UPDATES</p>
        <div className="mt-2 text-gray-400">
          <p>
            <span className="text-gray-600">├─</span> {label}
          </p>
          <form onSubmit={handleSubmit} className="mt-2">
            <p className="flex items-center gap-2">
              <span className="text-gray-600">└─</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
                disabled={status === 'loading'}
                className="bg-transparent border-b border-gray-700 px-1 py-0.5 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 w-48 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="text-gray-500 hover:text-white disabled:opacity-50"
              >
                {status === 'loading' ? '[...]' : status === 'success' ? `[${message}]` : '[subscribe]'}
              </button>
              {status === 'error' && (
                <span className="text-red-500 text-xs">{message}</span>
              )}
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Block variant - full section, for about/state pages
  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4 text-white">{label}</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={status === 'loading'}
          className="bg-transparent border border-gray-800 rounded px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 w-64 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          className="px-4 py-2 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded disabled:opacity-50 disabled:hover:text-gray-400 disabled:hover:border-gray-700"
        >
          {status === 'loading' ? '...' : status === 'success' ? message : 'Subscribe'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-red-500 text-sm mt-2">{message}</p>
      )}
    </div>
  );
}

