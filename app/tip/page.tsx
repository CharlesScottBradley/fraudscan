'use client';

import { useState } from 'react';
import Link from 'next/link';

const FRAUD_TYPES = [
  { value: 'PPP', label: 'PPP / Paycheck Protection Program' },
  { value: 'EIDL', label: 'EIDL / Economic Injury Disaster Loan' },
  { value: 'CCAP', label: 'Childcare / CCAP' },
  { value: 'CACFP', label: 'Child Food Program / CACFP' },
  { value: 'Medicare', label: 'Medicare' },
  { value: 'Medicaid', label: 'Medicaid' },
  { value: 'SNAP', label: 'SNAP / Food Stamps' },
  { value: 'Other', label: 'Other' },
];

const TIP_TYPES = [
  { value: 'fraud_report', label: 'Fraud Report', description: 'Report suspected fraud activity' },
  { value: 'correction', label: 'Data Correction', description: 'Fix incorrect information in our database' },
  { value: 'document', label: 'Document Submission', description: 'Submit court filings or evidence' },
  { value: 'lead', label: 'Investigation Lead', description: 'Something we should look into' },
];

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export default function TipPage() {
  const [tipType, setTipType] = useState('fraud_report');
  const [fraudTypes, setFraudTypes] = useState<string[]>([]);
  const [state, setState] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [entityName, setEntityName] = useState('');
  const [address, setAddress] = useState('');
  const [evidence, setEvidence] = useState('');
  const [email, setEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleFraudType = (type: string) => {
    setFraudTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tip_type: tipType,
          fraud_types: fraudTypes,
          state: state || null,
          subject,
          description,
          related_entity_name: entityName || null,
          related_address: address || null,
          evidence_description: evidence || null,
          contact_email: email || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        // Reset form
        setTipType('fraud_report');
        setFraudTypes([]);
        setState('');
        setSubject('');
        setDescription('');
        setEntityName('');
        setAddress('');
        setEvidence('');
        setEmail('');
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.error || 'Failed to submit tip');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-2xl font-bold mb-2">Submit a Tip</h1>
      <p className="text-gray-400 mb-8">
        Have information about government spending anomalies, waste, or fraud? Submit it below.
        All tips are reviewed. Your information helps improve spending transparency.
      </p>

      {submitStatus === 'success' && (
        <div className="bg-green-900/30 border border-green-700 p-4 mb-6 rounded">
          <p className="text-green-400 font-medium">Tip submitted successfully!</p>
          <p className="text-green-500 text-sm mt-1">
            Thank you for your submission. We review all tips and may follow up if you provided contact information.
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-red-900/30 border border-red-700 p-4 mb-6 rounded">
          <p className="text-red-400">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tip Type */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Type of Submission <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TIP_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setTipType(type.value)}
                className={`p-3 border rounded text-left transition-colors ${
                  tipType === type.value
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-medium">{type.label}</div>
                <div className="text-sm text-gray-500">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Fraud Type */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Type of Fraud (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {FRAUD_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleFraudType(type.value)}
                className={`px-3 py-1.5 border rounded text-sm transition-colors ${
                  fraudTypes.includes(type.value)
                    ? 'border-green-500 bg-green-900/20 text-green-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium mb-2">
            State
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
          >
            <option value="">Select state (optional)</option>
            {STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your tip"
            required
            maxLength={500}
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide as much detail as possible about the fraud or information you're reporting..."
            required
            rows={6}
            maxLength={10000}
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
          />
          <div className="text-xs text-gray-500 mt-1">{description.length}/10000 characters</div>
        </div>

        {/* Related Entity */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Related Business/Person Name
          </label>
          <input
            type="text"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            placeholder="Name of business or individual involved"
            maxLength={500}
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Related Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address of business or location (optional)"
            maxLength={500}
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
          />
        </div>

        {/* Evidence Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Evidence Description
          </label>
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Describe any documents, records, or other evidence you have (optional)"
            rows={3}
            maxLength={2000}
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
          />
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Contact Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
          />
          <div className="text-xs text-gray-500 mt-1">
            Your email will not be published. We may contact you for follow-up questions.
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-gray-900 border border-gray-800 p-4 rounded text-sm text-gray-400">
          <p className="font-medium text-white mb-1">Privacy Notice</p>
          <p>
            Tips are stored securely and reviewed by our team. We do not share identifying
            information with third parties unless required by law. You may submit tips
            anonymously by not providing an email address.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !subject || !description}
          className={`w-full py-3 px-4 rounded font-medium transition-colors ${
            isSubmitting || !subject || !description
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Tip'}
        </button>
      </form>

      {/* Alternative reporting */}
      <div className="mt-8 pt-8 border-t border-gray-800">
        <h3 className="font-medium mb-3">Other Ways to Report Fraud</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>
            <span className="text-gray-500">FBI:</span>{' '}
            <a href="https://tips.fbi.gov" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              tips.fbi.gov
            </a>
          </li>
          <li>
            <span className="text-gray-500">DOJ OIG:</span>{' '}
            <a href="https://oig.justice.gov/hotline" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              oig.justice.gov/hotline
            </a>
          </li>
          <li>
            <span className="text-gray-500">SBA OIG (PPP/EIDL):</span>{' '}
            <a href="https://www.sba.gov/about-sba/oversight-advocacy/office-inspector-general" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              sba.gov/oig
            </a>
          </li>
          <li>
            <span className="text-gray-500">USDA OIG (Food Programs):</span>{' '}
            <a href="https://www.usda.gov/oig/hotline" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              usda.gov/oig
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
