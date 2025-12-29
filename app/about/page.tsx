export const metadata = {
  title: 'About | SomaliScan',
  description: 'Why I built this government spending tracker',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">About</h1>

      <div className="prose prose-invert prose-gray">
        <p className="text-gray-300 leading-relaxed mb-6">
          I made this site originally to visualize{' '}
          <a
            href="https://twitter.com/nickshirley_"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:underline"
          >
            Nick Shirley&apos;s
          </a>{' '}
          findings on the Minnesota daycare fraud scheme, but I quickly realized there is no
          cohesive database to track government spending.
        </p>

        <p className="text-gray-300 leading-relaxed mb-6">
          I believe the Minnesota daycare fraud is just the tip of the iceberg. So I&apos;m
          expanding this site with the goal of tracking <strong className="text-white">all</strong>{' '}
          government loans, subsidies, and spending to businesses, as well as political donations.
        </p>

        <p className="text-gray-300 leading-relaxed mb-6">
          The end goal is a comprehensive map showing you exactly where your tax dollars are going.
        </p>

        <div className="border-l-2 border-green-600 pl-6 my-8">
          <p className="text-xl font-bold text-white leading-relaxed">
            I do not care about loyalty to party, state, politician, or president. I care about
            America.
          </p>
          <p className="text-xl font-bold text-white leading-relaxed mt-4">
            Specifically, why I am paying almost 50% of my income in taxes to a government that is,
            by every measure, incompetent.
          </p>
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-4 text-white">Current Data Sources</h2>
        <ul className="text-gray-400 space-y-2">
          <li>State childcare licensing databases</li>
          <li>PPP loan data (SBA)</li>
          <li>Federal campaign contribution records (FEC)</li>
          <li>State campaign finance databases</li>
          <li>Court records and DOJ press releases</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-4 text-white">Roadmap</h2>
        <ul className="text-gray-400 space-y-2">
          <li>Add more state subsidy programs (SNAP, housing, etc.)</li>
          <li>Cross-reference business owners with political donations</li>
          <li>Integrate federal contract data (USAspending.gov)</li>
          <li>Build anomaly detection for suspicious patterns</li>
          <li>Expand to all 50 states</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-4 text-white">Contact</h2>
        <p className="text-gray-400">
          Questions, tips, or want to help?{' '}
          <a href="mailto:admin@somaliscan.com" className="text-green-500 hover:underline">
            admin@somaliscan.com
          </a>
        </p>
      </div>
    </div>
  );
}
