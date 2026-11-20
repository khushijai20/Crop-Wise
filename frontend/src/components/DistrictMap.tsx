'use client';

import React, { useEffect, useRef } from 'react';
import { District } from '@/types';

interface DistrictMapProps {
  district: District | null;
  districtsList: District[];
  onSelectDistrict: (dist: District) => void;
  lang: string;
}

export const DistrictMap: React.FC<DistrictMapProps> = ({
  district,
  districtsList,
  onSelectDistrict,
  lang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Dynamically import Leaflet on client-side
    import('leaflet').then((L) => {
      if (!mapContainerRef.current) return;

      // Fix default icon issue with bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const lat = district ? district.latitude : 25.5941;
      const lon = district ? district.longitude : 85.1376;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [lat, lon],
          zoom: 8,
          scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;
        markerGroupRef.current = L.layerGroup().addTo(map);
      } else {
        mapInstanceRef.current.setView([lat, lon], 8);
      }

      // Clear previous markers
      if (markerGroupRef.current) {
        markerGroupRef.current.clearLayers();

        // Render markers for all districts in current state
        districtsList.forEach((d) => {
          const isSelected = district?.id === d.id;
          const markerColor = isSelected ? '#1e5631' : '#38a95c';

          const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div style="
                background-color: ${markerColor};
                color: white;
                border: 2px solid white;
                border-radius: 9999px;
                padding: 4px 8px;
                font-size: 11px;
                font-weight: bold;
                white-space: nowrap;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                gap: 4px;
                transform: translate(-50%, -50%);
              ">
                <span>🌱</span>
                <span>${d.name}</span>
              </div>
            `,
            iconSize: [0, 0],
          });

          const marker = L.marker([d.latitude, d.longitude], { icon: customIcon });
          marker.on('click', () => {
            onSelectDistrict(d);
          });
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 13px;">
              <strong style="color: #1e5631;">${d.name}</strong><br/>
              <span>Lat: ${d.latitude.toFixed(2)}°N, Lon: ${d.longitude.toFixed(2)}°E</span><br/>
              <span style="color: #666; font-size: 11px;">Click to load weather & soil advisories</span>
            </div>
          `);
          markerGroupRef.current.addLayer(marker);
        });
      }
    });

    return () => {
      // cleanup on unmount
    };
  }, [district, districtsList, onSelectDistrict]);

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden shadow-sm border border-kisan-100 bg-kisan-50/50">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 shadow-sm flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full bg-kisan-600 animate-pulse" />
        <span>
          {lang === 'hi'
            ? 'मानचित्र पर किसी भी ज़िले पर क्लिक करके चयन करें'
            : 'Click any district marker to inspect agro-metrics'}
        </span>
      </div>
    </div>
  );
};
