import Link from 'next/link';

export const metadata = {
  title: 'Hawala Money Brokers - MN & OH | SomaliScan',
  description: 'Licensed money transfer businesses in Minnesota and Ohio',
  robots: 'noindex, nofollow', // Don't index this page
};

interface MoneyBroker {
  legalName: string;
  dbaName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  notes: string;
}

const brokers: MoneyBroker[] = [
  // Minnesota
  {
    legalName: "AMAL MONEY WIRE, LLC",
    dbaName: "",
    address: "1806 Riverside Ave S Ste 1",
    city: "Minneapolis",
    state: "MN",
    zip: "55454",
    phone: "(612) 332-6893",
    email: "",
    website: "",
    notes: "Cedar-Riverside (Little Mogadishu). Also at 2940 Pillsbury Ave (612) 822-2459. Hours: Mon-Sun 10am-7pm"
  },
  {
    legalName: "HODAN GLOBAL MONEY SERVICES, INC.",
    dbaName: "TaajPay",
    address: "2910 Pillsbury Ave S Ste 208A",
    city: "Minneapolis",
    state: "MN",
    zip: "55408",
    phone: "(612) 822-6800",
    email: "",
    website: "",
    notes: "Also known as TAAJ/TaajPay. Multiple locations: 417 E Lake St, 912 E 24th St A123"
  },
  {
    legalName: "Ramad Pay Inc.",
    dbaName: "",
    address: "2429 E Franklin Avenue",
    city: "Minneapolis",
    state: "MN",
    zip: "55406",
    phone: "(888) 611-0753",
    email: "info@ramadpay.com",
    website: "ramadpay.com",
    notes: "Formerly Kaah Express F.S. Inc (est. 2001). Serves 120+ countries. Alt: (612) 338-2116"
  },
  {
    legalName: "IFTIN TRADING, LLC",
    dbaName: "IFTIN EXPRESS",
    address: "2828 Lyndale Ave South Unit 1",
    city: "Minneapolis",
    state: "MN",
    zip: "55408",
    phone: "",
    email: "",
    website: "iftinremit.com",
    notes: "Also at 1817 Nicollet Ave Ste 300. A+ BBB rating. Serves Somalia, Kenya, Uganda, UAE, Saudi Arabia"
  },
  {
    legalName: "Gool Pay Inc",
    dbaName: "GoolPay",
    address: "1821 University Ave W Suite 149",
    city: "Saint Paul",
    state: "MN",
    zip: "55104",
    phone: "",
    email: "",
    website: "",
    notes: "24/7 customer support. App-based transfers. All 50 states."
  },
  {
    legalName: "Beeso Corp.",
    dbaName: "PaySii",
    address: "2626 E. 82nd St. Suite 101",
    city: "Bloomington",
    state: "MN",
    zip: "55425",
    phone: "",
    email: "feedback@paysii.freshdesk.com",
    website: "",
    notes: "47 states coverage. 24hr customer care"
  },
  {
    legalName: "AMAANA MONEY TRANSFER, CO",
    dbaName: "",
    address: "139 West Lake St",
    city: "Minneapolis",
    state: "MN",
    zip: "55408",
    phone: "",
    email: "",
    website: "",
    notes: "Lake Street area"
  },
  {
    legalName: "Barako Pay Inc",
    dbaName: "",
    address: "9001 E Bloomington Fwy Suite 116",
    city: "Bloomington",
    state: "MN",
    zip: "55420",
    phone: "",
    email: "",
    website: "",
    notes: "Operates in GA, ME, MN, NE, WA"
  },
  {
    legalName: "Damal Express LLC",
    dbaName: "",
    address: "3544 3rd Ave S",
    city: "Minneapolis",
    state: "MN",
    zip: "55408",
    phone: "",
    email: "",
    website: "",
    notes: "Somali remittance"
  },
  {
    legalName: "Hilaac Global Express Inc.",
    dbaName: "",
    address: "2833 13th Ave South #114",
    city: "Minneapolis",
    state: "MN",
    zip: "55407",
    phone: "",
    email: "",
    website: "",
    notes: "Somali remittance"
  },
  {
    legalName: "JUBAXPRESS, INC",
    dbaName: "",
    address: "2910 Pillsbury Ave S Ste 78A",
    city: "Minneapolis",
    state: "MN",
    zip: "55408",
    phone: "",
    email: "",
    website: "",
    notes: "Same building as Hodan Global"
  },
  {
    legalName: "RASMI PAY LLC",
    dbaName: "",
    address: "8053 E Bloomington Fwy Suite 200",
    city: "Bloomington",
    state: "MN",
    zip: "55420",
    phone: "",
    email: "",
    website: "",
    notes: "Operates in 20+ states"
  },
  // Ohio
  {
    legalName: "Dahabshil, Inc.",
    dbaName: "Dahabshiil",
    address: "240 Bradenton Avenue",
    city: "Dublin",
    state: "OH",
    zip: "43017",
    phone: "1-866-428-7799",
    email: "customer.support@dahabshiil.co.uk",
    website: "dahabshiil.com",
    notes: "Major Somali remittance company. 4 branches. Est. 1998. Also at 3254 Cleveland Ave, Columbus"
  },
  {
    legalName: "Halal Money Transfer",
    dbaName: "",
    address: "5145 Dry Creek Drive",
    city: "Dublin",
    state: "OH",
    zip: "43016",
    phone: "",
    email: "",
    website: "halalmoneytransfer.com",
    notes: "Muslim/Halal-focused. All 50 states coverage"
  },
  {
    legalName: "AFGHAN GLOBAL TRANSFERS LLC",
    dbaName: "",
    address: "14221 Triskett Rd Apt 304E",
    city: "Cleveland",
    state: "OH",
    zip: "44111",
    phone: "",
    email: "",
    website: "",
    notes: "Afghan community remittance"
  },
];

