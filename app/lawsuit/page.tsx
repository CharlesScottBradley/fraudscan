'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

// Federal district courts with strategic notes
const DISTRICT_COURTS = [
  // Historically favorable for transparency/access claims
  { 
    id: 'ddc',
    name: 'District of Columbia',
    court: 'U.S. District Court for the District of Columbia',
    reason: 'Primary venue for federal agency transparency cases. Most FOIA litigation filed here.',
    favorability: 'high',
  },
  { 
    id: 'sdny',
    name: 'Southern District of New York',
    court: 'U.S. District Court for the Southern District of New York',
    reason: 'Strong transparency precedents. High-profile accountability cases.',
    favorability: 'high',
  },
  { 
    id: 'ndcal',
    name: 'Northern District of California',
    court: 'U.S. District Court for the Northern District of California',
    reason: 'Tech-savvy bench, favorable open data rulings.',
    favorability: 'high',
  },
  { 
    id: 'edva',
    name: 'Eastern District of Virginia',
    court: 'U.S. District Court for the Eastern District of Virginia',
    reason: 'Fast docket ("Rocket Docket"), proximity to federal agencies.',
    favorability: 'moderate',
  },
  { 
    id: 'cdcal',
    name: 'Central District of California',
    court: 'U.S. District Court for the Central District of California',
    reason: 'Large docket, diverse caseload.',
    favorability: 'moderate',
  },
  { 
    id: 'ndill',
    name: 'Northern District of Illinois',
    court: 'U.S. District Court for the Northern District of Illinois',
    reason: 'Strong civil rights tradition.',
    favorability: 'moderate',
  },
  { 
    id: 'dmn',
    name: 'District of Minnesota',
    court: 'U.S. District Court for the District of Minnesota',
    reason: 'Strong open records tradition at state level.',
    favorability: 'moderate',
  },
  { 
    id: 'wdwa',
    name: 'Western District of Washington',
    court: 'U.S. District Court for the Western District of Washington',
    reason: 'Tech-aware bench, progressive transparency rulings.',
    favorability: 'moderate',
  },
];

// Federal agencies commonly sued for transparency
const FEDERAL_AGENCIES = [
  { id: 'hhs', name: 'Department of Health and Human Services', shortName: 'HHS', dataTypes: ['Medicaid payments', 'Medicare fraud', 'childcare subsidies', 'healthcare provider data'] },
  { id: 'sba', name: 'Small Business Administration', shortName: 'SBA', dataTypes: ['PPP loan data', 'EIDL loans', 'disaster loans', 'contractor payments'] },
  { id: 'usda', name: 'Department of Agriculture', shortName: 'USDA', dataTypes: ['SNAP data', 'food program payments', 'farm subsidies', 'WIC payments'] },
  { id: 'treasury', name: 'Department of the Treasury', shortName: 'Treasury', dataTypes: ['Payment data', 'tax expenditures', 'contractor payments'] },
  { id: 'ed', name: 'Department of Education', shortName: 'ED', dataTypes: ['Student loan data', 'Pell grants', 'school funding', 'Title I payments'] },
  { id: 'hud', name: 'Department of Housing and Urban Development', shortName: 'HUD', dataTypes: ['Section 8 payments', 'housing assistance', 'rental subsidies'] },
  { id: 'doj', name: 'Department of Justice', shortName: 'DOJ', dataTypes: ['Grant payments', 'civil rights data', 'prison contractor payments'] },
  { id: 'dol', name: 'Department of Labor', shortName: 'DOL', dataTypes: ['Unemployment insurance', 'job training grants', 'contractor payments'] },
  { id: 'cms', name: 'Centers for Medicare & Medicaid Services', shortName: 'CMS', dataTypes: ['Medicare payments', 'Medicaid reimbursements', 'provider fraud data'] },
  { id: 'omb', name: 'Office of Management and Budget', shortName: 'OMB', dataTypes: ['Government-wide spending data', 'USAspending.gov data'] },
];

// Data categories for the complaint
const DATA_CATEGORIES = [
  { id: 'payments', name: 'Government Payment Data', description: 'Individual payment records to providers, contractors, and beneficiaries' },
  { id: 'providers', name: 'Provider/Contractor Registry', description: 'Complete registry of entities receiving government funds' },
  { id: 'recipients', name: 'Beneficiary Data', description: 'Aggregated data on program recipients (not PII)' },
  { id: 'fraud', name: 'Fraud Investigation Records', description: 'Records of fraud investigations, settlements, and convictions' },
  { id: 'improper', name: 'Improper Payment Data', description: 'Detailed improper payment records by agency and program' },
  { id: 'contracts', name: 'Contract Awards', description: 'Full contract text, amendments, and performance data' },
];

