export const metadata = {
  title: 'API Documentation | SomaliScan',
  description: 'Public API documentation for accessing fraud tracking data',
};

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  response?: string;
  example?: string;
}

const endpoints: { category: string; endpoints: Endpoint[] }[] = [
  {
    category: 'PPP Loans',
    endpoints: [
      {
        method: 'GET',
        path: '/api/ppp',
        description: 'Search PPP loans with filters and pagination',
        params: [
          { name: 'search', type: 'string', required: false, description: 'Search by business name, address, or loan number' },
          { name: 'state', type: 'string', required: false, description: 'Filter by state code (e.g., MN, CA)' },
          { name: 'minAmount', type: 'number', required: false, description: 'Minimum loan amount' },
          { name: 'maxAmount', type: 'number', required: false, description: 'Maximum loan amount' },
          { name: 'flagged', type: 'boolean', required: false, description: 'Filter to flagged loans only' },
          { name: 'minScore', type: 'number', required: false, description: 'Minimum fraud score (0-100)' },
          { name: 'naics', type: 'string', required: false, description: 'Filter by NAICS code' },
          { name: 'status', type: 'string', required: false, description: 'Filter by loan status' },
          { name: 'businessType', type: 'string', required: false, description: 'Filter by business type' },
          { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
          { name: 'pageSize', type: 'number', required: false, description: 'Results per page (max: 100, default: 50)' },
          { name: 'sortBy', type: 'string', required: false, description: 'Sort column (initial_approval_amount, jobs_reported, date_approved, borrower_name)' },
          { name: 'sortDir', type: 'string', required: false, description: 'Sort direction (asc, desc)' },
        ],
        example: '/api/ppp?state=MN&flagged=true&minAmount=100000&page=1&pageSize=25',
      },
      {
        method: 'GET',
        path: '/api/ppp/[loan_number]',
        description: 'Get details for a specific PPP loan',
        example: '/api/ppp/1234567890',
      },
      {
        method: 'GET',
        path: '/api/ppp/flagged',
        description: 'Get flagged PPP loans with fraud indicators',
        params: [
          { name: 'state', type: 'string', required: false, description: 'Filter by state code' },
          { name: 'minScore', type: 'number', required: false, description: 'Minimum fraud score' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'pageSize', type: 'number', required: false, description: 'Results per page (max: 100)' },
        ],
      },
    ],
  },
  {
    category: 'Organizations',
    endpoints: [
      {
        method: 'GET',
        path: '/api/organizations',
        description: 'Search the master organization registry (12M+ entities)',
        params: [
          { name: 'search', type: 'string', required: false, description: 'Search by name or address' },
          { name: 'state', type: 'string', required: false, description: 'Filter by state code' },
          { name: 'type', type: 'string', required: false, description: 'Filter by type (ppp_recipient, eidl_only, childcare)' },
          { name: 'sector', type: 'string', required: false, description: 'Filter by NAICS sector (2-digit code)' },
          { name: 'naics', type: 'string', required: false, description: 'Filter by exact NAICS code' },
          { name: 'fraudProne', type: 'boolean', required: false, description: 'Filter to fraud-prone industries' },
          { name: 'minFunding', type: 'number', required: false, description: 'Minimum total funding' },
          { name: 'maxFunding', type: 'number', required: false, description: 'Maximum total funding' },
          { name: 'minClusterSize', type: 'number', required: false, description: 'Minimum orgs at same address' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'pageSize', type: 'number', required: false, description: 'Results per page (max: 100)' },
        ],
        example: '/api/organizations?state=MN&fraudProne=true&minFunding=500000',
      },
      {
        method: 'GET',
        path: '/api/organizations/[id]',
        description: 'Get organization details including all linked funding',
        example: '/api/organizations/4ca44692-e75a-42c9-9325-f548c83ba927',
      },
      {
        method: 'GET',
        path: '/api/organizations/stats',
        description: 'Get aggregate statistics by state',
      },
    ],
  },
  {
    category: 'Fraud Cases',
    endpoints: [
      {
        method: 'GET',
        path: '/api/cases',
        description: 'Search DOJ fraud cases and prosecutions',
        params: [
          { name: 'search', type: 'string', required: false, description: 'Search by case name or number' },
          { name: 'state', type: 'string', required: false, description: 'Filter by state' },
          { name: 'status', type: 'string', required: false, description: 'Filter by case status (investigating, charged, convicted, sentenced)' },
          { name: 'fraudType', type: 'string', required: false, description: 'Filter by fraud type (ppp, eidl, ccap, cacfp, medicare)' },
          { name: 'minAmount', type: 'number', required: false, description: 'Minimum fraud amount' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'pageSize', type: 'number', required: false, description: 'Results per page (max: 100)' },
        ],
        example: '/api/cases?state=MN&fraudType=ppp&minAmount=1000000',
      },
    ],
  },
  {
    category: 'Childcare Providers',
    endpoints: [
      {
        method: 'GET',
        path: '/api/providers',
        description: 'Search licensed childcare providers (113K+ across 16 states)',
        params: [
          { name: 'search', type: 'string', required: false, description: 'Search by name or address' },
          { name: 'state', type: 'string', required: false, description: 'Filter by state code' },
          { name: 'city', type: 'string', required: false, description: 'Filter by city' },
          { name: 'county', type: 'string', required: false, description: 'Filter by county' },
          { name: 'licenseType', type: 'string', required: false, description: 'Filter by license type' },
          { name: 'status', type: 'string', required: false, description: 'Filter by license status' },
          { name: 'minCapacity', type: 'number', required: false, description: 'Minimum licensed capacity' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'pageSize', type: 'number', required: false, description: 'Results per page (max: 100)' },
        ],
        example: '/api/providers?state=MN&city=Minneapolis&minCapacity=50',
      },
    ],
  },
  {
    category: 'Campaign Contributions',
    endpoints: [
      {
        method: 'GET',
        path: '/api/contributions',
        description: 'Search campaign contributions (FEC federal + state data)',
        params: [
          { name: 'search', type: 'string', required: false, description: 'Search by contributor or recipient name' },
          { name: 'state', type: 'string', required: false, description: 'Filter by contributor state' },
          { name: 'source', type: 'string', required: false, description: 'Data source (fec, mn, all)' },
          { name: 'minAmount', type: 'number', required: false, description: 'Minimum contribution amount' },
          { name: 'maxAmount', type: 'number', required: false, description: 'Maximum contribution amount' },
          { name: 'year', type: 'number', required: false, description: 'Filter by contribution year' },
          { name: 'fraudLinked', type: 'boolean', required: false, description: 'Filter to fraud-linked contributions' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'pageSize', type: 'number', required: false, description: 'Results per page (max: 100)' },
        ],
        example: '/api/contributions?state=MN&year=2024&minAmount=1000',
      },
    ],
  },
  {
    category: 'Politicians',
    endpoints: [
      {
        method: 'GET',
        path: '/api/politicians',
        description: 'Search politicians with fraud case connections',
        params: [
          { name: 'search', type: 'string', required: false, description: 'Search by name' },
          { name: 'state', type: 'string', required: false, description: 'Filter by state' },
          { name: 'party', type: 'string', required: false, description: 'Filter by party (D, R, I)' },
          { name: 'office', type: 'string', required: false, description: 'Filter by office type (federal_senate, federal_house, governor, state_senate, state_house)' },
          { name: 'hasFraudLinks', type: 'boolean', required: false, description: 'Filter to politicians with fraud connections' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'pageSize', type: 'number', required: false, description: 'Results per page (max: 100)' },
        ],
        example: '/api/politicians?state=MN&hasFraudLinks=true',
      },
    ],
  },
  {
    category: 'Other Endpoints',
    endpoints: [
      {
        method: 'GET',
        path: '/api/sba-loans',
        description: 'Search SBA 7(a)/504 loans (not PPP)',
        params: [
          { name: 'state', type: 'string', required: false, description: 'Filter by state' },
          { name: 'fraudProne', type: 'boolean', required: false, description: 'Filter to fraud-prone industries' },
        ],
      },
      {
        method: 'GET',
        path: '/api/improper-payments',
        description: 'Get improper payment rates by federal program',
      },
      {
        method: 'GET',
        path: '/api/map/stats',
        description: 'Get aggregate stats for map visualization by state',
      },
      {
        method: 'GET',
        path: '/api/state/[state]/data',
        description: 'Get combined data for a specific state',
      },
      {
        method: 'GET',
        path: '/api/foia/[state]',
        description: 'Get public records law info and contacts for a state',
      },
    ],
  },
];

export default function APIDocsPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">API Documentation</h1>
      <p className="text-gray-400 mb-8">
        Public API for accessing government fraud tracking data. All endpoints return JSON.
      </p>

      {/* Rate Limits Notice */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-2">Rate Limits</h2>
        <p className="text-gray-500 text-sm">
          API requests are limited to 100 requests per minute per IP address.
          Exceeding this limit will result in a 429 Too Many Requests response.
        </p>
      </div>

      {/* Base URL */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-2">Base URL</h2>
        <code className="font-mono text-green-500 bg-gray-900 px-2 py-1">
          https://somaliscan.com
        </code>
      </div>

      {/* Response Format */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-2">Response Format</h2>
        <p className="text-gray-500 text-sm mb-2">
          All list endpoints return paginated responses with the following structure:
        </p>
        <pre className="font-mono text-xs bg-gray-900 p-4 overflow-x-auto text-gray-300">
{`{
  "data": [...],           // Array of results
  "total": 12345,          // Total matching records
  "page": 1,               // Current page
  "pageSize": 50,          // Results per page
  "totalPages": 247,       // Total pages available
  "stats": {...}           // Aggregate stats (endpoint-specific)
}`}
        </pre>
      </div>

      {/* Endpoints by Category */}
      {endpoints.map((category) => (
        <div key={category.category} className="mb-10">
          <h2 className="text-xl font-semibold mb-4">{category.category}</h2>

          {category.endpoints.map((endpoint) => (
            <div key={endpoint.path} className="border border-gray-800 mb-4">
              {/* Endpoint Header */}
              <div className="bg-gray-900 px-4 py-3 flex items-center gap-3">
                <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                  endpoint.method === 'GET' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                }`}>
                  {endpoint.method}
                </span>
                <code className="font-mono text-sm text-white">{endpoint.path}</code>
              </div>

              {/* Description */}
              <div className="px-4 py-3 border-t border-gray-800">
                <p className="text-gray-400 text-sm">{endpoint.description}</p>
              </div>

              {/* Parameters */}
              {endpoint.params && endpoint.params.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Query Parameters</h3>
                  <div className="space-y-2">
                    {endpoint.params.map((param) => (
                      <div key={param.name} className="flex gap-4 text-sm">
                        <code className="font-mono text-green-500 w-28 flex-shrink-0">{param.name}</code>
                        <span className="text-gray-600 w-16 flex-shrink-0">{param.type}</span>
                        <span className="text-gray-500">{param.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example */}
              {endpoint.example && (
                <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/50">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Example</h3>
                  <code className="font-mono text-xs text-gray-400">{endpoint.example}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Error Responses */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Error Responses</h2>
        <div className="border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
                <th className="text-left p-3 font-medium text-gray-400">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr>
                <td className="p-3 font-mono text-yellow-500">400</td>
                <td className="p-3 text-gray-400">Bad Request - Invalid parameters</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-yellow-500">404</td>
                <td className="p-3 text-gray-400">Not Found - Resource does not exist</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-yellow-500">429</td>
                <td className="p-3 text-gray-400">Too Many Requests - Rate limit exceeded</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-red-500">500</td>
                <td className="p-3 text-gray-400">Internal Server Error</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact */}
      <div className="text-gray-500 text-sm">
        <p>
          Questions or need higher rate limits?{' '}
          <a href="mailto:admin@somaliscan.com" className="text-green-500 hover:underline">
            admin@somaliscan.com
          </a>
        </p>
      </div>
    </div>
  );
}
