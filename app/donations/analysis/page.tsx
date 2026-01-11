import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ToshiAdBanner from '../../components/ToshiAdBanner';

interface ChildcareDonor {
  employer_name: string;
  total_donated: number;
  donation_count: number;
  unique_donors: number;
  unique_recipients: number;
}

interface DonationRecipient {
  recipient_name: string;
  recipient_type: string;
  total_received: number;
  donation_count: number;
  unique_donors: number;
}

interface PPPLoan {
  borrower_name: string;
  total_ppp: number;
  total_forgiven: number;
  jobs_reported: number;
}

async function getChildcareDonors(): Promise<ChildcareDonor[]> {
  const { data } = await supabase.rpc('get_childcare_donors');
  return (data || []).map((d: { employer_name: string; total_donated: string; donation_count: number; unique_donors: number; unique_recipients: number }) => ({
    employer_name: d.employer_name,
    total_donated: parseFloat(d.total_donated) || 0,
    donation_count: d.donation_count,
    unique_donors: d.unique_donors,
    unique_recipients: d.unique_recipients,
  }));
}

async function getDonationRecipients(): Promise<DonationRecipient[]> {
  const { data } = await supabase.rpc('get_childcare_donation_recipients');
  return (data || []).map((d: { recipient_name: string; recipient_type: string; total_received: string; donation_count: number; unique_donors: number }) => ({
    recipient_name: d.recipient_name,
    recipient_type: d.recipient_type,
    total_received: parseFloat(d.total_received) || 0,
    donation_count: d.donation_count,
    unique_donors: d.unique_donors,
  }));
}

async function getPPPLoans(): Promise<PPPLoan[]> {
  const { data } = await supabase
    .from('ppp_loans')
    .select('borrower_name, current_approval_amount, forgiveness_amount, jobs_reported')
    .order('current_approval_amount', { ascending: false })
    .limit(30);

  // Aggregate by borrower name
  const aggregated: Record<string, PPPLoan> = {};
  (data || []).forEach((d: { borrower_name: string; current_approval_amount: number; forgiveness_amount: number; jobs_reported: number }) => {
    const name = d.borrower_name.replace(/[,.]|(INC|LLC|CORP)\.?/gi, '').trim().toUpperCase();
    if (!aggregated[name]) {
      aggregated[name] = {
        borrower_name: d.borrower_name,
        total_ppp: 0,
        total_forgiven: 0,
        jobs_reported: 0,
      };
    }
    aggregated[name].total_ppp += d.current_approval_amount || 0;
    aggregated[name].total_forgiven += d.forgiveness_amount || 0;
    aggregated[name].jobs_reported += d.jobs_reported || 0;
  });

  return Object.values(aggregated).sort((a, b) => b.total_ppp - a.total_ppp);
}

async function getNetworkStats() {
  const { data: pppTotals } = await supabase
    .from('ppp_loans')
    .select('current_approval_amount, forgiveness_amount, jobs_reported');

  const { data: donationTotals } = await supabase.rpc('get_childcare_donors');

  const totalPPP = (pppTotals || []).reduce((sum, d) => sum + (d.current_approval_amount || 0), 0);
  const totalForgiven = (pppTotals || []).reduce((sum, d) => sum + (d.forgiveness_amount || 0), 0);
  const totalJobs = (pppTotals || []).reduce((sum, d) => sum + (d.jobs_reported || 0), 0);
  const totalDonated = (donationTotals || []).reduce((sum: number, d: { total_donated: string }) => sum + parseFloat(d.total_donated), 0);

  return { totalPPP, totalForgiven, totalJobs, totalDonated };
}

export const revalidate = 60;

function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function getRecipientTypeLabel(type: string): string {
  switch (type) {
    case 'PCC': return 'Candidate';
    case 'PTU': return 'Party';
    case 'PCF': return 'Committee';
    default: return type || 'Other';
  }
}

