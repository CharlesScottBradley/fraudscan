import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | SomaliScan',
  description: 'Privacy Policy for SomaliScan',
};

export default function PrivacyPage() {
  const lastUpdated = 'December 30, 2024';

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last Updated: {lastUpdated}</p>

      <div className="prose prose-invert prose-sm max-w-none space-y-8">

        {/* Introduction */}
        <section>
          <p className="text-gray-300 leading-relaxed">
            This Privacy Policy describes how SomaliScan (&quot;the Site,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, 
            uses, and shares information when you use our website. By using the Site, you agree to the practices 
            described in this policy.
          </p>
        </section>

        {/* Information We Collect */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">1. Information We Collect</h2>
          
          <h3 className="text-lg font-medium text-white mt-4 mb-2">Information You Provide</h3>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4 ml-4">
            <li><strong>Tips and Reports:</strong> If you submit a tip or report, we collect the information you provide, which may include your name and contact information if you choose to provide it.</li>
            <li><strong>Correction Requests:</strong> If you request a correction, we collect your contact information and any documentation you submit.</li>
            <li><strong>Template Generators:</strong> Information entered into our FOIA or lawsuit template generators is processed locally in your browser and is not transmitted to or stored on our servers.</li>
          </ul>

          <h3 className="text-lg font-medium text-white mt-4 mb-2">Information Collected Automatically</h3>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4 ml-4">
            <li><strong>Analytics:</strong> We use Vercel Analytics to collect anonymous usage data, including pages visited, time on site, and general geographic region.</li>
            <li><strong>Log Data:</strong> Our servers may automatically collect IP addresses, browser type, referring URLs, and access times for security and operational purposes.</li>
          </ul>
        </section>

        {/* How We Use Information */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">2. How We Use Information</h2>
          <p className="text-gray-300 leading-relaxed mb-3">We use collected information to:</p>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4 ml-4">
            <li>Operate and improve the Site</li>
            <li>Respond to tips, correction requests, and inquiries</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Protect against fraud, abuse, and security threats</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        {/* Information Sharing */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">3. Information Sharing</h2>
          <p className="text-gray-300 leading-relaxed mb-3">We do not sell your personal information. We may share information:</p>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4 ml-4">
            <li><strong>With Service Providers:</strong> We use Vercel for hosting and analytics. These providers process data on our behalf under appropriate agreements.</li>
            <li><strong>For Legal Compliance:</strong> We may disclose information if required by law, subpoena, or court order.</li>
            <li><strong>To Protect Rights:</strong> We may share information to protect our rights, safety, or property, or that of our users or others.</li>
          </ul>
        </section>

        {/* Public Records Displayed */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">4. Public Records Displayed on This Site</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            This Site displays publicly available government data about individuals and organizations. This data is 
            sourced from government databases and is already part of the public record. We do not consider the 
            display of public records to implicate the privacy interests covered by this policy.
          </p>
          <p className="text-gray-300 leading-relaxed">
            If you have concerns about public records displayed on this Site, please see our{' '}
            <Link href="/terms" className="text-green-500 hover:underline">Terms of Use</Link> for information about 
            correction requests.
          </p>
        </section>

        {/* Cookies */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">5. Cookies and Similar Technologies</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            We use minimal cookies for essential site functionality. Our analytics provider (Vercel) may use cookies 
            or similar technologies to collect anonymous usage data. You can control cookies through your browser settings.
          </p>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">6. Data Retention</h2>
          <p className="text-gray-300 leading-relaxed">
            We retain information for as long as necessary to fulfill the purposes described in this policy, unless 
            a longer retention period is required by law. Anonymous analytics data may be retained indefinitely.
          </p>
        </section>

        {/* Security */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">7. Security</h2>
          <p className="text-gray-300 leading-relaxed">
            We implement reasonable security measures to protect information from unauthorized access, alteration, or 
            destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        {/* Children */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">8. Children&apos;s Privacy</h2>
          <p className="text-gray-300 leading-relaxed">
            This Site is not directed to children under 13. We do not knowingly collect personal information from 
            children under 13. If you believe we have collected information from a child under 13, please contact us.
          </p>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">9. Your Rights</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            Depending on your jurisdiction, you may have rights regarding your personal information, including:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4 ml-4">
            <li>Right to access information we hold about you</li>
            <li>Right to request correction of inaccurate information</li>
            <li>Right to request deletion of your information</li>
            <li>Right to opt out of certain data processing</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            To exercise these rights, please contact us at{' '}
            <a href="mailto:privacy@somaliscan.com" className="text-green-500 hover:underline">privacy@somaliscan.com</a>.
          </p>
        </section>

        {/* California Residents */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">10. California Residents</h2>
          <p className="text-gray-300 leading-relaxed">
            California residents may have additional rights under the California Consumer Privacy Act (CCPA). We do 
            not sell personal information. For questions about your California privacy rights, please contact us.
          </p>
        </section>

        {/* International Users */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">11. International Users</h2>
          <p className="text-gray-300 leading-relaxed">
            This Site is operated from the United States. If you access the Site from outside the U.S., your 
            information may be transferred to and processed in the U.S., where privacy laws may differ from your jurisdiction.
          </p>
        </section>

        {/* Changes */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">12. Changes to This Policy</h2>
          <p className="text-gray-300 leading-relaxed">
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated 
            &quot;Last Updated&quot; date. Your continued use of the Site after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">13. Contact Us</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            For questions about this Privacy Policy, please contact:
          </p>
          <div className="bg-gray-900 p-4 rounded text-sm">
            <p className="text-gray-300">Email: <a href="mailto:privacy@somaliscan.com" className="text-green-500 hover:underline">privacy@somaliscan.com</a></p>
          </div>
        </section>

      </div>

      {/* Footer navigation */}
      <div className="mt-12 pt-8 border-t border-gray-800 flex gap-6 text-sm">
        <Link href="/terms" className="text-gray-500 hover:text-white">Terms of Use</Link>
        <Link href="/corrections" className="text-gray-500 hover:text-white">Request Correction</Link>
        <Link href="/" className="text-gray-500 hover:text-white">Back to Home</Link>
      </div>
    </div>
  );
}