export default function LawsuitPage() {
  const [selectedCourt, setSelectedCourt] = useState('ddc');
  const [selectedAgency, setSelectedAgency] = useState('hhs');
  const [selectedDataCategories, setSelectedDataCategories] = useState<string[]>(['payments', 'providers']);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    plaintiffName: '',
    plaintiffAddress: '',
    plaintiffCity: '',
    plaintiffState: '',
    plaintiffZip: '',
    plaintiffEmail: '',
    plaintiffPhone: '',
    specificDataRequest: '',
    priorFoiaAttempts: '',
  });

  const templateRef = useRef<HTMLPreElement>(null);

  const selectedCourtData = DISTRICT_COURTS.find(c => c.id === selectedCourt);
  const selectedAgencyData = FEDERAL_AGENCIES.find(a => a.id === selectedAgency);

  const toggleDataCategory = (id: string) => {
    setSelectedDataCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const generateComplaint = () => {
    const court = selectedCourtData;
    const agency = selectedAgencyData;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const dataCategories = selectedDataCategories
      .map(id => DATA_CATEGORIES.find(c => c.id === id))
      .filter(Boolean);

    const plaintiffBlock = formData.plaintiffName 
      ? `${formData.plaintiffName}${formData.plaintiffAddress ? `\n${formData.plaintiffAddress}` : ''}${formData.plaintiffCity ? `\n${formData.plaintiffCity}, ${formData.plaintiffState} ${formData.plaintiffZip}` : ''}`
      : '[PLAINTIFF NAME]\n[ADDRESS]\n[CITY, STATE ZIP]';

    return `IN THE UNITED STATES DISTRICT COURT
FOR THE ${court?.name.toUpperCase() || '[DISTRICT]'}

${plaintiffBlock},
                                    
        Plaintiff,
                                    
    v.                              Case No. ____________
                                    
${agency?.name.toUpperCase() || '[AGENCY NAME]'},
and [AGENCY HEAD] in their official capacity
as [TITLE],
                                    
        Defendants.


COMPLAINT FOR DECLARATORY AND INJUNCTIVE RELIEF

Plaintiff brings this action for declaratory and injunctive relief pursuant to 28 U.S.C. §§ 2201-2202, seeking a declaration that certain government spending and accountability data must be publicly available to taxpayers without resort to individual Freedom of Information Act requests.

PRELIMINARY STATEMENT

1. The American people have a fundamental right to know how their tax dollars are spent. This right is enshrined in multiple federal statutes, the First Amendment to the United States Constitution, and the foundational principles of democratic self-governance.

2. Despite clear statutory mandates requiring proactive disclosure of government spending data, Defendant continues to withhold, redact, or delay release of data that should be automatically and freely available to any taxpayer.

3. Plaintiff seeks declaratory judgment establishing that the following categories of data must be proactively disclosed without FOIA requests:
${dataCategories.map((c, i) => `   ${String.fromCharCode(97 + i)}. ${c?.name}: ${c?.description}`).join('\n')}

JURISDICTION AND VENUE

4. This Court has subject matter jurisdiction under 28 U.S.C. § 1331 (federal question) because this action arises under the Constitution and laws of the United States.

5. This Court has jurisdiction to grant declaratory relief under 28 U.S.C. §§ 2201-2202.

6. Venue is proper in this district under 28 U.S.C. § 1391(e) because Defendant is an agency of the United States and a substantial part of the events giving rise to this claim occurred in this district.

PARTIES

7. Plaintiff ${formData.plaintiffName || '[PLAINTIFF NAME]'} is a citizen of the United States and a taxpayer residing at ${formData.plaintiffCity || '[CITY]'}, ${formData.plaintiffState || '[STATE]'}. Plaintiff has a direct interest in the lawful expenditure of federal tax revenues and transparency in government operations.

8. Defendant ${agency?.name || '[AGENCY NAME]'} is a federal agency of the United States government responsible for administering programs funded by taxpayer dollars.

9. Defendant ${agency?.shortName || '[AGENCY HEAD]'} [AGENCY HEAD NAME] is sued in their official capacity as [TITLE] of ${agency?.name || '[AGENCY NAME]'}.

LEGAL FRAMEWORK

A. The Taxpayers Right-To-Know Act (Pub.L. 116-92, 2019)

10. The Taxpayers Right-To-Know Act requires federal agencies to make publicly available on their websites: (1) the number of full-time employees; (2) information on service contracts; and (3) detailed information on programs, including expenditures.

11. This Act reflects Congress's determination that taxpayers have an inherent right to detailed information about how their money is spent without needing to file individual requests.

B. Digital Accountability and Transparency Act of 2014 (DATA Act)

12. The DATA Act, 31 U.S.C. § 6101 note, requires agencies to report spending data in standardized formats and publish it on USAspending.gov.

13. Congress enacted the DATA Act to "improve the quality of data submitted to USAspending.gov" and ensure that "Federal agency spending data are accurate, searchable, and accessible."

14. The DATA Act mandates disclosure of payment-level data including contract and grant recipients, amounts, and purposes—precisely the data Defendant fails to fully disclose.

C. First Amendment Right to Government Information

15. The First Amendment protects the public's right to receive information about government operations. See Richmond Newspapers, Inc. v. Virginia, 448 U.S. 555 (1980); Press-Enterprise Co. v. Superior Court, 478 U.S. 1 (1986).

16. While the First Amendment does not create an absolute right of access to all government information, it does protect access to information about the expenditure of public funds, which is central to democratic self-governance.

D. Constitutional Principles of Accountability

17. The Constitution's structure of separated powers and democratic accountability presupposes that the people can monitor how the government spends their money.

18. As James Madison wrote in Federalist No. 58: "The power over the purse may, in fact, be regarded as the most complete and effectual weapon with which any constitution can arm the immediate representatives of the people."

19. This constitutional principle requires not only that Congress control appropriations, but that the people be able to verify how those appropriations are spent.

FACTUAL ALLEGATIONS

${formData.priorFoiaAttempts ? `20. Prior FOIA Attempts: ${formData.priorFoiaAttempts}` : '20. Despite the clear statutory mandates described above, Defendant fails to proactively disclose the following categories of data:'}

21. Plaintiff seeks access to the following specific data from ${agency?.name || '[AGENCY NAME]'}:
${agency?.dataTypes?.map((dt, i) => `    ${i + 1}. ${dt}`).join('\n') || '    [SPECIFIC DATA TYPES]'}

${formData.specificDataRequest ? `22. Additional specific data requested:\n${formData.specificDataRequest}` : ''}

23. This data directly relates to the expenditure of taxpayer funds and is necessary for the public to evaluate whether those funds are being spent lawfully and effectively.

24. Defendant's failure to proactively disclose this data forces taxpayers to file individual FOIA requests, which are often met with:
    a. Excessive delays beyond statutory deadlines
    b. Overbroad redactions citing inapplicable exemptions
    c. Claims that data is not maintained in searchable format
    d. Prohibitive fee estimates designed to deter requesters

25. These practices frustrate the statutory intent of the Taxpayers Right-To-Know Act and DATA Act, which is to make spending data automatically available.

CLAIMS FOR RELIEF

COUNT I - VIOLATION OF THE TAXPAYERS RIGHT-TO-KNOW ACT

26. Plaintiff incorporates the preceding paragraphs by reference.

27. The Taxpayers Right-To-Know Act requires Defendant to make program and spending information publicly available.

28. Defendant has failed to comply with these requirements by [specific failures].

29. Plaintiff is entitled to declaratory judgment that Defendant must comply with the Act's disclosure requirements.

COUNT II - VIOLATION OF THE DATA ACT

30. Plaintiff incorporates the preceding paragraphs by reference.

31. The DATA Act requires agencies to submit complete and accurate spending data for publication on USAspending.gov.

32. Defendant has failed to comply by [failing to report complete payment-level data / submitting inaccurate data / failing to update data timely].

33. Plaintiff is entitled to declaratory judgment requiring full DATA Act compliance.

COUNT III - FIRST AMENDMENT

34. Plaintiff incorporates the preceding paragraphs by reference.

35. The First Amendment protects the public's right to receive information about government spending necessary for democratic self-governance.

36. By systematically withholding spending data that should be proactively disclosed under federal law, Defendant violates Plaintiff's First Amendment rights.

37. Plaintiff is entitled to declaratory and injunctive relief vindicating these rights.

PRAYER FOR RELIEF

WHEREFORE, Plaintiff respectfully requests that this Court:

A. Declare that the Taxpayers Right-To-Know Act, DATA Act, and First Amendment require Defendant to proactively disclose, without individual FOIA requests, the categories of data identified in this Complaint;

B. Declare that Defendant's current practices of withholding such data violate federal law;

C. Issue a permanent injunction requiring Defendant to:
   1. Publish complete payment-level data on its website and/or USAspending.gov;
   2. Publish a complete registry of providers, contractors, and other entities receiving federal funds;
   3. Update such data on a [monthly/quarterly] basis;
   4. Make such data available in machine-readable format;

D. Award Plaintiff reasonable attorney's fees and costs pursuant to the Equal Access to Justice Act, 28 U.S.C. § 2412;

E. Grant such other relief as the Court deems just and proper.


Dated: ${today}

Respectfully submitted,


____________________________________
${formData.plaintiffName || '[PLAINTIFF NAME]'}
${formData.plaintiffAddress || '[ADDRESS]'}
${formData.plaintiffCity || '[CITY]'}, ${formData.plaintiffState || '[STATE]'} ${formData.plaintiffZip || '[ZIP]'}
${formData.plaintiffEmail || '[EMAIL]'}
${formData.plaintiffPhone || '[PHONE]'}
Pro Se Plaintiff


VERIFICATION

I, ${formData.plaintiffName || '[PLAINTIFF NAME]'}, declare under penalty of perjury that I have read the foregoing Complaint and that the factual allegations therein are true and correct to the best of my knowledge, information, and belief.

Dated: ${today}


____________________________________
${formData.plaintiffName || '[PLAINTIFF NAME]'}
`;
  };

  const handleCopy = async () => {
    const complaint = generateComplaint();
    await navigator.clipboard.writeText(complaint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const complaint = generateComplaint();
    const blob = new Blob([complaint], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaint-${selectedAgency}-${selectedCourt}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        Back to Map
      </Link>

      <h1 className="text-2xl font-bold mb-2">District Court Complaint Generator</h1>
      <p className="text-gray-400 mb-4">
        Generate a federal complaint template for declaratory judgment compelling proactive disclosure of government spending data.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Skip the FOIA runaround—establish binding precedent that this data must be publicly available.
      </p>

      {/* Critical Disclaimer */}
      <div className="border-2 border-red-900/70 bg-red-950/30 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="text-red-500 text-2xl">⚠</div>
          <div>
            <p className="text-red-200 text-base font-bold">IMPORTANT LEGAL DISCLAIMER</p>
            <p className="text-red-300/80 text-xs mt-1">Please read carefully before using this tool</p>
          </div>
        </div>
        
        <div className="space-y-4 text-sm">
          {/* Not Legal Advice */}
          <div className="border-l-2 border-red-800 pl-4">
            <p className="text-red-200/90 font-semibold mb-1">This Is Not Legal Advice</p>
            <p className="text-red-200/70 text-xs leading-relaxed">
              This tool generates an <strong>educational template only</strong>. Nothing on this page constitutes legal advice, 
              creates an attorney-client relationship, or should be relied upon as a substitute for consultation with a 
              licensed attorney in your jurisdiction. The creators, operators, and contributors to this website are not 
              your attorneys and assume no responsibility for your use of this information.
            </p>
          </div>

          {/* Consult an Attorney */}
          <div className="border-l-2 border-red-800 pl-4">
            <p className="text-red-200/90 font-semibold mb-1">Strongly Recommended: Consult a Licensed Attorney</p>
            <p className="text-red-200/70 text-xs leading-relaxed">
              Filing a complaint in federal district court is a <strong>serious legal undertaking</strong> with potentially 
              significant financial and legal consequences. We <strong>strongly recommend</strong> that you consult with a 
              licensed attorney before filing any legal action. Many attorneys offer free or low-cost initial consultations. 
              Legal aid organizations, law school clinics, and bar association referral services may provide assistance to 
              those who cannot afford private counsel.
            </p>
          </div>

          {/* Pro Se Warning */}
          <div className="border-l-2 border-red-800 pl-4">
            <p className="text-red-200/90 font-semibold mb-1">Pro Se Litigation Warning</p>
            <p className="text-red-200/70 text-xs leading-relaxed">
              While individuals have the right to represent themselves (pro se), federal courts hold pro se litigants to 
              <strong> substantially the same procedural and substantive standards as licensed attorneys</strong>. Pro se 
              litigants must comply with all Federal Rules of Civil Procedure, local court rules, and filing requirements. 
              Failure to do so may result in dismissal of your case, adverse judgments, or sanctions. The vast majority of 
              pro se civil cases in federal court are dismissed or result in judgment for the defendant.
            </p>
          </div>

          {/* Financial Risks */}
          <div className="border-l-2 border-red-800 pl-4">
            <p className="text-red-200/90 font-semibold mb-1">Financial Costs and Risks</p>
            <ul className="text-red-200/70 text-xs leading-relaxed list-disc list-inside space-y-1">
              <li><strong>Filing Fee:</strong> Federal court filing fees are currently <strong>$405</strong>. Fee waivers (in forma pauperis) may be available for those who demonstrate financial hardship.</li>
              <li><strong>Service Costs:</strong> You must properly serve all defendants pursuant to FRCP Rule 4, which may incur additional costs.</li>
              <li><strong>Rule 11 Sanctions:</strong> By signing a complaint, you certify under FRCP Rule 11 that your claims are warranted by existing law or a nonfrivolous argument, and that factual contentions have evidentiary support. <strong>Violations can result in monetary sanctions</strong>, including payment of the opposing party&apos;s attorney fees.</li>
              <li><strong>Adverse Costs:</strong> If your case is dismissed as frivolous or you lose at trial, you may be ordered to pay the defendant&apos;s costs.</li>
            </ul>
          </div>

          {/* Novel Legal Theories */}
          <div className="border-l-2 border-red-800 pl-4">
            <p className="text-red-200/90 font-semibold mb-1">Novel and Untested Legal Theories</p>
            <p className="text-red-200/70 text-xs leading-relaxed">
              The legal theories presented in this template are <strong>novel, creative, and largely untested in court</strong>. 
              While they are based on real federal statutes (Taxpayers Right-To-Know Act, DATA Act) and constitutional principles, 
              there is <strong>no guarantee that any court will accept these arguments</strong>. Courts may find that these 
              statutes do not create a private right of action, that plaintiffs lack standing, or that the constitutional 
              arguments are not cognizable. You should conduct independent legal research or consult with an attorney to 
              evaluate the merits of any claim before filing.
            </p>
          </div>

          {/* Standing Issues */}
          <div className="border-l-2 border-red-800 pl-4">
            <p className="text-red-200/90 font-semibold mb-1">Standing and Jurisdictional Issues</p>
            <p className="text-red-200/70 text-xs leading-relaxed">
              Federal courts have strict requirements for <strong>Article III standing</strong>. A plaintiff must demonstrate 
              (1) injury in fact, (2) causation, and (3) redressability. Generalized grievances shared by all taxpayers may 
              not satisfy these requirements. Courts frequently dismiss transparency and access cases for lack of standing. 
              You must be prepared to articulate a concrete, particularized injury.
            </p>
          </div>

          {/* No Warranty */}
          <div className="border-l-2 border-red-800 pl-4">
            <p className="text-red-200/90 font-semibold mb-1">No Warranty or Guarantee</p>
            <p className="text-red-200/70 text-xs leading-relaxed">
              This template is provided <strong>&quot;AS IS&quot; without any warranty</strong>, express or implied. We make no 
              representations regarding the accuracy, completeness, or current applicability of any legal information 
              provided. Laws, rules, and court interpretations change frequently. Information that was accurate when 
              written may no longer be correct. <strong>You are solely responsible</strong> for verifying all legal 
              citations, procedural requirements, and court rules before filing any document.
            </p>
          </div>

          {/* Limitation of Liability */}
          <div className="border-l-2 border-red-800 pl-4">
            <p className="text-red-200/90 font-semibold mb-1">Limitation of Liability</p>
            <p className="text-red-200/70 text-xs leading-relaxed">
              Under no circumstances shall the creators, operators, or contributors to this website be liable for any 
              direct, indirect, incidental, special, consequential, or punitive damages arising from your use of this 
              template or reliance on any information provided, including but not limited to: dismissed cases, sanctions, 
              adverse judgments, attorney fees, lost filing fees, or any other losses or damages.
            </p>
          </div>

          {/* Educational Purpose */}
          <div className="border-l-2 border-green-800 pl-4 bg-green-950/20 py-2 -ml-4 pl-8">
            <p className="text-green-200/90 font-semibold mb-1">Purpose of This Tool</p>
            <p className="text-green-200/70 text-xs leading-relaxed">
              This template is provided for <strong>educational and informational purposes</strong> to promote public 
              awareness of government transparency laws and the legal mechanisms available to citizens seeking access 
              to public information. It is intended to serve as a starting point for discussion with qualified legal 
              counsel, not as a ready-to-file legal document.
            </p>
          </div>
        </div>

        {/* Acknowledgment Note */}
        <div className="mt-6 pt-4 border-t border-red-900/50">
          <p className="text-red-200/60 text-xs text-center">
            By using this template generator, you acknowledge that you have read, understood, and agree to the terms 
            of this disclaimer. If you do not agree, please do not use this tool.
          </p>
        </div>
      </div>

      {/* Strategy Overview */}
      <div className="border border-blue-900/50 bg-blue-950/20 rounded p-4 mb-8">
        <p className="text-blue-200/90 text-sm font-bold mb-2">Legal Strategy Overview</p>
        <div className="text-blue-200/70 text-xs leading-relaxed">
          <p className="mb-2">This complaint seeks declaratory judgment based on:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Taxpayers Right-To-Know Act</strong> (Pub.L. 116-92, 2019) - Requires agencies to disclose spending data</li>
            <li><strong>DATA Act of 2014</strong> - Mandates federal spending data publication on USAspending.gov</li>
            <li><strong>First Amendment</strong> - Right to government information for democratic accountability</li>
            <li><strong>Constitutional Structure</strong> - Separation of powers requires public oversight of spending</li>
          </ul>
          <p className="mt-2">
            The goal is to establish precedent that certain categories of government data must be <em>proactively</em> disclosed, 
            eliminating the need for individual FOIA requests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Court Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Select District Court</label>
            <div className="space-y-2">
              {DISTRICT_COURTS.map(court => (
                <button
                  key={court.id}
                  onClick={() => setSelectedCourt(court.id)}
                  className={`w-full p-3 border rounded text-left transition-colors ${
                    selectedCourt === court.id
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white">{court.name}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                        court.favorability === 'high' 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {court.favorability === 'high' ? 'Favorable' : 'Moderate'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{court.reason}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Agency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Defendant Agency</label>
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
            >
              {FEDERAL_AGENCIES.map(agency => (
                <option key={agency.id} value={agency.id}>
                  {agency.name} ({agency.shortName})
                </option>
              ))}
            </select>
            {selectedAgencyData && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="text-gray-400">Data types:</span> {selectedAgencyData.dataTypes.join(', ')}
              </div>
            )}
          </div>

          {/* Data Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Data Categories Sought</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {DATA_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => toggleDataCategory(category.id)}
                  className={`p-3 border rounded text-left text-sm transition-colors ${
                    selectedDataCategories.includes(category.id)
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium text-white">{category.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Plaintiff Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400">Plaintiff Information</h3>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={formData.plaintiffName}
                onChange={(e) => setFormData(prev => ({ ...prev, plaintiffName: e.target.value }))}
                placeholder="John A. Smith"
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.plaintiffAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, plaintiffAddress: e.target.value }))}
                placeholder="123 Main Street, Apt 4"
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <input
                  type="text"
                  value={formData.plaintiffCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, plaintiffCity: e.target.value }))}
                  placeholder="Minneapolis"
                  className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">State</label>
                <input
                  type="text"
                  value={formData.plaintiffState}
                  onChange={(e) => setFormData(prev => ({ ...prev, plaintiffState: e.target.value }))}
                  placeholder="MN"
                  maxLength={2}
                  className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ZIP</label>
                <input
                  type="text"
                  value={formData.plaintiffZip}
                  onChange={(e) => setFormData(prev => ({ ...prev, plaintiffZip: e.target.value }))}
                  placeholder="55401"
                  className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.plaintiffEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, plaintiffEmail: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.plaintiffPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, plaintiffPhone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prior FOIA Attempts (optional but strengthens case)</label>
              <textarea
                value={formData.priorFoiaAttempts}
                onChange={(e) => setFormData(prev => ({ ...prev, priorFoiaAttempts: e.target.value }))}
                placeholder="On [DATE], Plaintiff submitted a FOIA request for [DATA]. On [DATE], Defendant responded with [excessive redactions / denial / no response]..."
                rows={3}
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Specific Data Requested (optional)</label>
              <textarea
                value={formData.specificDataRequest}
                onChange={(e) => setFormData(prev => ({ ...prev, specificDataRequest: e.target.value }))}
                placeholder="Describe specific data you're seeking that isn't covered by the general categories above..."
                rows={3}
                className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none resize-y"
              />
            </div>
          </div>

          {/* Generated Template */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-400">Generated Complaint</label>
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
              className="bg-gray-900 border border-gray-800 p-4 rounded text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto font-mono max-h-[600px] overflow-y-auto"
            >
              {generateComplaint()}
            </pre>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Filing Checklist */}
          <div className="border border-gray-800 p-4">
            <h3 className="font-medium mb-3">Filing Checklist</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-gray-600">1.</span>
                <span>Review and customize complaint</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-600">2.</span>
                <span>Consult with attorney (recommended)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-600">3.</span>
                <span>Prepare Civil Cover Sheet (JS-44)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-600">4.</span>
                <span>Pay $405 filing fee or file IFP motion</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-600">5.</span>
                <span>File via CM/ECF or in person</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-600">6.</span>
                <span>Serve defendants per FRCP 4</span>
              </li>
            </ul>
          </div>

          {/* Key Statutes */}
          <div className="border border-gray-800 p-4">
            <h3 className="font-medium mb-3">Key Statutes</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white text-xs font-mono">Taxpayers Right-To-Know Act</p>
                <p className="text-gray-500 text-xs">Pub.L. 116-92, Title XVII (2019)</p>
              </div>
              <div>
                <p className="text-white text-xs font-mono">DATA Act</p>
                <p className="text-gray-500 text-xs">31 U.S.C. § 6101 note (2014)</p>
              </div>
              <div>
                <p className="text-white text-xs font-mono">Declaratory Judgment Act</p>
                <p className="text-gray-500 text-xs">28 U.S.C. §§ 2201-2202</p>
              </div>
              <div>
                <p className="text-white text-xs font-mono">Equal Access to Justice</p>
                <p className="text-gray-500 text-xs">28 U.S.C. § 2412</p>
              </div>
            </div>
          </div>

          {/* Key Cases */}
          <div className="border border-gray-800 p-4">
            <h3 className="font-medium mb-3">Supporting Precedent</h3>
            <div className="space-y-3 text-xs text-gray-400">
              <div>
                <p className="text-white">Richmond Newspapers v. Virginia</p>
                <p className="text-gray-500">448 U.S. 555 (1980)</p>
                <p className="mt-1">First Amendment right of access to government proceedings</p>
              </div>
              <div>
                <p className="text-white">Press-Enterprise Co. v. Superior Court</p>
                <p className="text-gray-500">478 U.S. 1 (1986)</p>
                <p className="mt-1">Public right to information about government operations</p>
              </div>
              <div>
                <p className="text-white">ACLU v. CIA</p>
                <p className="text-gray-500">710 F.3d 422 (D.C. Cir. 2013)</p>
                <p className="mt-1">Limits on government secrecy claims</p>
              </div>
            </div>
          </div>

          {/* Venue Strategy */}
          <div className="border border-gray-800 p-4">
            <h3 className="font-medium mb-3">Venue Strategy</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              File in multiple favorable districts simultaneously to increase chances of favorable ruling and create 
              circuit split if needed. D.C. District is traditional venue for federal transparency cases. 9th Circuit 
              (NDCA, CDCA) historically favorable on access issues.
            </p>
          </div>

          {/* Resources */}
          <div className="border border-gray-800 p-4">
            <h3 className="font-medium mb-3">Resources</h3>
            <div className="space-y-2 text-xs">
              <a 
                href="https://www.uscourts.gov/forms/pro-se-forms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-green-500 hover:underline"
              >
                Federal Pro Se Forms
              </a>
              <a 
                href="https://www.law.cornell.edu/rules/frcp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-green-500 hover:underline"
              >
                Federal Rules of Civil Procedure
              </a>
              <a 
                href="https://www.usaspending.gov/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-green-500 hover:underline"
              >
                USAspending.gov (DATA Act portal)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