export default async function AnalysisPage() {
  const [donors, recipients, pppLoans, stats] = await Promise.all([
    getChildcareDonors(),
    getDonationRecipients(),
    getPPPLoans(),
    getNetworkStats(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Funding Network Analysis</h1>
            <p className="text-gray-500">Connections between government-funded childcare providers and political donations</p>
          </div>
          <div className="flex gap-4">
            <Link href="/donations/network" className="text-green-500 hover:text-green-400 text-sm">
              Interactive Explorer →
            </Link>
            <Link href="/donations" className="text-gray-400 hover:text-white text-sm">
              ← Back to donations
            </Link>
          </div>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 p-6 border border-yellow-800 bg-yellow-950/20">
        <div>
          <p className="text-yellow-500 font-mono text-3xl font-bold">
            {formatMoney(stats.totalPPP)}
          </p>
          <p className="text-gray-500 mt-1">PPP loans to MN childcare</p>
        </div>
        <div>
          <p className="text-green-500 font-mono text-3xl font-bold">
            {formatMoney(stats.totalForgiven)}
          </p>
          <p className="text-gray-500 mt-1">Loans forgiven</p>
        </div>
        <div>
          <p className="text-red-500 font-mono text-3xl font-bold">
            {formatMoney(stats.totalDonated)}
          </p>
          <p className="text-gray-500 mt-1">Political donations from childcare</p>
        </div>
        <div>
          <p className="text-white font-mono text-3xl font-bold">
            {stats.totalJobs.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Jobs reported (PPP)</p>
        </div>
      </div>

      {/* Key Finding Box */}
      <div className="mb-12 p-6 border border-red-800 bg-red-950/20">
        <h2 className="text-lg font-bold text-red-400 mb-3">Key Finding: New Horizon Academy / Kids Quest</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-mono font-bold text-yellow-500">$2.5M+</p>
            <p className="text-gray-400 text-sm">PPP loans received (fully forgiven)</p>
          </div>
          <div>
            <p className="text-3xl font-mono font-bold text-red-500">$241K</p>
            <p className="text-gray-400 text-sm">Political donations (119 donations)</p>
          </div>
          <div>
            <p className="text-3xl font-mono font-bold text-white">80+</p>
            <p className="text-gray-400 text-sm">Licensed locations in Minnesota</p>
          </div>
        </div>
        <p className="mt-4 text-gray-400 text-sm">
          The Dunkley family (owners) and employees donated primarily to HRCC (House Republican Campaign Committee).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Childcare Entities That Donated */}
        <div>
          <h2 className="text-lg font-bold mb-4">Childcare Industry Donors</h2>
          <p className="text-gray-500 text-sm mb-4">Companies/organizations in childcare that made political donations</p>
          <div className="border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="p-3 font-normal">Entity</th>
                  <th className="p-3 font-normal text-right">Donated</th>
                  <th className="p-3 font-normal text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((donor) => (
                  <tr key={donor.employer_name} className="border-b border-gray-900 hover:bg-gray-950">
                    <td className="p-3">
                      {donor.employer_name}
                      <span className="block text-xs text-gray-500">
                        {donor.unique_donors} donors → {donor.unique_recipients} recipients
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-red-500">
                      {formatMoney(donor.total_donated)}
                    </td>
                    <td className="p-3 text-right text-gray-400">
                      {donor.donation_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Political Recipients */}
        <div>
          <h2 className="text-lg font-bold mb-4">Top Political Recipients</h2>
          <p className="text-gray-500 text-sm mb-4">Politicians/committees receiving childcare industry donations</p>
          <div className="border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="p-3 font-normal">Recipient</th>
                  <th className="p-3 font-normal">Type</th>
                  <th className="p-3 font-normal text-right">Received</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => (
                  <tr key={recipient.recipient_name} className="border-b border-gray-900 hover:bg-gray-950">
                    <td className="p-3">
                      <Link
                        href={`/donations/recipient/${encodeURIComponent(recipient.recipient_name)}`}
                        className="hover:underline"
                      >
                        {recipient.recipient_name}
                      </Link>
                      <span className="block text-xs text-gray-500">
                        {recipient.unique_donors} childcare donors
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-gray-800 text-xs">
                        {getRecipientTypeLabel(recipient.recipient_type)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(recipient.total_received)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PPP Loans Section */}
      <div className="mb-12">
        <h2 className="text-lg font-bold mb-4">Top PPP Loan Recipients (MN Childcare)</h2>
        <p className="text-gray-500 text-sm mb-4">
          Childcare businesses that received Paycheck Protection Program loans during COVID-19.
          NAICS code 624410 (Child Day Care Services).
        </p>
        <div className="border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="p-3 font-normal">Business</th>
                <th className="p-3 font-normal text-right">PPP Approved</th>
                <th className="p-3 font-normal text-right">Forgiven</th>
                <th className="p-3 font-normal text-right">Jobs</th>
              </tr>
            </thead>
            <tbody>
              {pppLoans.slice(0, 20).map((loan, idx) => (
                <tr key={`${loan.borrower_name}-${idx}`} className="border-b border-gray-900 hover:bg-gray-950">
                  <td className="p-3">{loan.borrower_name}</td>
                  <td className="p-3 text-right font-mono text-yellow-500">
                    {formatMoney(loan.total_ppp)}
                  </td>
                  <td className="p-3 text-right font-mono text-green-500">
                    {formatMoney(loan.total_forgiven)}
                  </td>
                  <td className="p-3 text-right text-gray-400">
                    {loan.jobs_reported.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Sources */}
      <div className="text-sm text-gray-500 border-t border-gray-800 pt-8">
        <p className="font-medium text-gray-400 mb-2">Data Sources</p>
        <ul className="space-y-1">
          <li>
            <span className="text-white">Political Donations</span>
            <span className="text-gray-600"> — Minnesota Campaign Finance Board (cfb.mn.gov)</span>
          </li>
          <li>
            <span className="text-white">PPP Loans</span>
            <span className="text-gray-600"> — U.S. Small Business Administration (sba.gov/ppp-data)</span>
          </li>
          <li>
            <span className="text-white">Provider Licensing</span>
            <span className="text-gray-600"> — Minnesota DHS Licensing Lookup</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
