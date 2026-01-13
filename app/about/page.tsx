import EmailSignup from '../components/EmailSignup';

export const metadata = {
  title: 'About | SomaliScan',
  description: 'Government spending transparency - one place to see where taxpayer money goes',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">About</h1>

      <div className="prose prose-invert prose-gray">
        <div className="text-gray-300 leading-relaxed space-y-4 mb-10">
          <p className="text-xl text-white">
            One place to see where taxpayer money goes.
          </p>
          <p>
            Government spending data is public but scattered across hundreds of websites,
            PDFs, and FOIA responses. We aggregate it into one searchable database so
            anyone can follow the money.
          </p>
          <p>
            We link entities across datasets - the same organization receiving state contracts,
            federal grants, and PPP loans appears as one profile, not three separate records.
          </p>
          <p className="text-gray-400">
            Fraud detection is one tool we provide, not the mission. Transparency is the foundation.
          </p>
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-4 text-white">Data Coverage</h2>
        <div className="space-y-4 text-gray-400">
          <div>
            <h3 className="text-white text-sm font-medium mb-1">State Spending</h3>
            <ul className="space-y-1 text-sm">
              <li>138M+ state checkbook transactions</li>
              <li>5.7M state employee salary records</li>
              <li>State budget and grant data</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-sm font-medium mb-1">Political Money</h3>
            <ul className="space-y-1 text-sm">
              <li>58M federal campaign contributions (FEC)</li>
              <li>96M state campaign contributions</li>
              <li>PAC, politician, and donor profiles</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-sm font-medium mb-1">Healthcare</h3>
            <ul className="space-y-1 text-sm">
              <li>28M Open Payments (pharma to physicians)</li>
              <li>Medicaid provider data</li>
              <li>Nursing home ownership records</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-sm font-medium mb-1">Federal Programs</h3>
            <ul className="space-y-1 text-sm">
              <li>5.2M federal grant records</li>
              <li>7.5M PPP loans (historical COVID program)</li>
              <li>1.8M SBA loans</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-sm font-medium mb-1">Entities</h3>
            <ul className="space-y-1 text-sm">
              <li>8M+ organizations in unified registry</li>
              <li>660K SNAP retailers</li>
              <li>161K childcare providers</li>
            </ul>
          </div>
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-4 text-white">Roadmap</h2>
        <ul className="text-gray-400 space-y-2">
          <li>USASpending.gov federal contracts integration</li>
          <li>More state checkbook coverage (targeting all 50)</li>
          <li>Local government spending (cities, counties)</li>
          <li>Medicare/Medicaid claims data</li>
          <li>Childcare subsidy payment data</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-4 text-white">Contact</h2>
        <p className="text-gray-400">
          Questions, tips, data corrections, or want to contribute?{' '}
          <a href="mailto:admin@somaliscan.com" className="text-green-500 hover:underline">
            admin@somaliscan.com
          </a>
        </p>
        <p className="text-gray-400 mt-2">
          Follow updates on{' '}
          <a href="https://beaverdata.substack.com" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
            Substack
          </a>
        </p>

        <EmailSignup
          source="about"
          variant="block"
          label="Stay Informed"
        />
        <p className="text-gray-600 text-sm mt-2">
          Get notified when new spending data is added.
        </p>
      </div>
    </div>
  );
}
