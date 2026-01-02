'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

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

interface OrganizationsMapProps {
  organizations: Organization[];
  center: [number, number];
  zoom: number;
  title?: string;
}

function OrganizationsMapInner({ organizations, center, zoom, title }: OrganizationsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [mapboxgl, setMapboxgl] = useState<typeof import('mapbox-gl') | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import('mapbox-gl').then((mb) => {
      setMapboxgl(mb);
    }).catch((err) => {
      setError('Failed to load map library');
      console.error(err);
    });
  }, []);

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

        const geojson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: organizations
            .filter(o => o.latitude && o.longitude)
            .map(org => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [org.longitude, org.latitude],
              },
              properties: {
                id: org.id,
                name: org.legal_name,
                city: org.city || '',
                total_funding: org.total_government_funding || 0,
                is_fraud_prone: org.is_fraud_prone_industry || false,
                naics: org.naics_code || '',
              },
            })),
        };

        map.current.addSource('organizations', {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        // Cluster layer
        map.current.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'organizations',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#3b82f6',  // blue for small clusters
              25,
              '#8b5cf6',  // purple for medium
              100,
              '#f59e0b',  // amber for large
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              25,
              24,
              100,
              32,
            ],
          },
        });

        // Cluster count labels
        map.current.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'organizations',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // Individual points
        map.current.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'organizations',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['get', 'is_fraud_prone'],
              '#f59e0b',  // Amber for fraud-prone
              ['>', ['get', 'total_funding'], 1000000],
              '#22c55e',  // Green for >$1M funding
              ['>', ['get', 'total_funding'], 100000],
              '#3b82f6',  // Blue for >$100K
              '#6b7280',  // Gray for others
            ],
            'circle-radius': [
              'case',
              ['>', ['get', 'total_funding'], 1000000],
              9,
              ['>', ['get', 'total_funding'], 100000],
              7,
              5,
            ],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Click handlers
        map.current.on('click', 'clusters', (e) => {
          if (!map.current) return;
          const features = map.current.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          });
          const clusterId = features[0].properties?.cluster_id;
          const source = map.current.getSource('organizations') as mapboxgl.GeoJSONSource;
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
        });

        map.current.on('click', 'unclustered-point', (e) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties;
          const org = organizations.find(o => o.id === props?.id);
          if (org) {
            setSelectedOrg(org);
          }
        });

        // Cursor handlers
        map.current.on('mouseenter', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
        map.current.on('mouseenter', 'unclustered-point', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'unclustered-point', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
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
  }, [mapboxgl, organizations, center, zoom]);

  const formatMoney = (amount: number | null) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  if (error) {
    return (
      <div className="w-full h-[500px] bg-gray-900 flex items-center justify-center rounded">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!mapboxgl) {
    return (
      <div className="w-full h-[500px] bg-gray-900 flex items-center justify-center rounded">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded border border-gray-800">
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

      {title && (
        <div className="absolute top-4 left-4 bg-black/80 px-3 py-2 text-sm font-medium z-10">
          {title}
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full" />

      {selectedOrg && (
        <div className="absolute top-4 right-4 bg-black border border-gray-700 p-4 max-w-sm z-10">
          <button
            onClick={() => setSelectedOrg(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-white"
          >
            ×
          </button>
          <h3 className="font-bold pr-6 text-sm">{selectedOrg.legal_name}</h3>
          <p className="text-gray-400 text-xs mt-1">
            {selectedOrg.city}, {selectedOrg.state}
          </p>
          {selectedOrg.naics_description && (
            <p className="text-gray-500 text-xs mt-1">{selectedOrg.naics_description}</p>
          )}
          {selectedOrg.is_fraud_prone_industry && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
              Fraud-Prone Industry
            </span>
          )}
          <p className="text-green-500 font-mono mt-2">
            {formatMoney(selectedOrg.total_government_funding)}
          </p>
          <a
            href={`/organizations/${selectedOrg.id}`}
            className="text-sm text-gray-400 hover:text-white mt-2 inline-block"
          >
            View details →
          </a>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black/80 p-3 text-xs z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>$1M+ funding</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>$100K+ funding</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Fraud-prone industry</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span>Other</span>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(OrganizationsMapInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-900 flex items-center justify-center rounded border border-gray-800">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});
