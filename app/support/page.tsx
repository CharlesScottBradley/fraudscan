'use client';

import Link from 'next/link';

// Metadata must be in a separate layout.tsx for client components
// export const metadata = {
//   title: 'Support | SomaliScan',
//   description: 'Support the investigation with crypto or free contributions',
// };

const WALLET_ADDRESSES = {
  btc: 'bc1q0m8mcmdn4wqm95sh2uur35z86wmyxf4m3pze6y',
  eth: '0x972FD29E7cE2b163a2efbA35D62D8d5D7216d644',
  sol: 'DK9mWzDBcHf6VKVuVP12LUowerBfxfsNvQAcLyUG7WZQ',
};

export default function SupportPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        Back to Home
      </Link>

      <h1 className="text-2xl font-bold mb-2">Support the Investigation</h1>
      <p className="text-gray-400 mb-8">
        This site tracks government fraud using public records. Infrastructure and AI costs run approximately $8,600 per month.
      </p>

      {/* Why Crypto */}
      <div className="bg-gray-900/50 border border-gray-800 p-4 mb-10 text-sm space-y-3">
        <p className="text-gray-300">
          I would like to add GoFundMe or PayPal, but I do not want to put my personal finances at risk. 
          Given the nature of this site, debanking or payment processor shutdowns are a real concern. 
          Crypto is the safest avenue for now.
        </p>
        <p className="text-gray-300">
          SomaliScan started as a joke and turned into my full-time job, 18 hours a day. 
          Donations allow me to keep doing this work. My goal is to save what is left of our country, 
          and I think this site can be instrumental in restoring what the locusts have eaten.
        </p>
        <p className="text-gray-500 text-xs mt-4">
          This is not a nonprofit. Contributions are not tax-deductible and do not constitute payment for specific services.
        </p>
      </div>

      {/* Crypto Section */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Crypto
        </h2>
        
        <div className="space-y-6">
          {/* Bitcoin */}
          <div className="border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white font-medium">Bitcoin</span>
              <span className="text-gray-600 text-sm">BTC</span>
            </div>
            <div className="font-mono text-sm text-gray-400 break-all bg-black p-3 border border-gray-800">
              {WALLET_ADDRESSES.btc}
            </div>
            <button 
              className="mt-2 text-xs text-gray-500 hover:text-white"
              onClick={() => navigator.clipboard.writeText(WALLET_ADDRESSES.btc)}
            >
              Copy address
            </button>
          </div>

          {/* Ethereum */}
          <div className="border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white font-medium">Ethereum</span>
              <span className="text-gray-600 text-sm">ETH / USDC / USDT</span>
            </div>
            <div className="font-mono text-sm text-gray-400 break-all bg-black p-3 border border-gray-800">
              {WALLET_ADDRESSES.eth}
            </div>
            <button 
              className="mt-2 text-xs text-gray-500 hover:text-white"
              onClick={() => navigator.clipboard.writeText(WALLET_ADDRESSES.eth)}
            >
              Copy address
            </button>
          </div>

          {/* Solana */}
          <div className="border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white font-medium">Solana</span>
              <span className="text-gray-600 text-sm">SOL</span>
            </div>
            <div className="font-mono text-sm text-gray-400 break-all bg-black p-3 border border-gray-800">
              {WALLET_ADDRESSES.sol}
            </div>
            <button 
              className="mt-2 text-xs text-gray-500 hover:text-white"
              onClick={() => navigator.clipboard.writeText(WALLET_ADDRESSES.sol)}
            >
              Copy address
            </button>
          </div>
        </div>
      </section>

      {/* Community Token */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Community Token
        </h2>

        <div className="border border-purple-900/50 bg-purple-950/20 rounded-lg p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔍</span>
            <div>
              <p className="text-white font-medium">SomaliScan Community Token</p>
              <p className="text-gray-500 text-xs">Solana • pump.fun</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            A portion of trading fees from this community token help fund site operations and accountability initiatives.
          </p>
          <a
            href="https://pump.fun/coin/9NrkmoqwF1rBjsfKZvn7ngCy6zqvb8A6A5RfTvR2pump"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-purple-900/30 border border-purple-800 rounded text-purple-300 text-sm hover:bg-purple-900/50 transition-colors"
          >
            View Token
          </a>
        </div>

        {/* Crypto Disclaimer */}
        <div className="border border-red-900/30 bg-red-950/10 rounded p-4 text-xs text-red-200/70 space-y-2">
          <p className="text-red-300 font-medium">Cryptocurrency Disclaimer</p>
          <ul className="list-disc list-inside space-y-1 text-red-200/60">
            <li>This is a <strong>meme token with no intrinsic value</strong>. Expect to lose 100% of any funds used to purchase.</li>
            <li>This is <strong>not an investment</strong>. There is no expectation of profit. No promises are made about token value.</li>
            <li>SomaliScan does not control the token price, liquidity, or trading activity.</li>
            <li>Cryptocurrency is volatile, unregulated, and high-risk. Do your own research.</li>
            <li>Nothing on this page constitutes financial advice or a solicitation to buy securities.</li>
          </ul>
        </div>
      </section>

      {/* Cost Breakdown */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Where Funds Go
        </h2>
        
        <div className="font-mono text-sm">
          <div className="text-gray-400 space-y-1">
            <p>
              <span className="text-gray-600">├─</span> compute (crons, analytics)
              <span className="text-green-500 ml-4">$3,000/mo</span>
            </p>
            <p>
              <span className="text-gray-600">├─</span> database
              <span className="text-green-500 ml-4">$1,200/mo</span>
            </p>
            <p>
              <span className="text-gray-600">├─</span> apis (geocoding, data)
              <span className="text-green-500 ml-4">$1,200/mo</span>
            </p>
            <p>
              <span className="text-gray-600">├─</span> hosting
              <span className="text-green-500 ml-4">$200/mo</span>
            </p>
            <p>
              <span className="text-gray-600">└─</span> agent analysis (Opus 4.5)
              <span className="text-green-500 ml-4">~$100/day</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800">
            <p className="text-gray-400">
              total monthly
              <span className="text-green-500 ml-4">~$8,600/mo</span>
            </p>
          </div>
        </div>
      </section>

      {/* Free Ways to Help */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Free Ways to Help
        </h2>

        <div className="space-y-6 text-sm">
          <div>
            <h3 className="text-white font-medium mb-1">Share This Site</h3>
            <p className="text-gray-400 mb-2">
              Post on social media, forward to journalists, or share with anyone who cares about government accountability.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://twitter.com/intent/tweet?text=Tracking%20government%20fraud%20with%20public%20records&url=https://somaliscan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white"
              >
                Share on X
              </a>
              <button 
                className="text-gray-500 hover:text-white"
                onClick={() => navigator.clipboard.writeText('https://somaliscan.com')}
              >
                Copy Link
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-white font-medium mb-1">File a FOIA Request</h3>
            <p className="text-gray-400 mb-2">
              Request public records from your county or state. The data you receive can be added to the site.
            </p>
            <Link href="/foia" className="text-gray-500 hover:text-white">
              FOIA Request Generator
            </Link>
          </div>

          <div>
            <h3 className="text-white font-medium mb-1">Submit a Tip</h3>
            <p className="text-gray-400 mb-2">
              Know about fraud, waste, or abuse? Have documents or evidence? Anonymous tips accepted.
            </p>
            <Link href="/tip" className="text-gray-500 hover:text-white">
              Submit a Tip
            </Link>
          </div>

          <div>
            <h3 className="text-white font-medium mb-1">Report Data Errors</h3>
            <p className="text-gray-400 mb-2">
              Found incorrect information? Help maintain data accuracy by submitting a correction.
            </p>
            <Link href="/corrections" className="text-gray-500 hover:text-white">
              Request Correction
            </Link>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Bounty Board
        </h2>
        <p className="text-gray-500 text-sm">
          Coming soon: Request specific features or data. Top contributors get priority.
        </p>
      </section>

      {/* Footer Navigation */}
      <div className="mt-12 pt-8 border-t border-gray-800 flex gap-6 text-sm">
        <Link href="/terms" className="text-gray-500 hover:text-white">Terms of Use</Link>
        <Link href="/privacy" className="text-gray-500 hover:text-white">Privacy Policy</Link>
        <Link href="/" className="text-gray-500 hover:text-white">Back to Home</Link>
      </div>
    </div>
  );
}

