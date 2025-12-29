import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Case {
  id: string;
  case_number: string;
  case_name: string;
  court: string | null;
  district: string | null;
  state: string | null;
  fraud_type: string | null;
  fraud_types: string[] | null;
  total_fraud_amount: number | null;
  total_restitution: number | null;
  status: string;
  date_filed: string | null;
  date_charged: string | null;
  date_indicted: string | null;
  date_convicted: string | null;
  date_sentenced: string | null;
  summary: string | null;
  doj_press_url: string | null;
  source_urls: string[] | null;
}

interface Defendant {
  id: string;
  name: string;
  defendant_type: string;
  role: string | null;
  age: number | null;
  city: string | null;
  state: string | null;
  charges: string | null;
  verdict: string | null;
  sentence_months: number | null;
  sentence_type: string | null;
  probation_months: number | null;
  restitution_amount: number | null;
  forfeiture_amount: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  investigating: 'bg-gray-700 text-gray-300',
  charged: 'bg-yellow-900/50 text-yellow-400',
  indicted: 'bg-orange-900/50 text-orange-400',
  trial: 'bg-purple-900/50 text-purple-400',
  convicted: 'bg-red-900/50 text-red-400',
  sentenced: 'bg-green-900/50 text-green-400',
  acquitted: 'bg-blue-900/50 text-blue-400',
  dismissed: 'bg-gray-800 text-gray-400',
};

const FRAUD_TYPE_COLORS: Record<string, string> = {
  PPP: 'bg-blue-900/40 text-blue-400 border-blue-800',
  EIDL: 'bg-cyan-900/40 text-cyan-400 border-cyan-800',
  CCAP: 'bg-pink-900/40 text-pink-400 border-pink-800',
  CACFP: 'bg-orange-900/40 text-orange-400 border-orange-800',
  Medicare: 'bg-purple-900/40 text-purple-400 border-purple-800',
  Medicaid: 'bg-violet-900/40 text-violet-400 border-violet-800',
  SNAP: 'bg-amber-900/40 text-amber-400 border-amber-800',
  COVID: 'bg-red-900/40 text-red-400 border-red-800',
  Other: 'bg-gray-800 text-gray-400 border-gray-700',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatSentence(months: number | null, type: string | null): string {
  if (!months) return '-';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  let str = '';
  if (years > 0) str += `${years} year${years > 1 ? 's' : ''}`;
  if (remainingMonths > 0) {
    if (str) str += ' ';
    str += `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  }
  if (type) str += ` ${type}`;
  return str;
}

async function getCase(id: string): Promise<Case | null> {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

async function getDefendants(caseId: string): Promise<Defendant[]> {
  const { data, error } = await supabase
    .from('defendants')
    .select('*')
    .eq('case_id', caseId)
    .order('sentence_months', { ascending: false, nullsFirst: false });

  if (error) return [];
  return data || [];
}

export const revalidate = 60;

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [caseData, defendants] = await Promise.all([
    getCase(id),
    getDefendants(id),
  ]);

  if (!caseData) {
    notFound();
  }

  // Build timeline
  const timeline: { date: string; event: string; status: string }[] = [];
  if (caseData.date_charged) {
    timeline.push({ date: caseData.date_charged, event: 'Charged', status: 'charged' });
  }
  if (caseData.date_indicted) {
    timeline.push({ date: caseData.date_indicted, event: 'Indicted', status: 'indicted' });
  }
  if (caseData.date_convicted) {
    timeline.push({ date: caseData.date_convicted, event: 'Convicted', status: 'convicted' });
  }
  if (caseData.date_sentenced) {
    timeline.push({ date: caseData.date_sentenced, event: 'Sentenced', status: 'sentenced' });
  }
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/cases" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        ← Back to Cases
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3">{caseData.case_name}</h1>
        <div className="flex flex-wrap gap-2 items-center">
          {caseData.fraud_types?.map((type) => (
            <span
              key={type}
              className={`px-2 py-0.5 rounded text-xs border ${FRAUD_TYPE_COLORS[type] || FRAUD_TYPE_COLORS.Other}`}
            >
              {type}
            </span>
          ))}
          <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[caseData.status]}`}>
            {caseData.status.toUpperCase()}
          </span>
        </div>
        {caseData.case_number && (
          <p className="text-gray-500 mt-2 text-sm font-mono">{caseData.case_number}</p>
        )}
        {caseData.court && (
          <p className="text-gray-500 text-sm">{caseData.court}</p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-sm mb-1">Fraud Amount</p>
          <p className="text-green-500 font-mono text-2xl font-bold">
            {formatMoney(caseData.total_fraud_amount)}
          </p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-sm mb-1">Restitution</p>
          <p className="text-white font-mono text-2xl font-bold">
            {formatMoney(caseData.total_restitution)}
          </p>
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Timeline</h2>
          <div className="border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              {timeline.map((event, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${STATUS_COLORS[event.status].split(' ')[0]}`} />
                  <p className="text-sm font-medium mt-2">{event.event}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
            {timeline.length > 1 && (
              <div className="h-0.5 bg-gray-700 -mt-[46px] mx-6" />
            )}
          </div>
        </div>
      )}

      {/* Defendants */}
      {defendants.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Defendants ({defendants.length})</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Name</th>
                  <th className="text-left p-3 font-medium text-gray-400">Role</th>
                  <th className="text-center p-3 font-medium text-gray-400">Verdict</th>
                  <th className="text-right p-3 font-medium text-gray-400">Sentence</th>
                  <th className="text-right p-3 font-medium text-gray-400">Restitution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {defendants.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <span className="font-medium">{d.name}</span>
                      {d.age && (
                        <span className="text-gray-500 text-xs ml-1">({d.age})</span>
                      )}
                      {d.city && d.state && (
                        <p className="text-gray-500 text-xs">{d.city}, {d.state}</p>
                      )}
                    </td>
                    <td className="p-3 text-gray-400">{d.role || '-'}</td>
                    <td className="p-3 text-center">
                      {d.verdict && (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          d.verdict.includes('guilty') ? 'bg-red-900/50 text-red-400' :
                          d.verdict === 'acquitted' ? 'bg-blue-900/50 text-blue-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {d.verdict.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right text-gray-400">
                      {formatSentence(d.sentence_months, d.sentence_type)}
                      {d.probation_months && (
                        <p className="text-xs text-gray-500">
                          + {Math.floor(d.probation_months / 12)}yr probation
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(d.restitution_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {caseData.summary && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Case Summary</h2>
          <div className="border border-gray-800 p-4 text-gray-300 leading-relaxed">
            {caseData.summary}
          </div>
        </div>
      )}

      {/* Sources */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Sources</h2>
        <div className="border border-gray-800 p-4 space-y-2">
          {caseData.doj_press_url && (
            <a
              href={caseData.doj_press_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-400 hover:underline text-sm"
            >
              DOJ Press Release ↗
            </a>
          )}
          {caseData.source_urls?.filter(url => url !== caseData.doj_press_url).map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-400 hover:underline text-sm"
            >
              Source {idx + 2} ↗
            </a>
          ))}
          {!caseData.doj_press_url && (!caseData.source_urls || caseData.source_urls.length === 0) && (
            <p className="text-gray-500 text-sm">No external sources available</p>
          )}
        </div>
      </div>
    </div>
  );
}
