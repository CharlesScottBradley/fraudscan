'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CorrectionsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    entityName: '',
    pageUrl: '',
    currentInfo: '',
    correctedInfo: '',
    documentation: '',
    additionalContext: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API
    // For now, generate a mailto link
    const subject = encodeURIComponent(`Correction Request: ${formData.entityName}`);
    const body = encodeURIComponent(`
CORRECTION REQUEST
==================

Contact Information:
- Name: ${formData.name}
- Email: ${formData.email}

Entity/Record:
- Entity Name: ${formData.entityName}
- Page URL: ${formData.pageUrl}

Current Information Displayed:
${formData.currentInfo}

Correct Information:
${formData.correctedInfo}

Supporting Documentation:
${formData.documentation}

Additional Context:
${formData.additionalContext}
    `.trim());
    
    window.location.href = `mailto:corrections@somaliscan.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Request a Correction</h1>
      <p className="text-gray-400 mb-8">
        We strive for accuracy in all information displayed. If you believe information about you or your 
        organization is inaccurate, please submit a correction request below.
      </p>

      {/* Important Notice */}
      <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded mb-8">
        <h3 className="text-blue-200/90 font-semibold mb-2">Before You Submit</h3>
        <ul className="text-blue-200/70 text-sm space-y-2">
          <li>
            <strong>Public Records:</strong> Most data on this site comes from government sources. For corrections 
            to government records, you should also contact the original source agency.
          </li>
          <li>
            <strong>Documentation Required:</strong> Please provide documentation supporting your correction 
            (e.g., official records, court documents, license certificates).
          </li>
          <li>
            <strong>Review Process:</strong> We review all requests in good faith but cannot guarantee changes. 
            We are under no obligation to remove accurate public record information.
          </li>
        </ul>
      </div>

      {submitted ? (
        <div className="bg-green-950/30 border border-green-900/50 p-6 rounded text-center">
          <p className="text-green-200/90 text-lg font-medium mb-2">Email Client Opened</p>
          <p className="text-green-200/70 text-sm">
            Your email client should have opened with the correction request. If it didn&apos;t open, 
            please email <a href="mailto:corrections@somaliscan.com" className="text-green-500 hover:underline">corrections@somaliscan.com</a> directly.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 text-sm text-gray-400 hover:text-white"
          >
            Submit another request
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 border-b border-gray-800 pb-2">Your Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          </div>

          {/* Record Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 border-b border-gray-800 pb-2">Record Information</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Entity/Business Name *</label>
              <input
                type="text"
                required
                value={formData.entityName}
                onChange={(e) => setFormData(prev => ({ ...prev, entityName: e.target.value }))}
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                placeholder="ABC Childcare Center LLC"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Page URL (if known)</label>
              <input
                type="url"
                value={formData.pageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, pageUrl: e.target.value }))}
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                placeholder="https://somaliscan.com/provider/..."
              />
            </div>
          </div>

          {/* Correction Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 border-b border-gray-800 pb-2">Correction Details</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Current Information Displayed *</label>
              <textarea
                required
                value={formData.currentInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, currentInfo: e.target.value }))}
                rows={3}
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
                placeholder="Describe what is currently displayed that you believe is inaccurate..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Correct Information *</label>
              <textarea
                required
                value={formData.correctedInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, correctedInfo: e.target.value }))}
                rows={3}
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
                placeholder="Provide the correct information that should be displayed..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Supporting Documentation *</label>
              <textarea
                required
                value={formData.documentation}
                onChange={(e) => setFormData(prev => ({ ...prev, documentation: e.target.value }))}
                rows={3}
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
                placeholder="Describe documentation you can provide (official records, certificates, court documents). You can attach files to the email that opens."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Additional Context (optional)</label>
              <textarea
                value={formData.additionalContext}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalContext: e.target.value }))}
                rows={2}
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
                placeholder="Any additional information that may help us process your request..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded transition-colors"
            >
              Open Email with Correction Request
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              This will open your email client with a pre-filled message to corrections@somaliscan.com
            </p>
          </div>
        </form>
      )}

      {/* Alternative Contact */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <h3 className="font-medium mb-3">Alternative Contact Methods</h3>
        <p className="text-gray-400 text-sm mb-4">
          If you prefer, you can contact us directly:
        </p>
        <div className="bg-gray-900 p-4 rounded text-sm space-y-2">
          <p className="text-gray-300">
            <strong>Corrections:</strong>{' '}
            <a href="mailto:corrections@somaliscan.com" className="text-green-500 hover:underline">corrections@somaliscan.com</a>
          </p>
          <p className="text-gray-300">
            <strong>General Inquiries:</strong>{' '}
            <a href="mailto:admin@somaliscan.com" className="text-green-500 hover:underline">admin@somaliscan.com</a>
          </p>
        </div>
      </div>

      {/* Footer navigation */}
      <div className="mt-12 pt-8 border-t border-gray-800 flex gap-6 text-sm">
        <Link href="/terms" className="text-gray-500 hover:text-white">Terms of Use</Link>
        <Link href="/privacy" className="text-gray-500 hover:text-white">Privacy Policy</Link>
        <Link href="/" className="text-gray-500 hover:text-white">Back to Home</Link>
      </div>
    </div>
  );
}

