'use client';

interface Entity {
  entity_name: string;
  entity_type: string;
  enforcement_record_source: string;
  connected_entities: string[];
  connection_types: string[];
  source_citation: string;
  role?: string;
  sentence?: string;
  conviction_date?: string;
  plea_date?: string;
  sentence_date?: string;
  specialty?: string;
  location?: string;
  case_number?: string;
  function?: string;
  scheme_amount?: string;
  case?: string;
}

interface EntitySidebarProps {
  entity: Entity | null;
  onClose: () => void;
}

function getEntityTypeLabel(entityType: string): string {
  if (entityType === 'Hospital') return 'Hospital';
  if (entityType.includes('Physician')) return 'Physician';
  if (entityType.includes('Business Owner')) return 'Business Owner';
  if (entityType.includes('Licensed Healthcare')) return 'Healthcare Professional';
  if (entityType.includes('Business Entity')) return 'Business Entity';
  return entityType;
}

export default function EntitySidebar({ entity, onClose }: EntitySidebarProps) {
  if (!entity) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-black border-l border-gray-800 overflow-y-auto z-50 shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 bg-black border-b border-gray-800 p-4 flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
            {getEntityTypeLabel(entity.entity_type)}
          </p>
          <h2 className="text-lg font-bold text-white">{entity.entity_name}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white p-1"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Role/Function */}
        {(entity.role || entity.function) && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Role</p>
            <p className="text-gray-300 text-sm">{entity.role || entity.function}</p>
          </div>
        )}

        {/* Specialty (for physicians) */}
        {entity.specialty && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Specialty</p>
            <p className="text-gray-300 text-sm">{entity.specialty}</p>
          </div>
        )}

        {/* Location */}
        {entity.location && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Location</p>
            <p className="text-gray-300 text-sm">{entity.location}</p>
          </div>
        )}

        {/* Sentence */}
        {entity.sentence && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Sentence</p>
            <p className="text-white font-mono">{entity.sentence}</p>
          </div>
        )}

        {/* Dates */}
        {(entity.conviction_date || entity.plea_date || entity.sentence_date) && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Key Dates</p>
            <div className="space-y-1 text-sm">
              {entity.plea_date && (
                <p className="text-gray-400">Plea: <span className="text-gray-300">{entity.plea_date}</span></p>
              )}
              {entity.conviction_date && (
                <p className="text-gray-400">Convicted: <span className="text-gray-300">{entity.conviction_date}</span></p>
              )}
              {entity.sentence_date && (
                <p className="text-gray-400">Sentenced: <span className="text-gray-300">{entity.sentence_date}</span></p>
              )}
            </div>
          </div>
        )}

        {/* Case Number */}
        {entity.case_number && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Case Number</p>
            <p className="text-gray-300 text-sm font-mono">{entity.case_number}</p>
          </div>
        )}

        {/* Scheme Amount */}
        {entity.scheme_amount && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Scheme Amount</p>
            <p className="text-green-500 font-mono">{entity.scheme_amount}</p>
          </div>
        )}

        {/* Connected Entities */}
        {entity.connected_entities.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">
              Connected Entities ({entity.connected_entities.length})
            </p>
            <ul className="space-y-1">
              {entity.connected_entities.map((name, idx) => (
                <li key={idx} className="text-sm">
                  <span className="text-gray-600 mr-2">-</span>
                  <span className="text-gray-300">{name}</span>
                  {entity.connection_types[idx] && (
                    <span className="text-gray-600 text-xs ml-2">
                      ({entity.connection_types[idx].split('(')[0].trim()})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Enforcement Record */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Enforcement Record</p>
          <p className="text-gray-400 text-xs leading-relaxed">{entity.enforcement_record_source}</p>
        </div>

        {/* Source Citation */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Source</p>
          <p className="text-gray-500 text-xs leading-relaxed">{entity.source_citation}</p>
        </div>
      </div>
    </div>
  );
}
