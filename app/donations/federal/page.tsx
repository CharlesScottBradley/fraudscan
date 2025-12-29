import Link from 'next/link';

export default function FederalDonationsPage() {
  return (
    <div>
      <div className="mb-2">
        <Link href="/donations" className="text-gray-500 hover:text-white text-sm">
          &larr; Back to donations
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Federal Donations</h1>
        <p className="text-gray-500">FEC data for Senate, House, and Presidential races</p>
      </div>

      <div className="border border-gray-800 p-8 text-center">
        <p className="text-gray-400 text-lg mb-4">Coming Soon</p>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Federal campaign finance data from the FEC will be available here.
          This will include contributions to U.S. Senate, House of Representatives,
          and Presidential campaigns.
        </p>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>Source: <a href="https://www.fec.gov/data/" className="underline hover:text-gray-300" target="_blank" rel="noopener">Federal Election Commission</a></p>
      </div>
    </div>
  );
}
