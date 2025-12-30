import EmailSignup from '../components/EmailSignup';

export const metadata = {
  title: 'About | SomaliScan',
  description: 'Why I built this government spending tracker',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">About</h1>

      <div className="prose prose-invert prose-gray">
        <div className="text-gray-300 leading-relaxed space-y-4 mb-10">
          <p>I am anon</p>
          <p>
            My ancestors faught in every major American war from 1776 until 1945
          </p>
          <p>
            When I was younger I loved America and everything it stood for but over the years I have grown apathetic
          </p>
          <p>
            The America my ancestors built and died for is now plagued with a parasitic infection of looters that build nothing
          </p>
          <p>
            I am exhasted of playing partisain game and every other retarded game we play
          </p>
          <p>
            I am exhausted of losing 50% of my income to taxes that enrich parasites
          </p>
          <p>
            I am exhausted of the trash in every city, the DEF tank on my truck, the freakazoid eunichs castrating children, the fat people everywhere, the senile old retards in charge of everything, the cheap shit everything is made of, the poison in my food, etc etc etc etc
          </p>
          <p>
            Mainly i'm tired of my money being stolen from me by a fradulent government
          </p>
          <p className="mt-6 text-gray-400">
            This site will be transparent, bipartisain, focused on fraud committed by immigrants who dont speak my language
          </p>
          <p className="text-4xl font-black text-white mt-8 tracking-wide" style={{ fontFamily: 'var(--font-cinzel)' }}>
            I care about one thing: Who stole all of our money
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
          Get notified when new data is added or major fraud cases are published.
        </p>
      </div>
    </div>
  );
}
