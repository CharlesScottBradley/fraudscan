'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface StateInfo {
  code: string;
  name: string;
  law: {
    name: string;
    shortName: string | null;
    citation: string | null;
    url: string | null;
  };
  response: {
    days: number | null;
    notes: string | null;
  };
  fees: {
    statute: string | null;
    notes: string | null;
  };
  appeal: {
    body: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
  };
  tips: string[];
  denialRemedies: string[];
  salutation: string | null;
  isComplete: boolean;
}

interface Agency {
  id: string;
  agency_name: string;
  agency_short_name: string | null;
  agency_type: string | null;
  data_types: string[];
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
}

interface Template {
  id: string;
  template_key: string;
  template_name: string;
  category: string | null;
  icon: string | null;
  subject_line_template: string | null;
  description_template: string;
  fields_template: string[];
  required_placeholders: string[];
}

const STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' },
];

// Template icon mapping (no emojis in UI, use text labels)
const TEMPLATE_LABELS: Record<string, string> = {
  'childcare_payments': 'Childcare / CCAP',
  'medicaid_providers': 'Medicaid / Healthcare',
  'nemt_providers': 'NEMT / Transportation',
  'food_programs': 'Food Programs',
  'business_registrations': 'Business Registry',
  'vendor_payments': 'Vendor Payments',
  'housing_assistance': 'Housing Assistance',
};

