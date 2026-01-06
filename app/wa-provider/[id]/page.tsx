import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface WAProviderDetail {
  id: string;
  provider_sf_id: string;
  license_number: string | null;
  provider_numeric_id: string | null;
  display_name: string | null;
  license_name: string | null;
  address: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string;
  zip_code: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  provider_status: string | null;
  license_status: string | null;
  facility_type: string | null;
  license_type: string | null;
  licensed_capacity: number | null;
  ages_raw: string | null;
  school_district: string | null;
  languages_spoken: string[];
  hours: Array<{ day: string; open_time: string | null; close_time: string | null }> | null;
  primary_contact_name: string | null;
  early_achievers_status: string | null;
  early_achievers_specializations: string[];
  head_start: boolean;
  early_head_start: boolean;
  eceap: boolean;
  food_program_participation: string | null;
  subsidy_participation: string | null;
  source_url: string | null;
  fetched_at: string | null;
  created_at: string;
  updated_at: string;
  contacts: Array<{
    id: string;
    full_name: string | null;
    role: string | null;
    email: string | null;
    phone: string | null;
    start_date: string | null;
  }>;
  inspections: Array<{
    id: string;
    inspection_date: string | null;
    inspection_type: string | null;
    checklist_type: string | null;
    document_url: string | null;
  }>;
  complaints: Array<{
    id: string;
    compliance_issue_descriptions: string | null;
    valid_issues_count: number | null;
    complaint_resolution: string | null;
    received_on: string | null;
    resolved_on: string | null;
    self_reported: boolean;
  }>;
  license_history: Array<{
    id: string;
    license_status: string | null;
    license_type: string | null;
    license_issue_date: string | null;
    license_closure_date: string | null;
    license_status_reason: string | null;
  }>;
}

async function getProvider(id: string): Promise<WAProviderDetail | null> {
  // Try to find by different ID types
  let query = supabase.from('wa_childcare_providers').select('*');

  if (id.length === 18 && id.startsWith('00')) {
    query = query.eq('provider_sf_id', id);
  } else if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    query = query.eq('id', id);
  } else {
    query = query.eq('license_number', id);
  }

  const { data: provider, error } = await query.single();

  if (error || !provider) {
    return null;
  }

  // Get related data
  const [
    { data: contacts },
    { data: inspections },
    { data: complaints },
    { data: licenseHistory }
  ] = await Promise.all([
    supabase
      .from('wa_provider_contacts')
      .select('id, full_name, role, email, phone, start_date')
      .eq('provider_id', provider.id)
      .order('role'),
    supabase
      .from('wa_provider_inspections')
      .select('id, inspection_date, inspection_type, checklist_type, document_url')
      .eq('provider_id', provider.id)
      .order('inspection_date', { ascending: false }),
    supabase
      .from('wa_provider_complaints')
      .select('id, compliance_issue_descriptions, valid_issues_count, complaint_resolution, received_on, resolved_on, self_reported')
      .eq('provider_id', provider.id)
      .order('received_on', { ascending: false }),
    supabase
      .from('wa_license_history')
      .select('id, license_status, license_type, license_issue_date, license_closure_date, license_status_reason')
      .eq('provider_id', provider.id)
      .order('license_issue_date', { ascending: false })
  ]);

  return {
    ...provider,
    contacts: contacts || [],
    inspections: inspections || [],
    complaints: complaints || [],
    license_history: licenseHistory || []
  };
}

