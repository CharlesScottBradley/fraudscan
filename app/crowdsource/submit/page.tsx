'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase for direct storage uploads (bypasses Vercel 4.5MB limit)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseClient = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Declare turnstile on window
declare global {
  interface Window {
    turnstile?: {
      reset: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia'
};

const DATA_TYPES: Record<string, string> = {
  childcare_providers: 'Childcare Providers',
  doj_fraud_cases: 'DOJ Fraud Cases',
  state_vendors: 'State Vendor Payments',
  campaign_finance: 'Campaign Finance',
  business_registry: 'Business Registry',
  covid_relief: 'COVID Relief Data',
  medicaid_providers: 'Medicaid Providers',
  ccap_payments: 'CCAP Payments',
  state_vendor_payments: 'State Vendor Payments',
  hcbs_payments: 'HCBS/Medicaid Payments',
  covid_relief_recipients: 'COVID Relief Recipients',
  other: 'Other',
};

const TIP_CATEGORIES: Record<string, string> = {
  fraud_report: 'Fraud Report',
  data_source: 'New Data Source',
  connection: 'Entity Connection',
  pattern: 'Fraud Pattern',
  document: 'Document/Evidence',
  other: 'Other',
};

interface DataGap {
  id: string;
  title: string;
  data_type: string;
}

function SubmitFormContent() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-filled from URL params
  const preselectedState = searchParams.get('state')?.toUpperCase() || '';
  const preselectedGap = searchParams.get('gap') || '';

  const [submissionType, setSubmissionType] = useState<'file_upload' | 'tip' | 'lead' | 'connection'>('file_upload');
  const [formData, setFormData] = useState({
    state_code: preselectedState,
    data_type: 'other',
    title: '',
    description: '',
    source_url: '',
    tip_content: '',
    tip_category: 'other',
    submitter_email: '',
    username: '',
    gap_ids: preselectedGap ? [preselectedGap] : [] as string[],
    related_entities: [] as Array<{ type: string; name: string; role: string }>,
  });

  const [file, setFile] = useState<File | null>(null);
  const [gaps, setGaps] = useState<DataGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Turnstile CAPTCHA
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Expose callback for Turnstile implicit rendering
  useEffect(() => {
    // Define global callback for Turnstile
    (window as Window & { onTurnstileCallback?: (token: string) => void }).onTurnstileCallback = (token: string) => {
      setTurnstileToken(token);
    };
    (window as Window & { onTurnstileExpired?: () => void }).onTurnstileExpired = () => {
      setTurnstileToken(null);
    };
    
    return () => {
      delete (window as Window & { onTurnstileCallback?: (token: string) => void }).onTurnstileCallback;
      delete (window as Window & { onTurnstileExpired?: () => void }).onTurnstileExpired;
    };
  }, []);

  // Reset Turnstile after successful submission
  const resetTurnstile = useCallback(() => {
    if (window.turnstile) {
      window.turnstile.reset();
      setTurnstileToken(null);
    }
  }, []);

  // Fetch gaps when state changes
  useEffect(() => {
    if (formData.state_code) {
      fetch(`/api/crowdsource/gaps/${formData.state_code}`)
        .then(res => res.json())
        .then(data => {
          if (data.gaps) {
            setGaps(data.gaps.filter((g: DataGap & { status: string }) => g.status !== 'complete'));
          }
        })
        .catch(() => setGaps([]));
    } else {
      setGaps([]);
    }
  }, [formData.state_code]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file size (100MB - direct upload to Supabase bypasses Vercel)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File exceeds maximum size of 100MB');
      return;
    }
    
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls', '.pdf', '.zip', '.json', '.txt', '.tsv'];
    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(ext)) {
      setError('Invalid file type. Accepted: CSV, Excel, PDF, ZIP, JSON, TXT');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.state_code) {
        throw new Error('Please select a state');
      }
      if (!formData.title) {
        throw new Error('Please enter a title');
      }
      if (!formData.submitter_email) {
        throw new Error('Please enter your email');
      }
      if (!formData.submitter_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Please enter a valid email');
      }

      // Verify CAPTCHA (skip if no site key configured - dev mode)
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        throw new Error('Please complete the CAPTCHA verification');
      }

      if (submissionType === 'file_upload' && !file) {
        throw new Error('Please select a file to upload');
      }
      if (['tip', 'lead', 'connection'].includes(submissionType) && !formData.tip_content) {
        throw new Error('Please enter your tip/lead content');
      }

      let response;

      if (submissionType === 'file_upload' && file) {
        // Direct upload to Supabase Storage (bypasses Vercel 4.5MB limit)
        if (!supabaseClient) {
          throw new Error('Storage not configured. Please try again later.');
        }

        const submissionId = crypto.randomUUID();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `submissions/${submissionId}/original/${sanitizedFileName}`;

        // Upload file directly to Supabase Storage
        const { error: uploadError } = await supabaseClient.storage
          .from('crowdsource')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error('Failed to upload file. Please try again.');
        }

        // Send metadata only to API (no file in body)
        response = await fetch('/api/crowdsource/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state_code: formData.state_code,
            data_type: formData.data_type,
            submission_type: submissionType,
            title: formData.title,
            description: formData.description,
            source_url: formData.source_url,
            submitter_email: formData.submitter_email,
            username: formData.username,
            gap_ids: formData.gap_ids,
            // Pre-uploaded file metadata
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            'cf-turnstile-response': turnstileToken,
          }),
        });
      } else {
        // Text submission - use JSON
        response = await fetch('/api/crowdsource/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state_code: formData.state_code,
            data_type: formData.data_type,
            submission_type: submissionType,
            title: formData.title,
            description: formData.description,
            tip_content: formData.tip_content,
            tip_category: formData.tip_category,
            source_url: formData.source_url,
            submitter_email: formData.submitter_email,
            username: formData.username,
            gap_ids: formData.gap_ids,
            related_entities: formData.related_entities,
            'cf-turnstile-response': turnstileToken,
          }),
        });
      }

      // Handle 413 specifically before trying to parse JSON
      if (response.status === 413) {
        throw new Error('Upload failed due to size limits. Please try again or contact us.');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addEntity = () => {
    setFormData(prev => ({
      ...prev,
      related_entities: [...prev.related_entities, { type: '', name: '', role: '' }],
    }));
  };

  const removeEntity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      related_entities: prev.related_entities.filter((_, i) => i !== index),
    }));
  };

  const updateEntity = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      related_entities: prev.related_entities.map((e, i) => 
        i === index ? { ...e, [field]: value } : e
      ),
    }));
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border border-gray-800 p-8 text-center">
          <p className="font-mono text-gray-500 mb-4">SUBMISSION_RECEIVED</p>
          <p className="text-white mb-2">Your submission is pending review.</p>
          <p className="text-gray-500 text-sm mb-6">
            You will be notified at {formData.submitter_email} when it has been processed.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/crowdsource"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded"
            >
              Back to Crowdsourcing
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setFile(null);
                setFormData(prev => ({
                  ...prev,
                  title: '',
                  description: '',
                  tip_content: '',
                  source_url: '',
                  gap_ids: [],
                  related_entities: [],
                }));
                resetTurnstile();
              }}
              className="px-4 py-2 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white text-sm rounded"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/crowdsource" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        Back to Crowdsourcing
      </Link>

      <h1 className="text-2xl font-bold mb-2">Submit Data</h1>
      <p className="text-gray-500 text-sm mb-8">
        Contribute data, tips, or connections. Your email is required for follow-up but will never be displayed publicly.
      </p>

      {/* Submission Type Tabs */}
      <div className="flex gap-4 mb-8 text-sm">
        <span className="text-gray-500">Type:</span>
        <button
          onClick={() => setSubmissionType('file_upload')}
          className={submissionType === 'file_upload' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          File Upload
        </button>
        <button
          onClick={() => setSubmissionType('tip')}
          className={submissionType === 'tip' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          Tip
        </button>
        <button
          onClick={() => setSubmissionType('connection')}
          className={submissionType === 'connection' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          Connection
        </button>
      </div>

      {error && (
        <div className="border border-gray-800 p-4 mb-6">
          <p className="text-gray-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* State Selection */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">State *</label>
          <select
            value={formData.state_code}
            onChange={(e) => setFormData(prev => ({ ...prev, state_code: e.target.value, gap_ids: [] }))}
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
            required
          >
            <option value="">Select a state</option>
            {Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        {/* Data Type */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Data Type *</label>
          <select
            value={formData.data_type}
            onChange={(e) => setFormData(prev => ({ ...prev, data_type: e.target.value }))}
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
            required
          >
            {Object.entries(DATA_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Related Data Gaps */}
        {formData.state_code && gaps.length > 0 && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">This submission fulfills (optional)</label>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-800 p-2">
              {gaps.map((gap) => (
                <label key={gap.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-900/50 p-1">
                  <input
                    type="checkbox"
                    checked={formData.gap_ids.includes(gap.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, gap_ids: [...prev.gap_ids, gap.id] }));
                      } else {
                        setFormData(prev => ({ ...prev, gap_ids: prev.gap_ids.filter(id => id !== gap.id) }));
                      }
                    }}
                    className="rounded border-gray-600 bg-gray-800 text-gray-500 focus:ring-0"
                  />
                  <span className="text-gray-400 text-sm">{gap.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Brief description of what you're submitting"
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
            required
          />
        </div>

        {/* File Upload Section */}
        {submissionType === 'file_upload' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">File *</label>
            <div
              className={`border-2 border-dashed rounded p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-gray-500' 
                  : file 
                    ? 'border-gray-700' 
                    : 'border-gray-800 hover:border-gray-700'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div>
                  <p className="font-mono text-gray-500 text-xs mb-2">FILE_SELECTED</p>
                  <p className="text-white">{file.name}</p>
                  <p className="text-gray-600 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-gray-500 hover:text-white text-sm mt-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-2">
                    Drag and drop or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    accept=".csv,.xlsx,.xls,.pdf,.zip,.json,.txt,.tsv"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-700 text-gray-400 rounded hover:border-gray-600 hover:text-white text-sm"
                  >
                    Browse
                  </button>
                  <p className="text-gray-600 text-xs mt-3">
                    Max 100MB. CSV, Excel, PDF, ZIP, JSON accepted.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tip Content Section */}
        {['tip', 'lead', 'connection'].includes(submissionType) && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <select
                value={formData.tip_category}
                onChange={(e) => setFormData(prev => ({ ...prev, tip_category: e.target.value }))}
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
              >
                {Object.entries(TIP_CATEGORIES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Details *</label>
              <textarea
                value={formData.tip_content}
                onChange={(e) => setFormData(prev => ({ ...prev, tip_content: e.target.value }))}
                placeholder="Describe what you know. Include names, dates, amounts, and supporting details."
                rows={6}
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
                required
              />
              <p className="text-gray-600 text-xs mt-1">
                {formData.tip_content.length} / 50,000 characters
              </p>
            </div>
          </>
        )}

        {/* Related Entities (for connections) */}
        {submissionType === 'connection' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Related Entities</label>
            <div className="space-y-2">
              {formData.related_entities.map((entity, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={entity.type}
                    onChange={(e) => updateEntity(index, 'type', e.target.value)}
                    placeholder="Type"
                    className="flex-1 bg-black border border-gray-700 rounded p-2 text-white text-sm focus:border-gray-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={entity.name}
                    onChange={(e) => updateEntity(index, 'name', e.target.value)}
                    placeholder="Name"
                    className="flex-1 bg-black border border-gray-700 rounded p-2 text-white text-sm focus:border-gray-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={entity.role}
                    onChange={(e) => updateEntity(index, 'role', e.target.value)}
                    placeholder="Relationship"
                    className="flex-1 bg-black border border-gray-700 rounded p-2 text-white text-sm focus:border-gray-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeEntity(index)}
                    className="text-gray-500 hover:text-white px-2"
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addEntity}
                className="text-sm text-gray-500 hover:text-white"
              >
                + Add Entity
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Additional Context</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Any additional context about this data or where it came from"
            rows={3}
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
          />
        </div>

        {/* Source URL */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Source URL</label>
          <input
            type="url"
            value={formData.source_url}
            onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
            placeholder="https://..."
            className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
          />
          <p className="text-gray-600 text-xs mt-1">Where did you get this data?</p>
        </div>

        <hr className="border-gray-800" />

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Email *</label>
            <input
              type="email"
              value={formData.submitter_email}
              onChange={(e) => setFormData(prev => ({ ...prev, submitter_email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
              required
            />
            <p className="text-gray-600 text-xs mt-1">Required. Never displayed.</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Display Name (optional)</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Username for leaderboard"
              className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
            />
            <p className="text-gray-600 text-xs mt-1">Shown on leaderboard if you want credit.</p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="border border-gray-800 p-4 text-sm text-gray-500">
          <p className="text-gray-400 mb-2">Privacy</p>
          <p>
            Your email is collected for follow-up only. It will never be publicly displayed or sold.
            By submitting, you agree to our{' '}
            <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link> and{' '}
            <Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>.
          </p>
        </div>

        {/* Turnstile CAPTCHA */}
        {TURNSTILE_SITE_KEY && (
          <div className="flex justify-center">
            <div
              className="cf-turnstile"
              data-sitekey={TURNSTILE_SITE_KEY}
              data-callback="onTurnstileCallback"
              data-expired-callback="onTurnstileExpired"
              data-theme="dark"
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
          className={`w-full py-3 rounded font-medium text-sm ${
            loading || (!!TURNSTILE_SITE_KEY && !turnstileToken)
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-gray-700 text-white'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <>
      {/* Cloudflare Turnstile Script */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <Suspense fallback={
        <div className="max-w-2xl mx-auto">
          <div className="text-gray-500 py-8">Loading...</div>
        </div>
      }>
        <SubmitFormContent />
      </Suspense>
    </>
  );
}
