'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

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

interface H1BMapProps {
  applications: H1BApplication[];
  center: [number, number];
  zoom: number;
  title?: string;
}

function H1BMapInner({ applications, center, zoom, title }: H1BMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedApp, setSelectedApp] = useState<H1BApplication | null>(null);
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
          features: applications
            .filter(a => a.latitude && a.longitude)
            .map(app => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [app.longitude, app.latitude],
              },
              properties: {
                id: app.id,
                case_number: app.case_number,
                employer: app.employer_name,
                job_title: app.job_title,
                wage: app.wage_rate_from || 0,
                wage_unit: app.wage_unit || 'Year',
                h1b_dependent: app.h1b_dependent || false,
                willful_violator: app.willful_violator || false,
              },
            })),
        };

        map.current.addSource('h1b', {
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
          source: 'h1b',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#3b82f6',  // blue for small clusters
              50,
              '#8b5cf6',  // purple for medium
              200,
              '#f59e0b',  // amber for large
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              50,
              24,
              200,
              32,
            ],
          },
        });

        // Cluster count labels
        map.current.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'h1b',
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

        // Individual points - color by wage level
        map.current.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'h1b',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['get', 'willful_violator'],
              '#ef4444',  // Red for willful violators
              ['get', 'h1b_dependent'],
              '#f59e0b',  // Amber for H1B dependent
              ['>', ['get', 'wage'], 200000],
              '#22c55e',  // Green for >$200K
              ['>', ['get', 'wage'], 100000],
              '#3b82f6',  // Blue for >$100K
              '#6b7280',  // Gray for others
            ],
            'circle-radius': [
              'case',
              ['>', ['get', 'wage'], 200000],
              9,
              ['>', ['get', 'wage'], 100000],
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
          const source = map.current.getSource('h1b') as mapboxgl.GeoJSONSource;
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
          const app = applications.find(a => a.id === props?.id);
          if (app) {
            setSelectedApp(app);
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
  }, [mapboxgl, applications, center, zoom]);

  const formatWage = (wage: number | null, unit: string | null) => {
    if (!wage) return 'N/A';
    const formatted = `$${wage.toLocaleString()}`;
    if (unit === 'Hour') return `${formatted}/hr`;
    if (unit === 'Week') return `${formatted}/wk`;
    if (unit === 'Month') return `${formatted}/mo`;
    return `${formatted}/yr`;
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

      {selectedApp && (
        <div className="absolute top-4 right-4 bg-black border border-gray-700 p-4 max-w-sm z-10">
          <button
            onClick={() => setSelectedApp(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-white"
          >
            ×
          </button>
          <h3 className="font-bold pr-6 text-sm">{selectedApp.employer_name}</h3>
          <p className="text-gray-400 text-xs mt-1">
            {selectedApp.worksite_city}, {selectedApp.worksite_state}
          </p>
          <p className="text-gray-300 text-sm mt-2">{selectedApp.job_title}</p>
          <p className="text-green-500 font-mono mt-2">
            {formatWage(selectedApp.wage_rate_from, selectedApp.wage_unit)}
          </p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
              {selectedApp.visa_class}
            </span>
            {selectedApp.h1b_dependent && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                H1B Dependent
              </span>
            )}
            {selectedApp.willful_violator && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                Willful Violator
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-2">Case: {selectedApp.case_number}</p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black/80 p-3 text-xs z-10">
        <div className="text-gray-400 font-medium mb-2">Wage Levels</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>$200K+ annual</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>$100K+ annual</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>H1B dependent employer</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Willful violator</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span>Other</span>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(H1BMapInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-900 flex items-center justify-center rounded border border-gray-800">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});
