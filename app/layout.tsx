import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navigation from "./components/Navigation";

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
