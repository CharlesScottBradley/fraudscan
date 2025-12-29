import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}>
        <div className="min-h-screen flex flex-col">
          <header className="py-6 px-6 flex items-center justify-between max-w-6xl mx-auto w-full">
            <Link href="/" className="text-xl font-bold tracking-tight">
              SomaliScan
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/" className="text-gray-400 hover:text-white">
                Map
              </Link>
              <Link href="/cases" className="text-gray-400 hover:text-white">
                Cases
              </Link>
              <Link href="/database" className="text-gray-400 hover:text-white">
                Database
              </Link>
              <Link href="/donations" className="text-gray-400 hover:text-white">
                Donations
              </Link>
              <Link href="/donations/network" className="text-gray-400 hover:text-white">
                Network
              </Link>
              <Link href="/tip" className="text-green-500 hover:text-green-400">
                Submit Tip
              </Link>
            </nav>
          </header>

          <main className="flex-1 px-6 pb-12">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>

          <footer className="py-8 px-6 text-center text-gray-500 text-sm">
            <p>Data sourced from state licensing databases and court records</p>
            <p className="mt-4 text-gray-400">
              Have information about fraud? <Link href="/tip" className="text-green-500 hover:underline">Submit a tip</Link> or email admin@somaliscan.com
            </p>
            <p className="mt-6 text-gray-600">
              Powered by <a href="https://fruitdatalabs.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">fruitdatalabs.xyz</a>
            </p>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
