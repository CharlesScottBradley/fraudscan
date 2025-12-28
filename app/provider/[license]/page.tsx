import { supabase, Provider } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ProviderWithPayments extends Provider {
  payments: { fiscal_year: number; total_amount: number }[];
}

async function getProvider(licenseNumber: string): Promise<ProviderWithPayments | null> {
  const { data, error } = await supabase
    .from('providers')
    .select(`
      *,
      payments (
        fiscal_year,
        total_amount
      )
    `)
    .eq('license_number', licenseNumber)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ProviderWithPayments;
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ license: string }>;
}) {
  const { license } = await params;
  const provider = await getProvider(license);

  if (!provider) {
    notFound();
  }

  const totalFunding = provider.payments?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

  return (
    <div>
      <div className="mb-8">
        <Link href="/database" className="text-gray-500 text-sm hover:text-white">
          Back to Database
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{provider.name}</h1>
        {provider.dba_name && (
          <p className="text-gray-500">DBA: {provider.dba_name}</p>
        )}
      </div>

      {totalFunding > 0 && (
        <div className="mb-12">
          <p className="text-gray-500 text-sm mb-1">Total CCAP Funding</p>
          <p className="text-green-500 font-mono text-3xl font-bold">
            {formatMoney(totalFunding)}
          </p>
          {provider.payments && provider.payments.length > 0 && (
            <div className="mt-4 flex gap-6">
              {provider.payments
                .sort((a, b) => b.fiscal_year - a.fiscal_year)
                .map(p => (
                  <div key={p.fiscal_year}>
                    <p className="text-gray-500 text-xs">FY {p.fiscal_year}</p>
                    <p className="text-gray-400 font-mono">{formatMoney(p.total_amount)}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
        <div>
          <h2 className="text-gray-500 text-sm mb-4 uppercase tracking-wide">License</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-500 text-sm">License Number</dt>
              <dd className="font-mono">{provider.license_number}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Type</dt>
              <dd>{provider.license_type || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Status</dt>
              <dd>{provider.license_status || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Capacity</dt>
              <dd>{provider.licensed_capacity || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Effective Date</dt>
              <dd>
                {provider.license_effective_date
                  ? new Date(provider.license_effective_date).toLocaleDateString()
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Expiration Date</dt>
              <dd>
                {provider.license_expiration_date
                  ? new Date(provider.license_expiration_date).toLocaleDateString()
                  : '-'}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-gray-500 text-sm mb-4 uppercase tracking-wide">Location</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-500 text-sm">Address</dt>
              <dd>{provider.address || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">City</dt>
              <dd>{provider.city || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">State</dt>
              <dd>{provider.state || 'MN'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">ZIP Code</dt>
              <dd>{provider.zip_code || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">County</dt>
              <dd>{provider.county || '-'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-gray-500 text-sm mb-4 uppercase tracking-wide">Quality</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-500 text-sm">Parent Aware Rating</dt>
              <dd>{provider.parent_aware_rating || 'Not rated'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Accredited</dt>
              <dd>{provider.is_accredited ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-gray-500 text-sm mb-4 uppercase tracking-wide">Record</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-500 text-sm">First Recorded</dt>
              <dd>
                {provider.created_at
                  ? new Date(provider.created_at).toLocaleDateString()
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Last Updated</dt>
              <dd>
                {provider.updated_at
                  ? new Date(provider.updated_at).toLocaleDateString()
                  : '-'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-800">
        <a
          href={`https://licensinglookup.dhs.state.mn.us/Details.aspx?l=${provider.license_number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white text-sm"
        >
          View on MN DHS Site
        </a>
      </div>
    </div>
  );
}
