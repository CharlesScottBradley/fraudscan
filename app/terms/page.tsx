import Link from 'next/link';

export const metadata = {
  title: 'Terms of Use | SomaliScan',
  description: 'Terms of Use and Legal Disclaimers for SomaliScan',
};

export default function TermsPage() {
  const lastUpdated = 'December 30, 2024';

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Terms of Use</h1>
      <p className="text-gray-500 text-sm mb-8">Last Updated: {lastUpdated}</p>

      <div className="prose prose-invert prose-sm max-w-none space-y-8">
        
        {/* Introduction */}
        <section>
          <p className="text-gray-300 leading-relaxed">
            Welcome to SomaliScan (&quot;the Site,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using this 
            website, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not 
            use this Site.
          </p>
        </section>

        {/* Nature of the Site */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">1. Nature of the Site</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            SomaliScan is a public interest research tool that aggregates publicly available government data related to 
            childcare providers, healthcare facilities, government loans, political donations, and related fraud cases. 
            Our mission is to promote government transparency and enable citizens to understand how public funds are spent.
          </p>
          <p className="text-gray-300 leading-relaxed">
            The Site is operated as a <strong>journalism and public accountability project</strong>. We compile, organize, 
            and present data that is already part of the public record.
          </p>
        </section>

        {/* No Accusation of Wrongdoing */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">2. No Accusation of Wrongdoing</h2>
          <div className="bg-yellow-950/30 border border-yellow-900/50 p-4 rounded mb-4">
            <p className="text-yellow-200/80 text-sm leading-relaxed">
              <strong>IMPORTANT:</strong> The presence of any individual, business, or organization on this Site does 
              <strong> NOT</strong> constitute an accusation, allegation, or implication of fraud, wrongdoing, or illegal activity.
            </p>
          </div>
          <p className="text-gray-300 leading-relaxed mb-3">
            This Site aggregates public data from government sources. Many entities appear on this Site simply because 
            they have received government funding, hold licenses, or are otherwise part of public records. Being listed 
            on this Site carries no negative connotation.
          </p>
          <p className="text-gray-300 leading-relaxed mb-3">
            Where we display information about fraud cases or legal proceedings, we are reporting matters of public record. 
            Individuals charged with crimes are presumed innocent until proven guilty in a court of law.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Terms such as &quot;fraud-prone,&quot; &quot;flagged,&quot; or &quot;suspicious&quot; used on this Site refer to statistical 
            indicators or pattern analysis based on public data. They do not represent conclusions of fact, legal 
            determinations, or accusations of wrongdoing.
          </p>
        </section>

        {/* Data Sources and Accuracy */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">3. Data Sources and Accuracy</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            Data displayed on this Site is sourced from publicly available government databases, including but not limited to:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4 ml-4">
            <li>State childcare licensing databases</li>
            <li>Small Business Administration (SBA) loan data</li>
            <li>Federal Election Commission (FEC) contribution records</li>
            <li>Department of Justice press releases and court records</li>
            <li>USAspending.gov and other federal spending databases</li>
            <li>State transparency portals and FOIA responses</li>
            <li>Centers for Medicare & Medicaid Services (CMS) data</li>
          </ul>
          <div className="bg-red-950/30 border border-red-900/50 p-4 rounded">
            <p className="text-red-200/80 text-sm leading-relaxed mb-2">
              <strong>DATA ACCURACY DISCLAIMER:</strong>
            </p>
            <ul className="list-disc list-inside text-red-200/70 text-xs space-y-1 ml-2">
              <li>We make <strong>no warranty</strong> regarding the accuracy, completeness, or timeliness of any data</li>
              <li>Government source data may contain errors, and our aggregation process may introduce additional errors</li>
              <li>Data may be outdated—records change, licenses are renewed or revoked, cases are resolved</li>
              <li>You should <strong>independently verify</strong> any information before relying on it</li>
              <li>We are not responsible for errors in source data or our presentation of it</li>
            </ul>
          </div>
        </section>

        {/* Not Legal, Financial, or Professional Advice */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">4. Not Legal, Financial, or Professional Advice</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            Nothing on this Site constitutes legal advice, financial advice, or any other form of professional advice. 
            The Site is for <strong>informational and educational purposes only</strong>.
          </p>
          <p className="text-gray-300 leading-relaxed mb-3">
            The FOIA Request Generator and District Court Complaint Generator are <strong>template tools</strong> designed 
            to assist with public records requests and promote government transparency. They do not create an attorney-client 
            relationship and should not be used as substitutes for professional legal counsel.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Before taking any legal action, filing any documents with courts or agencies, making financial decisions, 
            or relying on information from this Site, you should consult with appropriately licensed professionals.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">5. Limitation of Liability</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            TO THE FULLEST EXTENT PERMITTED BY LAW, THE SITE, ITS OPERATORS, CONTRIBUTORS, AND AFFILIATES SHALL NOT BE 
            LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4 ml-4">
            <li>Your use of or inability to use the Site</li>
            <li>Any errors, omissions, or inaccuracies in the data presented</li>
            <li>Any decisions made or actions taken based on information from this Site</li>
            <li>Any reputational harm arising from the display of public records</li>
            <li>Use of the FOIA or lawsuit template generators</li>
            <li>Third-party actions based on information obtained from this Site</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            This limitation applies regardless of the theory of liability (contract, tort, negligence, strict liability, 
            or otherwise) and even if we have been advised of the possibility of such damages.
          </p>
        </section>

        {/* Indemnification */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">6. Indemnification</h2>
          <p className="text-gray-300 leading-relaxed">
            You agree to indemnify, defend, and hold harmless the Site and its operators from any claims, damages, 
            losses, costs, or expenses (including reasonable attorney fees) arising from your use of the Site, your 
            violation of these Terms, or your violation of any rights of another party.
          </p>
        </section>

        {/* Corrections and Removal Requests */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">7. Corrections and Removal Requests</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            We strive for accuracy and will consider requests to correct factual errors. If you believe information 
            about you or your organization is inaccurate, please contact us at{' '}
            <a href="mailto:corrections@somaliscan.com" className="text-green-500 hover:underline">corrections@somaliscan.com</a>{' '}
            with:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4 ml-4">
            <li>The specific information you believe is inaccurate</li>
            <li>Documentation supporting the correction</li>
            <li>Your contact information for follow-up</li>
          </ul>
          <p className="text-gray-300 leading-relaxed mb-3">
            We will review requests in good faith. However, we are under no obligation to remove accurate public 
            record information, and we reserve the right to decline requests that we determine are not supported by 
            evidence or are inconsistent with our public interest mission.
          </p>
          <p className="text-gray-300 leading-relaxed">
            For information derived from government sources, corrections should generally be sought from the original 
            source agency.
          </p>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">8. Intellectual Property</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            The Site&apos;s design, code, and original content are protected by copyright. However, the underlying 
            government data is public information and is not subject to our copyright.
          </p>
          <p className="text-gray-300 leading-relaxed">
            You may use data from this Site for journalistic, research, or personal purposes with appropriate attribution. 
            Commercial use of our aggregated datasets requires prior written permission.
          </p>
        </section>

        {/* User-Submitted Content */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">9. User-Submitted Content</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            If you submit tips, corrections, or other content to the Site, you represent that the information is 
            truthful to the best of your knowledge. You grant us a non-exclusive, royalty-free license to use, 
            investigate, and publish such information in connection with our public interest mission.
          </p>
          <p className="text-gray-300 leading-relaxed">
            We do not guarantee that tips will be investigated or published. We reserve the right to decline or 
            remove any user-submitted content at our discretion.
          </p>
        </section>

        {/* Third-Party Links */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">10. Third-Party Links</h2>
          <p className="text-gray-300 leading-relaxed">
            This Site may contain links to third-party websites, including government databases and news sources. 
            These links are provided for convenience and do not constitute endorsement. We are not responsible for 
            the content, accuracy, or practices of third-party sites.
          </p>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">11. Governing Law</h2>
          <p className="text-gray-300 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the State of Minnesota, 
            without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of 
            the Site shall be resolved in the state or federal courts located in Hennepin County, Minnesota.
          </p>
        </section>

        {/* Changes to Terms */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">12. Changes to Terms</h2>
          <p className="text-gray-300 leading-relaxed">
            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting 
            to the Site. Your continued use of the Site after any changes constitutes acceptance of the modified Terms. 
            We encourage you to review these Terms periodically.
          </p>
        </section>

        {/* Severability */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">13. Severability</h2>
          <p className="text-gray-300 leading-relaxed">
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited 
            or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">14. Contact Information</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            For questions about these Terms or to report concerns, please contact:
          </p>
          <div className="bg-gray-900 p-4 rounded text-sm">
            <p className="text-gray-300">Email: <a href="mailto:admin@somaliscan.com" className="text-green-500 hover:underline">admin@somaliscan.com</a></p>
            <p className="text-gray-300">Corrections: <a href="mailto:corrections@somaliscan.com" className="text-green-500 hover:underline">corrections@somaliscan.com</a></p>
          </div>
        </section>

      </div>

      {/* Footer navigation */}
      <div className="mt-12 pt-8 border-t border-gray-800 flex gap-6 text-sm">
        <Link href="/privacy" className="text-gray-500 hover:text-white">Privacy Policy</Link>
        <Link href="/corrections" className="text-gray-500 hover:text-white">Request Correction</Link>
        <Link href="/" className="text-gray-500 hover:text-white">Back to Home</Link>
      </div>
    </div>
  );
}

