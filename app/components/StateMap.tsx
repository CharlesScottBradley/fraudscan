'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

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

interface StateMapProps {
  providers: Provider[];
  center: [number, number];
  zoom: number;
}

function StateMapInner({ providers, center, zoom }: StateMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [mapboxgl, setMapboxgl] = useState<typeof import('mapbox-gl') | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dynamically import mapbox-gl on client side only
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
          features: providers
            .filter(p => p.latitude && p.longitude)
            .map(provider => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [provider.longitude, provider.latitude],
              },
              properties: {
                id: provider.id,
                name: provider.name,
                license_type: provider.license_type,
                total_funding: provider.total_funding || 0,
                fraud_status: provider.fraud_status || 'none',
              },
            })),
        };

        map.current.addSource('providers', {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        map.current.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'providers',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#22c55e',
              10,
              '#16a34a',
              50,
              '#15803d',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15,
              10,
              20,
              50,
              25,
            ],
          },
        });

        map.current.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'providers',
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

        map.current.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'providers',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['>', ['get', 'total_funding'], 0],
              '#22c55e',
              '#666666',
            ],
            'circle-radius': [
              'case',
              ['>', ['get', 'total_funding'], 1000000],
              10,
              ['>', ['get', 'total_funding'], 0],
              7,
              5,
            ],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
        });

        map.current.on('click', 'clusters', (e) => {
          if (!map.current) return;
          const features = map.current.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          });
          const clusterId = features[0].properties?.cluster_id;
          const source = map.current.getSource('providers') as mapboxgl.GeoJSONSource;
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
          const provider = providers.find(p => p.id === props?.id);
          if (provider) {
            setSelectedProvider(provider);
          }
        });

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
  }, [mapboxgl, providers, center, zoom]);

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  if (error) {
    return (
      <div className="w-full h-[600px] bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!mapboxgl) {
    return (
      <div className="w-full h-[600px] bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded">
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
      <div ref={mapContainer} className="w-full h-full" />

      {selectedProvider && (
        <div className="absolute top-4 right-4 bg-black border border-gray-700 p-4 max-w-sm">
          <button
            onClick={() => setSelectedProvider(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-white"
          >
            ×
          </button>
          <h3 className="font-bold pr-6">{selectedProvider.name}</h3>
          <p className="text-gray-400 text-sm">{selectedProvider.license_type}</p>
          {selectedProvider.total_funding && selectedProvider.total_funding > 0 && (
            <p className="text-green-500 font-mono mt-2">
              {formatMoney(selectedProvider.total_funding)}
            </p>
          )}
          <a
            href={`/provider/${selectedProvider.license_number}`}
            className="text-sm text-gray-400 hover:text-white mt-2 inline-block"
          >
            View details →
          </a>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black/80 p-3 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Has funding data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span>No funding data</span>
        </div>
      </div>
    </div>
  );
}

// Export with no SSR to avoid window/document issues
export default dynamic(() => Promise.resolve(StateMapInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-900 flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});