export default function FOIAPage() {
  const [selectedState, setSelectedState] = useState('MN');
  const [stateData, setStateData] = useState<{
    state: StateInfo;
    agencies: Agency[];
    templates: Template[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    yourName: '',
    yourEmail: '',
    countyName: '',
    startDate: '',
    endDate: '',
    feeThreshold: '100',
    additionalFields: '',
  });

  const [copied, setCopied] = useState(false);
  const templateRef = useRef<HTMLPreElement>(null);

  // Fetch state data
  useEffect(() => {
    async function fetchStateData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/foia/${selectedState}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.message || 'State data not available');
          setStateData(null);
        } else {
          const data = await res.json();
          setStateData(data);
          // Auto-select first template
          if (data.templates?.length > 0 && !selectedTemplate) {
            setSelectedTemplate(data.templates[0].template_key);
          }
        }
      } catch (e) {
        setError('Failed to load state data');
        setStateData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchStateData();
  }, [selectedState]);

  // Get selected template object
  const currentTemplate = stateData?.templates?.find(t => t.template_key === selectedTemplate);

  // Generate the request letter
  const generateLetter = () => {
    if (!stateData || !currentTemplate) return '';

    const state = stateData.state;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Replace placeholders in template
    let dataDescription = currentTemplate.description_template
      .replace('[COUNTY_NAME]', formData.countyName || '[COUNTY_NAME]')
      .replace('[START_DATE]', formData.startDate || '[START_DATE]')
      .replace('[END_DATE]', formData.endDate || '[END_DATE]');

    const fields = currentTemplate.fields_template || [];

    return `Subject: ${currentTemplate.subject_line_template || `Public Records Request - ${currentTemplate.template_name}`}

${state.salutation || 'Dear Records Custodian,'}

Pursuant to the ${state.law.name}${state.law.citation ? ` (${state.law.citation})` : ''}, I am requesting access to the following government data:

DATA REQUESTED:
${dataDescription}

For the time period: ${formData.startDate || '[START DATE]'} through ${formData.endDate || '[END DATE]'}

For each record, please include:
${fields.map(f => `- ${f}`).join('\n')}
${formData.additionalFields ? `\nAdditional fields requested:\n${formData.additionalFields}` : ''}

Geographic scope: ${formData.countyName ? `${formData.countyName} County` : 'Statewide'}

FORMAT & DELIVERY:
Preferred format: Electronic file (CSV, Excel, or other machine-readable format)
Delivery method: Email to ${formData.yourEmail || '[YOUR EMAIL]'}

If electronic delivery is not possible, please contact me to arrange alternatives.

FEES:
${state.fees.statute ? `I understand that reasonable fees may apply per ${state.fees.statute}.` : 'I understand that reasonable fees may apply.'}
Please provide a cost estimate before proceeding if fees will exceed $${formData.feeThreshold || '100'}.

If any portion of this request is denied, please cite the specific statutory basis for the denial and release any segregable portions that are public.

CONTACT INFORMATION:
Name: ${formData.yourName || '[YOUR NAME]'}
Email: ${formData.yourEmail || '[YOUR EMAIL]'}

Thank you for your prompt attention to this request.${state.response.days ? ` Per ${state.law.citation || 'state law'}, I expect a response within ${state.response.days} business days.` : ''}

Respectfully,
${formData.yourName || '[YOUR NAME]'}
${today}`;
  };

  const handleCopy = async () => {
    const letter = generateLetter();
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const letter = generateLetter();
    const blob = new Blob([letter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foia-request-${selectedState.toLowerCase()}-${selectedTemplate || 'general'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        Back to Map
      </Link>

      <h1 className="text-2xl font-bold mb-2">Public Records Request Generator</h1>
      <p className="text-gray-400 mb-6">
        Generate state-specific public records requests for government data. Select your state and request type below.
      </p>

      {/* Disclaimer */}
      <div className="border border-yellow-900/50 bg-yellow-950/20 rounded p-4 mb-8">
        <p className="text-yellow-200/80 text-sm font-medium mb-2">Important Disclaimer</p>
        <p className="text-yellow-200/60 text-xs leading-relaxed">
          This tool generates <strong>templates only</strong> and does not constitute legal advice. Agency contact information, 
          response deadlines, and legal citations may be outdated or incorrect. <strong>You are responsible for verifying</strong> all 
          information before submitting any request. Laws and procedures change frequently. We recommend consulting your 
          state&apos;s official FOIA resources or an attorney for guidance. FraudWatch assumes no liability for the accuracy 
          of this information or the outcome of any records request.
        </p>
      </div>

      {/* State Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-400 mb-2">Select State</label>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full max-w-xs bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
        >
          {STATES.map(s => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-gray-500 py-8">Loading state data...</div>
      )}

      {error && (
        <div className="border border-gray-800 p-6 mb-8">
          <p className="text-gray-400 mb-2">{error}</p>
          <p className="text-gray-500 text-sm">
            Currently only Minnesota has full FOIA data. Other states are being researched.
          </p>
        </div>
      )}

      {stateData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* State Law Info */}
            <div className="font-mono text-sm mb-6">
              <p className="text-gray-500">{stateData.state.name.toUpperCase()}_PUBLIC_RECORDS_LAW</p>
              <div className="mt-2 text-gray-400">
                <p><span className="text-gray-600">+-</span> law <span className="text-white ml-4">{stateData.state.law.shortName || stateData.state.law.name}</span></p>
                <p><span className="text-gray-600">+-</span> citation <span className="text-white ml-4">{stateData.state.law.citation || 'N/A'}</span></p>
                <p><span className="text-gray-600">+-</span> response_time <span className="text-white ml-4">{stateData.state.response.days ? `${stateData.state.response.days} business days` : 'Varies'}</span></p>
                <p><span className="text-gray-600">+-</span> appeal_body <span className="text-white ml-4">{stateData.state.appeal.body || 'N/A'}</span></p>
              </div>
            </div>

            {/* Request Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Request Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {stateData.templates.map(template => (
                  <button
                    key={template.template_key}
                    onClick={() => setSelectedTemplate(template.template_key)}
                    className={`p-3 border rounded text-left text-sm transition-colors ${
                      selectedTemplate === template.template_key
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-white">
                      {TEMPLATE_LABELS[template.template_key] || template.template_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{template.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={formData.yourName}
                    onChange={(e) => setFormData(prev => ({ ...prev, yourName: e.target.value }))}
                    placeholder="John Smith"
                    className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Your Email</label>
                  <input
                    type="email"
                    value={formData.yourEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, yourEmail: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">County Name (or leave blank for statewide)</label>
                <input
                  type="text"
                  value={formData.countyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, countyName: e.target.value }))}
                  placeholder="Hennepin"
                  className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Fee Threshold ($)</label>
                <input
                  type="number"
                  value={formData.feeThreshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, feeThreshold: e.target.value }))}
                  placeholder="100"
                  className="w-full max-w-xs bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Request cost estimate if fees exceed this amount</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Additional Data Fields (optional)</label>
                <textarea
                  value={formData.additionalFields}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalFields: e.target.value }))}
                  placeholder="Any additional data fields you want to request..."
                  rows={3}
                  className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
                />
              </div>
            </div>

            {/* Generated Template */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-400">Generated Request</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="text-sm text-gray-400 hover:text-white px-3 py-1 border border-gray-700 rounded hover:border-gray-600"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-sm text-gray-400 hover:text-white px-3 py-1 border border-gray-700 rounded hover:border-gray-600"
                  >
                    Download
                  </button>
                </div>
              </div>
              <pre
                ref={templateRef}
                className="bg-gray-900 border border-gray-800 p-4 rounded text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto font-mono"
              >
                {generateLetter()}
              </pre>
            </div>
          </div>

          {/* Right Column - State Info & Agencies */}
          <div className="space-y-6">
            {/* Where to Send */}
            <div className="border border-gray-800 p-4">
              <h3 className="font-medium mb-4">Where to Send</h3>
              <div className="space-y-4 text-sm">
                {stateData.agencies.map(agency => (
                  <div key={agency.id} className="border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                    <p className="text-white font-medium">{agency.agency_short_name || agency.agency_name}</p>
                    <p className="text-gray-500 text-xs mb-1">{agency.agency_name}</p>
                    {agency.email && (
                      <p className="text-gray-400">
                        <a href={`mailto:${agency.email}`} className="text-green-500 hover:underline">{agency.email}</a>
                      </p>
                    )}
                    {agency.phone && (
                      <p className="text-gray-400">{agency.phone}</p>
                    )}
                    {agency.notes && (
                      <p className="text-gray-500 text-xs mt-1">{agency.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {stateData.state.tips && stateData.state.tips.length > 0 && (
              <div className="border border-gray-800 p-4">
                <h3 className="font-medium mb-3">Tips</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  {stateData.state.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gray-600">-</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* If Denied */}
            {stateData.state.denialRemedies && stateData.state.denialRemedies.length > 0 && (
              <div className="border border-gray-800 p-4">
                <h3 className="font-medium mb-3">If Denied</h3>
                <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
                  {stateData.state.denialRemedies.map((remedy, i) => (
                    <li key={i}>{remedy}</li>
                  ))}
                </ol>
                {stateData.state.appeal.email && (
                  <p className="text-sm text-gray-500 mt-3">
                    Appeal contact: <a href={`mailto:${stateData.state.appeal.email}`} className="text-green-500 hover:underline">{stateData.state.appeal.email}</a>
                    {stateData.state.appeal.phone && ` or ${stateData.state.appeal.phone}`}
                  </p>
                )}
              </div>
            )}

            {/* Response Timeline */}
            <div className="border border-gray-800 p-4">
              <h3 className="font-medium mb-3">Expected Response Times</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Simple request</span>
                  <span className="text-gray-400">1-3 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Standard request</span>
                  <span className="text-gray-400">{stateData.state.response.days || 10} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Complex request</span>
                  <span className="text-gray-400">30-60 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