export default function HawalaPage() {
  const mnBrokers = brokers.filter(b => b.state === 'MN');
  const ohBrokers = brokers.filter(b => b.state === 'OH');

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Hawala Money Brokers</h1>
      <p className="text-gray-400 mb-2">Minnesota & Ohio</p>
      <p className="text-gray-500 text-sm mb-8">
        Licensed money service businesses (MSBs) - for civil rights outreach regarding banking access issues.
      </p>

      <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded mb-8">
        <p className="text-blue-200/80 text-sm">
          <strong>Data Source:</strong> FinCEN MSB Registrant Database via OpenSanctions.
          All businesses listed are federally registered money service businesses.
          Phone numbers sourced from public business directories.
        </p>
      </div>

      {/* Minnesota Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-400">Minnesota</span>
          <span className="text-gray-500 text-lg font-normal">({mnBrokers.length} businesses)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                <th className="pb-3 pr-4 text-gray-400 font-medium">Business Name</th>
                <th className="pb-3 pr-4 text-gray-400 font-medium">Address</th>
                <th className="pb-3 pr-4 text-gray-400 font-medium">Phone</th>
                <th className="pb-3 pr-4 text-gray-400 font-medium">Contact</th>
                <th className="pb-3 text-gray-400 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {mnBrokers.map((broker, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-900/50">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-white">{broker.legalName}</div>
                    {broker.dbaName && (
                      <div className="text-gray-400 text-xs">DBA: {broker.dbaName}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-300">
                    <div>{broker.address}</div>
                    <div className="text-gray-500">{broker.city}, {broker.state} {broker.zip}</div>
                  </td>
                  <td className="py-3 pr-4">
                    {broker.phone ? (
                      <a href={`tel:${broker.phone.replace(/[^0-9]/g, '')}`} className="text-green-400 hover:underline">
                        {broker.phone}
                      </a>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {broker.email && (
                      <a href={`mailto:${broker.email}`} className="text-blue-400 hover:underline block text-xs">
                        {broker.email}
                      </a>
                    )}
                    {broker.website && (
                      <a href={`https://${broker.website}`} target="_blank" rel="noopener noreferrer"
                         className="text-blue-400 hover:underline block text-xs">
                        {broker.website}
                      </a>
                    )}
                    {!broker.email && !broker.website && (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-3 text-gray-400 text-xs max-w-xs">
                    {broker.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ohio Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-red-400">Ohio</span>
          <span className="text-gray-500 text-lg font-normal">({ohBrokers.length} businesses)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                <th className="pb-3 pr-4 text-gray-400 font-medium">Business Name</th>
                <th className="pb-3 pr-4 text-gray-400 font-medium">Address</th>
                <th className="pb-3 pr-4 text-gray-400 font-medium">Phone</th>
                <th className="pb-3 pr-4 text-gray-400 font-medium">Contact</th>
                <th className="pb-3 text-gray-400 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ohBrokers.map((broker, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-900/50">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-white">{broker.legalName}</div>
                    {broker.dbaName && (
                      <div className="text-gray-400 text-xs">DBA: {broker.dbaName}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-300">
                    <div>{broker.address}</div>
                    <div className="text-gray-500">{broker.city}, {broker.state} {broker.zip}</div>
                  </td>
                  <td className="py-3 pr-4">
                    {broker.phone ? (
                      <a href={`tel:${broker.phone.replace(/[^0-9]/g, '')}`} className="text-green-400 hover:underline">
                        {broker.phone}
                      </a>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {broker.email && (
                      <a href={`mailto:${broker.email}`} className="text-blue-400 hover:underline block text-xs">
                        {broker.email}
                      </a>
                    )}
                    {broker.website && (
                      <a href={`https://${broker.website}`} target="_blank" rel="noopener noreferrer"
                         className="text-blue-400 hover:underline block text-xs">
                        {broker.website}
                      </a>
                    )}
                    {!broker.email && !broker.website && (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-3 text-gray-400 text-xs max-w-xs">
                    {broker.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Context Section */}
      <section className="bg-gray-900/50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-3">About Hawala & Banking Access Issues</h3>
        <p className="text-gray-400 text-sm mb-3">
          Hawala (حوالة) is an informal value transfer system used primarily in South Asia, the Middle East,
          and East Africa. Licensed money service businesses (MSBs) in the US provide a regulated way for
          immigrant communities to send remittances to family abroad.
        </p>
        <p className="text-gray-400 text-sm mb-3">
          Many of these businesses have faced &quot;de-banking&quot; - having their bank accounts closed due to
          perceived regulatory risk, despite being fully licensed and compliant. This creates significant
          hardship for both the businesses and the communities they serve.
        </p>
        <p className="text-gray-400 text-sm">
          Minnesota has the largest Somali population in the US (~80,000 people), making it a hub for
          remittance services to East Africa.
        </p>
      </section>

      {/* Data files note */}
      <section className="text-xs text-gray-600 border-t border-gray-800 pt-6">
        <p className="mb-2"><strong>Full data files available:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>mn_likely_hawala.csv - 73 likely Hawala businesses in MN</li>
          <li>oh_likely_hawala.csv - 61 likely Hawala businesses in OH</li>
          <li>mn_money_transmitters.csv - 242 money transmitters in MN</li>
          <li>oh_money_transmitters.csv - 530 money transmitters in OH</li>
        </ul>
      </section>
    </div>
  );
}
