'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Entity type definitions
interface Organization {
  id: string;
  legal_name: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  total_government_funding: number | null;
  is_fraud_prone_industry: boolean;
  naics_code: string | null;
  naics_description: string | null;
}

interface Provider {
  id: string;
  license_number: string;
  name: string;
  latitude: number;
  longitude: number;
  license_type: string;
  total_funding?: number;
  fraud_status?: string;
}

interface H1BApplication {
  id: string;
  case_number: string;
  employer_name: string;
  job_title: string;
  worksite_city: string;
  worksite_state: string;
  wage_rate_from: number | null;
  wage_unit: string | null;
  visa_class: string;
  h1b_dependent?: boolean;
  willful_violator?: boolean;
  latitude: number;
  longitude: number;
}

interface UnifiedStateMapProps {
  organizations: Organization[];
  providers: Provider[];
  h1bApplications: H1BApplication[];
  center: [number, number];
  zoom: number;
  stateName: string;
}

type EntityType = 'organization' | 'provider' | 'h1b';
type SelectedEntity =
  | { type: 'organization'; data: Organization }
  | { type: 'provider'; data: Provider }
  | { type: 'h1b'; data: H1BApplication }
  | null;

function UnifiedStateMapInner({
  organizations,
  providers,
  h1bApplications,
  center,
  zoom,
  stateName
}: UnifiedStateMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxgl, setMapboxgl] = useState<typeof import('mapbox-gl') | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Layer visibility state
  const [showOrgs, setShowOrgs] = useState(true);
  const [showProviders, setShowProviders] = useState(true);
  const [showH1B, setShowH1B] = useState(true);

  // Selected entity state
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);

  // Load mapbox-gl
  useEffect(() => {
    import('mapbox-gl').then((mb) => {
      setMapboxgl(mb);
    }).catch((err) => {
      setError('Failed to load map library');
      console.error(err);
    });
  }, []);

  // Toggle layer visibility
  const toggleLayer = useCallback((layerId: string, visible: boolean) => {
    if (!map.current || !mapLoaded) return;
    const visibility = visible ? 'visible' : 'none';

    // Each entity type has: clusters, cluster-count, and points layers
    const layers = [
      `${layerId}-clusters`,
      `${layerId}-cluster-count`,
      `${layerId}-points`
    ];

    layers.forEach(layer => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, 'visibility', visibility);
      }
    });
  }, [mapLoaded]);

  // Update layer visibility when toggles change
  useEffect(() => {
    toggleLayer('organizations', showOrgs);
  }, [showOrgs, toggleLayer]);

  useEffect(() => {
    toggleLayer('providers', showProviders);
  }, [showProviders, toggleLayer]);

  useEffect(() => {
    toggleLayer('h1b', showH1B);
  }, [showH1B, toggleLayer]);

  // Initialize map
  useEffect(() => {
    if (!mapboxgl || !mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setError('Mapbox token not configured');
      return;
    }

    mapboxgl.default.accessToken = token;

    try {
      map.current = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: center,
        zoom: zoom,
      });

      map.current.on('load', () => {
        if (!map.current) return;

        // === ORGANIZATIONS LAYER ===
        if (organizations.length > 0) {
          const orgGeojson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: organizations
              .filter(o => o.latitude && o.longitude)
              .map(org => ({
                type: 'Feature' as const,
                geometry: {
                  type: 'Point' as const,
                  coordinates: [org.longitude, org.latitude],
                },
                properties: {
                  id: org.id,
                  name: org.legal_name,
                  city: org.city || '',
                  total_funding: org.total_government_funding || 0,
                  is_fraud_prone: org.is_fraud_prone_industry || false,
                  naics: org.naics_code || '',
                  naics_description: org.naics_description || '',
                  entity_type: 'organization',
                },
              })),
          };

          map.current.addSource('organizations', {
            type: 'geojson',
            data: orgGeojson,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          // Org clusters
          map.current.addLayer({
            id: 'organizations-clusters',
            type: 'circle',
            source: 'organizations',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#3b82f6',
              'circle-radius': ['step', ['get', 'point_count'], 18, 50, 24, 200, 32],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#1e40af',
            },
          });

          map.current.addLayer({
            id: 'organizations-cluster-count',
            type: 'symbol',
            source: 'organizations',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
            paint: { 'text-color': '#ffffff' },
          });

          // Org points
          map.current.addLayer({
            id: 'organizations-points',
            type: 'circle',
            source: 'organizations',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': [
                'case',
                ['get', 'is_fraud_prone'], '#f59e0b',
                ['>', ['get', 'total_funding'], 1000000], '#22c55e',
                '#3b82f6',
              ],
              'circle-radius': [
                'case',
                ['>', ['get', 'total_funding'], 1000000], 8,
                ['>', ['get', 'total_funding'], 100000], 6,
                5,
              ],
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff',
            },
          });
        }

        // === PROVIDERS LAYER ===
        if (providers.length > 0) {
          const providerGeojson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: providers
              .filter(p => p.latitude && p.longitude)
              .map(provider => ({
                type: 'Feature' as const,
                geometry: {
                  type: 'Point' as const,
                  coordinates: [provider.longitude, provider.latitude],
                },
                properties: {
                  id: provider.id,
                  license_number: provider.license_number,
                  name: provider.name,
                  license_type: provider.license_type,
                  total_funding: provider.total_funding || 0,
                  fraud_status: provider.fraud_status || 'none',
                  entity_type: 'provider',
                },
              })),
          };

          map.current.addSource('providers', {
            type: 'geojson',
            data: providerGeojson,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          // Provider clusters
          map.current.addLayer({
            id: 'providers-clusters',
            type: 'circle',
            source: 'providers',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#10b981',
              'circle-radius': ['step', ['get', 'point_count'], 18, 50, 24, 200, 32],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#047857',
            },
          });

          map.current.addLayer({
            id: 'providers-cluster-count',
            type: 'symbol',
            source: 'providers',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
            paint: { 'text-color': '#ffffff' },
          });

          // Provider points
          map.current.addLayer({
            id: 'providers-points',
            type: 'circle',
            source: 'providers',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': [
                'case',
                ['==', ['get', 'fraud_status'], 'confirmed'], '#ef4444',
                ['==', ['get', 'fraud_status'], 'suspected'], '#f59e0b',
                '#10b981',
              ],
              'circle-radius': [
                'case',
                ['>', ['get', 'total_funding'], 100000], 8,
                ['>', ['get', 'total_funding'], 10000], 6,
                5,
              ],
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff',
            },
          });
        }

        // === H1B LAYER ===
        if (h1bApplications.length > 0) {
          const h1bGeojson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: h1bApplications
              .filter(a => a.latitude && a.longitude)
              .map(app => ({
                type: 'Feature' as const,
                geometry: {
                  type: 'Point' as const,
                  coordinates: [app.longitude, app.latitude],
                },
                properties: {
                  id: app.id,
                  case_number: app.case_number,
                  employer: app.employer_name,
                  job_title: app.job_title,
                  city: app.worksite_city,
                  wage: app.wage_rate_from || 0,
                  wage_unit: app.wage_unit || 'Year',
                  visa_class: app.visa_class,
                  h1b_dependent: app.h1b_dependent || false,
                  willful_violator: app.willful_violator || false,
                  entity_type: 'h1b',
                },
              })),
          };

          map.current.addSource('h1b', {
            type: 'geojson',
            data: h1bGeojson,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          // H1B clusters
          map.current.addLayer({
            id: 'h1b-clusters',
            type: 'circle',
            source: 'h1b',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#8b5cf6',
              'circle-radius': ['step', ['get', 'point_count'], 18, 50, 24, 200, 32],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#6d28d9',
            },
          });

          map.current.addLayer({
            id: 'h1b-cluster-count',
            type: 'symbol',
            source: 'h1b',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
            paint: { 'text-color': '#ffffff' },
          });

          // H1B points
          map.current.addLayer({
            id: 'h1b-points',
            type: 'circle',
            source: 'h1b',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': [
                'case',
                ['get', 'willful_violator'], '#ef4444',
                ['get', 'h1b_dependent'], '#f59e0b',
                ['>', ['get', 'wage'], 200000], '#22c55e',
                '#8b5cf6',
              ],
              'circle-radius': [
                'case',
                ['>', ['get', 'wage'], 200000], 8,
                ['>', ['get', 'wage'], 100000], 6,
                5,
              ],
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff',
            },
          });
        }

        // === CLICK HANDLERS ===
        const handleClusterClick = (sourceId: string) => (e: mapboxgl.MapMouseEvent) => {
          if (!map.current) return;
          const features = map.current.queryRenderedFeatures(e.point, {
            layers: [`${sourceId}-clusters`],
          });
          if (!features.length) return;

          const clusterId = features[0].properties?.cluster_id;
          const source = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource;
          source.getClusterExpansionZoom(clusterId, (err, zoomLevel) => {
            if (err || !map.current || zoomLevel === null || zoomLevel === undefined) return;
            const geometry = features[0].geometry;
            if (geometry.type === 'Point') {
              map.current.easeTo({
                center: geometry.coordinates as [number, number],
                zoom: zoomLevel,
              });
            }
          });
        };

        // Organization point click
        map.current.on('click', 'organizations-points', (e) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties;
          const org = organizations.find(o => o.id === props?.id);
          if (org) {
            setSelectedEntity({ type: 'organization', data: org });
          }
        });

        // Provider point click
        map.current.on('click', 'providers-points', (e) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties;
          const provider = providers.find(p => p.id === props?.id);
          if (provider) {
            setSelectedEntity({ type: 'provider', data: provider });
          }
        });

        // H1B point click
        map.current.on('click', 'h1b-points', (e) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties;
          const app = h1bApplications.find(a => a.id === props?.id);
          if (app) {
            setSelectedEntity({ type: 'h1b', data: app });
          }
        });

        // Cluster clicks
        if (organizations.length > 0) {
          map.current.on('click', 'organizations-clusters', handleClusterClick('organizations'));
        }
        if (providers.length > 0) {
          map.current.on('click', 'providers-clusters', handleClusterClick('providers'));
        }
        if (h1bApplications.length > 0) {
          map.current.on('click', 'h1b-clusters', handleClusterClick('h1b'));
        }

        // Cursor handlers
        const pointLayers = ['organizations-points', 'providers-points', 'h1b-points'];
        const clusterLayers = ['organizations-clusters', 'providers-clusters', 'h1b-clusters'];
        const allLayers = [...pointLayers, ...clusterLayers].filter(layer => map.current?.getLayer(layer));

        allLayers.forEach(layer => {
          map.current?.on('mouseenter', layer, () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
          });
          map.current?.on('mouseleave', layer, () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
          });
        });

        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Map failed to load');
      });
    } catch (err) {
      console.error('Map init error:', err);
      setError('Failed to initialize map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxgl, organizations, providers, h1bApplications, center, zoom]);

  const formatMoney = (amount: number | null) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const formatWage = (wage: number | null, unit: string | null) => {
    if (!wage) return 'N/A';
    const formatted = `$${wage.toLocaleString()}`;
    if (unit === 'Hour') return `${formatted}/hr`;
    if (unit === 'Week') return `${formatted}/wk`;
    if (unit === 'Month') return `${formatted}/mo`;
    return `${formatted}/yr`;
  };

  // Counts for toggle labels
  const orgCount = organizations.filter(o => o.latitude && o.longitude).length;
  const providerCount = providers.filter(p => p.latitude && p.longitude).length;
  const h1bCount = h1bApplications.filter(a => a.latitude && a.longitude).length;

  if (error) {
    return (
      <div className="w-full h-[600px] bg-gray-900 flex items-center justify-center rounded">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!mapboxgl) {
    return (
      <div className="w-full h-[600px] bg-gray-900 flex items-center justify-center rounded">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded border border-gray-800">
      <style jsx global>{`
        .mapboxgl-canvas { outline: none; }
        .mapboxgl-ctrl-logo { display: none !important; }
        .mapboxgl-ctrl-attrib {
          background: rgba(0,0,0,0.7) !important;
          font-size: 10px !important;
          padding: 2px 5px !important;
        }
        .mapboxgl-ctrl-attrib a { color: #888 !important; }
        .mapboxgl-ctrl-bottom-right { bottom: 0 !important; right: 0 !important; }
      `}</style>

      {/* Title */}
      <div className="absolute top-4 left-4 bg-black/80 px-3 py-2 text-sm font-medium z-10">
        {stateName} Map
      </div>

      {/* Layer Toggles */}
      <div className="absolute top-4 right-4 bg-black/90 border border-gray-700 p-3 z-10 text-sm">
        <div className="text-gray-400 text-xs font-medium mb-2">Layers</div>
        {orgCount > 0 && (
          <label className="flex items-center gap-2 cursor-pointer mb-1.5">
            <input
              type="checkbox"
              checked={showOrgs}
              onChange={(e) => setShowOrgs(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Organizations ({orgCount.toLocaleString()})
            </span>
          </label>
        )}
        {providerCount > 0 && (
          <label className="flex items-center gap-2 cursor-pointer mb-1.5">
            <input
              type="checkbox"
              checked={showProviders}
              onChange={(e) => setShowProviders(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Childcare ({providerCount.toLocaleString()})
            </span>
          </label>
        )}
        {h1bCount > 0 && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showH1B}
              onChange={(e) => setShowH1B(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              H1B ({h1bCount.toLocaleString()})
            </span>
          </label>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Selected Entity Panel */}
      {selectedEntity && (
        <div className="absolute top-16 right-4 bg-black border border-gray-700 p-4 max-w-sm z-10 mt-24">
          <button
            onClick={() => setSelectedEntity(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-white text-lg"
          >
            x
          </button>

          {selectedEntity.type === 'organization' && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-blue-400 text-xs uppercase tracking-wide">Organization</span>
              </div>
              <h3 className="font-bold pr-6 text-sm">{selectedEntity.data.legal_name}</h3>
              <p className="text-gray-400 text-xs mt-1">
                {selectedEntity.data.city}, {selectedEntity.data.state}
              </p>
              {selectedEntity.data.naics_description && (
                <p className="text-gray-500 text-xs mt-1">{selectedEntity.data.naics_description}</p>
              )}
              <p className="text-green-500 font-mono mt-2">
                {formatMoney(selectedEntity.data.total_government_funding)}
              </p>
              {selectedEntity.data.is_fraud_prone_industry && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                  Fraud-Prone Industry
                </span>
              )}
              <a
                href={`/organizations/${selectedEntity.data.id}`}
                className="block mt-3 text-blue-400 hover:text-blue-300 text-xs"
              >
                View details →
              </a>
            </>
          )}

          {selectedEntity.type === 'provider' && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-400 text-xs uppercase tracking-wide">Childcare Provider</span>
              </div>
              <h3 className="font-bold pr-6 text-sm">{selectedEntity.data.name}</h3>
              <p className="text-gray-400 text-xs mt-1">{selectedEntity.data.license_type}</p>
              {selectedEntity.data.total_funding && selectedEntity.data.total_funding > 0 && (
                <p className="text-green-500 font-mono mt-2">
                  {formatMoney(selectedEntity.data.total_funding)}
                </p>
              )}
              {selectedEntity.data.fraud_status && selectedEntity.data.fraud_status !== 'none' && (
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${
                  selectedEntity.data.fraud_status === 'confirmed'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {selectedEntity.data.fraud_status === 'confirmed' ? 'Confirmed Fraud' : 'Suspected Fraud'}
                </span>
              )}
              <a
                href={`/provider/${selectedEntity.data.license_number}`}
                className="block mt-3 text-emerald-400 hover:text-emerald-300 text-xs"
              >
                View details →
              </a>
            </>
          )}

          {selectedEntity.type === 'h1b' && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-purple-400 text-xs uppercase tracking-wide">H1B Application</span>
              </div>
              <h3 className="font-bold pr-6 text-sm">{selectedEntity.data.employer_name}</h3>
              <p className="text-gray-400 text-xs mt-1">
                {selectedEntity.data.worksite_city}, {selectedEntity.data.worksite_state}
              </p>
              <p className="text-gray-300 text-sm mt-2">{selectedEntity.data.job_title}</p>
              <p className="text-green-500 font-mono mt-2">
                {formatWage(selectedEntity.data.wage_rate_from, selectedEntity.data.wage_unit)}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                  {selectedEntity.data.visa_class}
                </span>
                {selectedEntity.data.h1b_dependent && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                    H1B Dependent
                  </span>
                )}
                {selectedEntity.data.willful_violator && (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                    Willful Violator
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-2">Case: {selectedEntity.data.case_number}</p>
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 p-3 text-xs z-10">
        <div className="text-gray-400 font-medium mb-2">Legend</div>

        {showOrgs && orgCount > 0 && (
          <div className="mb-2">
            <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">Organizations</div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Standard</span>
            </div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Fraud-prone industry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>$1M+ funding</span>
            </div>
          </div>
        )}

        {showProviders && providerCount > 0 && (
          <div className="mb-2">
            <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">Childcare</div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Provider</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Fraud flagged</span>
            </div>
          </div>
        )}

        {showH1B && h1bCount > 0 && (
          <div>
            <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">H1B</div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Application</span>
            </div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>H1B dependent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Willful violator</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(UnifiedStateMapInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-900 flex items-center justify-center rounded border border-gray-800">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});
