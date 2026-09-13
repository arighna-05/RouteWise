import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { useTrip } from '../../context/TripContext';

// Custom SVG icon generator for Leaflet
const createPinIcon = (text: string, color: string = '#0ea5e9') => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background: ${color};
        color: white;
        border-radius: 9999px;
        padding: 4px 8px;
        font-weight: 700;
        font-size: 11px;
        font-family: sans-serif;
        box-shadow: 0 4px 14px rgba(0,0,0,0.4), 0 0 10px ${color}80;
        border: 2px solid white;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
        transform: translate(-50%, -100%);
      ">
        <span>📍</span> ${text}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

export const TripMap: React.FC = () => {
  const { activeTrip, selectedDay } = useTrip();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const city = activeTrip.city;
  const dayItems = activeTrip.items.filter(item => item.dayIndex === selectedDay);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [city.latitude || 35.6762, city.longitude || 139.6503],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup || !city.latitude || !city.longitude) return;

    markersGroup.clearLayers();

    const centerLat = city.latitude;
    const centerLon = city.longitude;

    map.setView([centerLat, centerLon], 13, { animate: true });

    const cityMarker = L.marker([centerLat, centerLon], {
      icon: createPinIcon(city.name, '#0284c7'),
    }).bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <h4 style="font-weight: 700; margin: 0; color: #0f172a;">${city.name}</h4>
        <p style="font-size: 11px; margin: 2px 0 0 0; color: #64748b;">${city.country}</p>
      </div>
    `);
    markersGroup.addLayer(cityMarker);

    dayItems.forEach((item, idx) => {
      const angle = (idx * (360 / Math.max(1, dayItems.length))) * (Math.PI / 180);
      const radius = 0.012 + (idx % 3) * 0.008;
      const itemLat = centerLat + Math.cos(angle) * radius;
      const itemLon = centerLon + Math.sin(angle) * radius * 1.3;

      const itemMarker = L.marker([itemLat, itemLon], {
        icon: createPinIcon(`${item.time} ${item.title.substring(0, 16)}...`, '#f43f5e'),
      }).bindPopup(`
        <div style="font-family: sans-serif; padding: 6px; max-width: 180px;">
          <span style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase;">${item.category} • ${item.time}</span>
          <h4 style="font-weight: 700; margin: 2px 0; color: #0f172a; font-size: 13px;">${item.title}</h4>
          <p style="font-size: 11px; margin: 0; color: #64748b;">${item.location}</p>
          ${item.cost > 0 ? `<p style="font-size: 11px; font-weight: 600; color: #10b981; margin: 4px 0 0 0;">Cost: $${item.cost}</p>` : ''}
        </div>
      `);

      markersGroup.addLayer(itemMarker);
    });

  }, [city.latitude, city.longitude, city.name, dayItems, selectedDay]);

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-glass overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400">
            <Navigation className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Interactive Itinerary Map
            </h3>
            <p className="text-xs text-slate-400">
              Showing Day {selectedDay} locations in {city.name}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
        </span>
      </div>

      <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-slate-800 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