function StatusBadge({ status }: { status: string | null }) {
  const isOpen = status?.toLowerCase() === 'open';
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      isOpen ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
    }`}>
      {status || 'Unknown'}
    </span>
  );
}

function ProgramBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900 text-blue-300">
      {label}
    </span>
  );
}

export default async function WAProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = await getProvider(id);

  if (!provider) {
    notFound();
  }

  const hasHours = provider.hours?.some(h => h.open_time || h.close_time);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back link */}
      <div className="mb-6">
        <Link href="/state/WA" className="text-gray-500 text-sm hover:text-white">
          &larr; Back to Washington
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{provider.display_name}</h1>
            {provider.license_name && provider.license_name !== provider.display_name && (
              <p className="text-gray-500">License Name: {provider.license_name}</p>
            )}
          </div>
          <StatusBadge status={provider.license_status} />
        </div>

        {/* Program badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {provider.early_achievers_status && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-900 text-purple-300">
              Early Achievers: {provider.early_achievers_status}
            </span>
          )}
          <ProgramBadge label="Head Start" active={provider.head_start} />
          <ProgramBadge label="Early Head Start" active={provider.early_head_start} />
          <ProgramBadge label="ECEAP" active={provider.eceap} />
        </div>
      </div>

      {/* Main info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* License Info */}
        <div className="bg-gray-900 rounded-lg p-5">
          <h2 className="text-gray-400 text-sm uppercase tracking-wide mb-4">License</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">License Number</dt>
              <dd className="font-mono">{provider.license_number || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Facility Type</dt>
              <dd>{provider.facility_type || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">License Type</dt>
              <dd>{provider.license_type || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Capacity</dt>
              <dd className="text-lg font-semibold">{provider.licensed_capacity || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Ages Served</dt>
              <dd>{provider.ages_raw || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Location */}
        <div className="bg-gray-900 rounded-lg p-5">
          <h2 className="text-gray-400 text-sm uppercase tracking-wide mb-4">Location</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Address</dt>
              <dd>
                {provider.address_line1 || provider.address || '-'}
                {provider.address_line2 && <br />}
                {provider.address_line2}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">City</dt>
              <dd>{provider.city || '-'}, {provider.state} {provider.zip_code}</dd>
            </div>
            <div>
              <dt className="text-gray-500">School District</dt>
              <dd>{provider.school_district || '-'}</dd>
            </div>
            {provider.latitude && provider.longitude && (
              <div>
                <dt className="text-gray-500">Coordinates</dt>
                <dd className="font-mono text-xs">
                  {provider.latitude.toFixed(5)}, {provider.longitude.toFixed(5)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Contact */}
        <div className="bg-gray-900 rounded-lg p-5">
          <h2 className="text-gray-400 text-sm uppercase tracking-wide mb-4">Contact</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd>
                {provider.phone ? (
                  <a href={`tel:${provider.phone}`} className="text-blue-400 hover:underline">
                    {provider.phone}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd>
                {provider.email ? (
                  <a href={`mailto:${provider.email}`} className="text-blue-400 hover:underline break-all">
                    {provider.email}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Website</dt>
              <dd>
                {provider.website ? (
                  <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    {provider.website}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Primary Contact</dt>
              <dd>{provider.primary_contact_name || '-'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Languages & Hours */}
      {(provider.languages_spoken?.length > 0 || hasHours) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {provider.languages_spoken?.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-5">
              <h2 className="text-gray-400 text-sm uppercase tracking-wide mb-4">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {provider.languages_spoken.map((lang, i) => (
                  <span key={i} className="px-2 py-1 rounded text-xs bg-gray-800">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasHours && (
            <div className="bg-gray-900 rounded-lg p-5">
              <h2 className="text-gray-400 text-sm uppercase tracking-wide mb-4">Hours</h2>
              <div className="grid grid-cols-7 gap-2 text-xs">
                {provider.hours?.map((h, i) => (
                  <div key={i} className="text-center">
                    <div className="text-gray-500 mb-1">{h.day}</div>
                    <div>{h.open_time || '-'}</div>
                    <div>{h.close_time || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contacts Table */}
      {provider.contacts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Contacts ({provider.contacts.length})</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400">Name</th>
                  <th className="px-4 py-3 text-left text-gray-400">Role</th>
                  <th className="px-4 py-3 text-left text-gray-400">Email</th>
                  <th className="px-4 py-3 text-left text-gray-400">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {provider.contacts.map(contact => (
                  <tr key={contact.id}>
                    <td className="px-4 py-3">{contact.full_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{contact.role || '-'}</td>
                    <td className="px-4 py-3">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="text-blue-400 hover:underline">
                          {contact.email}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">{contact.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspections Table */}
      {provider.inspections.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Inspections ({provider.inspections.length})</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-gray-400">Type</th>
                  <th className="px-4 py-3 text-left text-gray-400">Checklist</th>
                  <th className="px-4 py-3 text-left text-gray-400">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {provider.inspections.map(inspection => (
                  <tr key={inspection.id}>
                    <td className="px-4 py-3 font-mono">{inspection.inspection_date || '-'}</td>
                    <td className="px-4 py-3">{inspection.inspection_type || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{inspection.checklist_type || '-'}</td>
                    <td className="px-4 py-3">
                      {inspection.document_url ? (
                        <a href={inspection.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          View
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complaints Table */}
      {provider.complaints.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-amber-400">
            Complaints ({provider.complaints.length})
          </h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400">Received</th>
                  <th className="px-4 py-3 text-left text-gray-400">Issues</th>
                  <th className="px-4 py-3 text-left text-gray-400">Description</th>
                  <th className="px-4 py-3 text-left text-gray-400">Resolution</th>
                  <th className="px-4 py-3 text-left text-gray-400">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {provider.complaints.map(complaint => (
                  <tr key={complaint.id}>
                    <td className="px-4 py-3 font-mono">{complaint.received_on || '-'}</td>
                    <td className="px-4 py-3">
                      {complaint.valid_issues_count !== null ? (
                        <span className={complaint.valid_issues_count > 0 ? 'text-red-400' : ''}>
                          {complaint.valid_issues_count}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">
                      {complaint.compliance_issue_descriptions || '-'}
                    </td>
                    <td className="px-4 py-3">{complaint.complaint_resolution || '-'}</td>
                    <td className="px-4 py-3 font-mono">{complaint.resolved_on || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* License History */}
      {provider.license_history.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">License History ({provider.license_history.length})</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400">Issued</th>
                  <th className="px-4 py-3 text-left text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-gray-400">Type</th>
                  <th className="px-4 py-3 text-left text-gray-400">Closed</th>
                  <th className="px-4 py-3 text-left text-gray-400">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {provider.license_history.map(history => (
                  <tr key={history.id}>
                    <td className="px-4 py-3 font-mono">{history.license_issue_date || '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={history.license_status} />
                    </td>
                    <td className="px-4 py-3">{history.license_type || '-'}</td>
                    <td className="px-4 py-3 font-mono">{history.license_closure_date || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{history.license_status_reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Source info */}
      <div className="text-gray-600 text-xs mt-10 pt-6 border-t border-gray-800">
        <p>Data source: Washington DCYF FindChildCareWA</p>
        {provider.source_url && (
          <p>
            <a href={provider.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
              View on FindChildCareWA &rarr;
            </a>
          </p>
        )}
        {provider.fetched_at && (
          <p>Last updated: {new Date(provider.fetched_at).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}
