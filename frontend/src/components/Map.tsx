'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Types
interface Outlet {
  id: number;
  name: string;
  address: string;
  operating_hours: string;
  lat: number;
  long: number;
  distance?: number;
  intersects_with?: number[];
  waze_link: string;
  google_maps_link: string;
}

interface MapProps {
  outlets: Outlet[];
  selectedOutlet: Outlet | null;
  catchmentRadius: number;
  onOutletClick: (outlet: Outlet) => void;
  showCatchmentAreas: boolean;
  mapStyle: string;
  margin?: { l: number; r: number; t: number; b: number; };
}

const Map = ({ 
  outlets, 
  selectedOutlet, 
  catchmentRadius = 1.5,
  onOutletClick,
  showCatchmentAreas = false,
  mapStyle = "mapbox://styles/mapbox/streets-v12"
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: number]: mapboxgl.Marker }>({});
  const catchmentCircles = useRef<{ [key: number]: mapboxgl.GeoJSONSource }>({});

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [101.71, 3.15], // KL city center
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapStyle]);

  // Add markers for outlets
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    outlets.forEach(outlet => {
      const el = document.createElement('div');
      el.className = `outlet-marker ${selectedOutlet?.id === outlet.id ? 'selected' : ''}`;
      
      const icon = document.createElement('div');
      icon.className = 'outlet-marker-icon';
      icon.style.backgroundImage = 'url(/subway-marker.svg)';
      el.appendChild(icon);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
        offset: [0, 6] // Offset to account for the pin point
      })
        .setLngLat([outlet.long, outlet.lat])
        .setPopup(
          new mapboxgl.Popup({ 
            offset: [0, -36], // Adjust offset for the new pin height
            closeButton: false,
            closeOnClick: false
          })
            .setHTML(
              `<h3 class="font-semibold">${outlet.name}</h3>
               <p class="text-sm">${outlet.operating_hours}</p>`
            )
        )
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        onOutletClick?.(outlet);
      });

      markers.current[outlet.id] = marker;
    });
  }, [outlets, onOutletClick, selectedOutlet]);

  // Draw catchment areas
  useEffect(() => {
    if (!map.current) return;

    // Remove existing catchment circles
    Object.keys(catchmentCircles.current).forEach(id => {
      const sourceId = `catchment-${id}`;
      if (map.current?.getSource(sourceId)) {
        map.current.removeLayer(`catchment-fill-${id}`);
        map.current.removeLayer(`catchment-line-${id}`);
        map.current.removeSource(sourceId);
      }
    });
    catchmentCircles.current = {};

    // Only add new catchment areas if showCatchmentAreas is true
    if (showCatchmentAreas) {
      // Add catchment areas for each outlet
      outlets.forEach(outlet => {
        const circle = createGeoJSONCircle([outlet.long, outlet.lat], catchmentRadius);
        const sourceId = `catchment-${outlet.id}`;

        map.current?.addSource(sourceId, {
          type: 'geojson',
          data: circle as GeoJSON.Feature<GeoJSON.Polygon>
        });

        map.current?.addLayer({
          id: `catchment-fill-${outlet.id}`,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': selectedOutlet?.id === outlet.id ? '#2563eb' : '#60a5fa',
            'fill-opacity': 0.2
          }
        });

        map.current?.addLayer({
          id: `catchment-line-${outlet.id}`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': selectedOutlet?.id === outlet.id ? '#2563eb' : '#60a5fa',
            'line-width': 2
          }
        });

        catchmentCircles.current[outlet.id] = map.current?.getSource(sourceId) as mapboxgl.GeoJSONSource;
      });
    }
  }, [outlets, selectedOutlet, showCatchmentAreas, catchmentRadius]);

  // Center map on selected outlet
  useEffect(() => {
    if (!map.current || !selectedOutlet) return;

    map.current.flyTo({
      center: [selectedOutlet.long, selectedOutlet.lat],
      zoom: 14,
      duration: 1500,
      essential: true
    });
  }, [selectedOutlet]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
};

// Helper function to create a GeoJSON circle
function createGeoJSONCircle(center: [number, number], radiusInKm: number, points: number = 64): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: number[][] = [];
  const km = radiusInKm;
  const distanceX = km / (111.320 * Math.cos(center[1] * Math.PI / 180));
  const distanceY = km / 110.574;

  let theta, x, y;
  for(let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  coords.push(coords[0]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    },
    properties: {}
  };
}

export default Map; 