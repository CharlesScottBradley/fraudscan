'use client';

interface Entity {
  entity_name: string;
  entity_type: string;
  cluster?: string;
  address?: string;
  ppp_amount?: number;
  ppp_jobs?: number;
  ppp_loans?: number;
  connected_entities: string[];
  connection_types: string[];
  notes?: string;
  red_flags?: string[];
  registered_agent?: string;
  role?: string;
  state_funding?: number;
  file_number?: string;
  naics?: string;
  state?: string;
  status?: string;
}

interface EntitySidebarProps {
  entity: Entity | null;
  onClose: () => void;
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function EntitySidebar({ entity, onClose }: EntitySidebarProps) {
  if (!entity) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-800 overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {entity.entity_type}
          </p>
          <h3 className="text-lg font-bold text-white">{entity.entity_name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* PPP Data */}
        {entity.ppp_amount !== undefined && entity.ppp_amount > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">PPP Loan Data</p>
            <div className="bg-gray-800 p-3 rounded space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-green-500 font-mono">{formatMoney(entity.ppp_amount)}</span>
              </div>
              {entity.ppp_jobs !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Jobs Claimed</span>
                  <span className="text-white font-mono">{entity.ppp_jobs}</span>
                </div>
              )}
              {entity.ppp_loans !== undefined && entity.ppp_loans > 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Number of Loans</span>
                  <span className="text-yellow-400 font-mono">{entity.ppp_loans}</span>
                </div>
              )}
              {entity.naics && (
                <div className="flex justify-between">
                  <span className="text-gray-400">NAICS</span>
                  <span className="text-gray-300 font-mono text-sm">{entity.naics}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* State Funding */}
        {entity.state_funding !== undefined && entity.state_funding > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">State Funding</p>
            <div className="bg-gray-800 p-3 rounded">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-blue-400 font-mono">{formatMoney(entity.state_funding)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Address */}
        {entity.address && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Address</p>
            <p className="text-gray-300 text-sm">{entity.address}</p>
            {entity.state && (
              <p className="text-gray-500 text-sm mt-1">State: {entity.state}</p>
            )}
          </div>
        )}

        {/* Registration Info */}
        {(entity.registered_agent || entity.file_number || entity.role) && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Registration</p>
            <div className="space-y-1 text-sm">
              {entity.registered_agent && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Agent</span>
                  <span className="text-gray-300">{entity.registered_agent}</span>
                </div>
              )}
              {entity.file_number && (
                <div className="flex justify-between">
                  <span className="text-gray-400">File #</span>
                  <span className="text-gray-300 font-mono">{entity.file_number}</span>
                </div>
              )}
              {entity.role && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Role</span>
                  <span className="text-gray-300">{entity.role}</span>
                </div>
              )}
              {entity.status && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={entity.status.includes('Sanctioned') ? 'text-red-400' : 'text-gray-300'}>
                    {entity.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connected Entities */}
        {entity.connected_entities.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Connected Entities ({entity.connected_entities.length})
            </p>
            <div className="space-y-2">
              {entity.connected_entities.map((name, idx) => (
                <div key={idx} className="bg-gray-800 p-2 rounded">
                  <p className="text-gray-300 text-sm">{name}</p>
                  {entity.connection_types[idx] && (
                    <p className="text-gray-500 text-xs mt-1">{entity.connection_types[idx]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Red Flags */}
        {entity.red_flags && entity.red_flags.length > 0 && (
          <div>
            <p className="text-xs text-red-500 uppercase tracking-wide mb-2">Red Flags</p>
            <div className="space-y-2">
              {entity.red_flags.map((flag, idx) => (
                <div key={idx} className="bg-red-900/20 border border-red-800 p-2 rounded">
                  <p className="text-red-400 text-sm">{flag}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {entity.notes && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
            <p className="text-gray-400 text-sm leading-relaxed">{entity.notes}</p>
          </div>
        )}

        {/* Cluster */}
        {entity.cluster && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Cluster</p>
            <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">
              {entity.cluster.replace(/_/g, ' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
