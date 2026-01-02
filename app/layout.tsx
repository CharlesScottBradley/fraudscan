import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navigation from "./components/Navigation";
import EmailSignup from "./components/EmailSignup";
import WelcomeBanner from "./components/WelcomeBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["700", "900"],
});

export const metadata: Metadata = {
  title: "SomaliScan",
  description: "Child Care Subsidy Fraud Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} antialiased bg-black text-white`}>
        <WelcomeBanner />
        <div className="min-h-screen flex flex-col">
          <header className="py-6 px-6 flex items-center justify-between max-w-6xl mx-auto w-full">
            <Link href="/" className="text-xl font-bold tracking-tight">
              SomaliScan
            </Link>
            <Navigation />
          </header>

          <main className="flex-1 px-6 pb-12">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>

          <footer className="py-8 px-6 text-center text-sm border-t border-gray-900">
            <div className="max-w-4xl mx-auto">
              {/* Disclaimer */}
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                Data sourced from public records and may contain errors or omissions. This site does not accuse any individual 
                or entity of wrongdoing. Information is provided for research and educational purposes only and should be 
                independently verified before taking any action. Nothing on this site constitutes legal, financial, or 
                professional advice.
              </p>
              
              {/* Links */}
              <div className="flex items-center justify-center gap-4 text-xs text-gray-600 mb-4">
                <Link href="/terms" className="hover:text-gray-400">Terms of Use</Link>
                <span className="text-gray-800">•</span>
                <Link href="/privacy" className="hover:text-gray-400">Privacy Policy</Link>
                <span className="text-gray-800">•</span>
                <Link href="/corrections" className="hover:text-gray-400">Request Correction</Link>
              </div>

              {/* Tip Line */}
              <p className="text-gray-400 mb-4">
                Have information about fraud? <Link href="/tip" className="text-green-500 hover:underline">Submit a tip</Link> or email admin@somaliscan.com
              </p>

              {/* Email Signup */}
              <div className="mb-4">
                <EmailSignup source="footer" variant="inline" />
                <p className="text-gray-600 text-xs mt-2">
                  or follow on <a href="https://beaverdata.substack.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400">Substack</a>
                </p>
              </div>
              
              {/* Attribution */}
              <p className="text-gray-600">
                Powered by <a href="https://fruitdatalabs.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">fruitdatalabs.xyz</a>
              </p>

              {/* Token */}
              <p className="text-gray-700 text-xs mt-4">
                CA: <a href="https://pump.fun/coin/9NrkmoqwF1rBjsfKZvn7ngCy6zqvb8A6A5RfTvR2pump" target="_blank" rel="noopener noreferrer" className="font-mono hover:text-gray-500">9NrkmoqwF1rBjsfKZvn7ngCy6zqvb8A6A5RfTvR2pump</a>
              </p>
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
