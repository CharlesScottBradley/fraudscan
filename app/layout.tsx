import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  description: "Minnesota Daycare CCAP Funding Transparency",
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
            <nav className="flex gap-8 text-sm">
              <Link href="/" className="text-gray-400 hover:text-white">
                Leaderboard
              </Link>
              <Link href="/database" className="text-gray-400 hover:text-white">
                Database
              </Link>
            </nav>
          </header>

          <main className="flex-1 px-6 pb-12">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>

          <footer className="py-8 px-6 text-center text-gray-500 text-sm">
            <p>Data sourced from Minnesota DHS Licensing Lookup</p>
            <p className="mt-4 text-gray-400">
              If you have information regarding ongoing fraud, email admin@somaliscan.com
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
