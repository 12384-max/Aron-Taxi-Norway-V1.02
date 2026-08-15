import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Locate, Compass } from 'lucide-react';

interface HotspotItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  surge: string;
  category?: string;
}

interface LeafletMapProps {
  pickup?: { lat: number; lng: number; address?: string };
  destination?: { lat: number; lng: number; address?: string };
  driverLocation?: { lat: number; lng: number; heading?: number };
  routeGeometry?: ([number, number] | { lat: number; lng: number })[];
  hotspots?: HotspotItem[];
  showHotspots?: boolean;
  centerLat?: number;
  centerLng?: number;
  className?: string;
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  showRecenterButton?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  pickup,
  destination,
  driverLocation,
  routeGeometry,
  hotspots = [],
  showHotspots = false,
  centerLat,
  centerLng,
  className = 'h-64 sm:h-80 w-full rounded-xl overflow-hidden shadow-xl border border-stone-800/80 relative',
  zoom = 13,
  onMapClick,
  showRecenterButton = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const initialViewSetRef = useRef<boolean>(false);
  const lastRouteKeyRef = useRef<string>('');

  // Generate a key representing the current route or trip focus
  const currentRouteKey = `${pickup?.lat || 0},${pickup?.lng || 0}-${destination?.lat || 0},${destination?.lng || 0}-${routeGeometry?.length || 0}`;

  // 1. Initialize Map Instance once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const defaultCenter: [number, number] = centerLat && centerLng
        ? [centerLat, centerLng]
        : pickup
        ? [pickup.lat, pickup.lng]
        : driverLocation
        ? [driverLocation.lat, driverLocation.lng]
        : [59.9139, 10.7522]; // Oslo default

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Voyager tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Add compact zoom control at top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      if (onMapClick) {
        map.on('click', (e) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      mapRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      // Don't destroy on every re-render, keep instance alive
    };
  }, []);

  // 2. Update Layers (Markers, Route, Hotspots) without forcing map viewport jumping
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Clear previous markers & polylines
    layerGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // Custom Pin Icon Generator
    const createCustomIcon = (bgColor: string, label: string, ringColor: string = '#FFFFFF') => {
      return L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div class="relative flex items-center justify-center filter drop-shadow-md">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-xl border-2" style="background-color: ${bgColor}; border-color: ${ringColor};">
              ${label}
            </div>
            <div class="absolute -bottom-1 w-2.5 h-2.5 rotate-45 shadow-sm" style="background-color: ${bgColor};"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
    };

    // Hotspots rendering
    if (showHotspots && hotspots.length > 0) {
      hotspots.forEach((h) => {
        const hotspotIcon = L.divIcon({
          className: 'hotspot-icon',
          html: `
            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/90 text-slate-950 font-black text-[10px] rounded-full shadow-lg border border-amber-300 backdrop-blur-sm animate-pulse whitespace-nowrap">
              <span class="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping"></span>
              <span>${h.name}</span>
              <span class="bg-black text-amber-400 px-1 py-0.2 rounded font-mono text-[9px]">${h.surge}</span>
            </div>
          `,
          iconSize: [120, 24],
          iconAnchor: [60, 12]
        });

        const hMarker = L.marker([h.lat, h.lng], { icon: hotspotIcon }).bindPopup(
          `<b>${h.name}</b><br/>Etterspørsel: <b>${h.surge}</b>`
        );
        layerGroup.addLayer(hMarker);
      });
    }

    // Pickup Marker
    if (pickup && pickup.lat && pickup.lng) {
      const pickupIcon = createCustomIcon('#10B981', 'A', '#34D186');
      const pMarker = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).bindPopup(
        `<b>Hentested:</b><br/>${pickup.address || 'Henteadresse'}`
      );
      layerGroup.addLayer(pMarker);
      bounds.extend([pickup.lat, pickup.lng]);
    }

    // Destination Marker
    if (destination && destination.lat && destination.lng) {
      const destIcon = createCustomIcon('#EF4444', 'B', '#F87171');
      const dMarker = L.marker([destination.lat, destination.lng], { icon: destIcon }).bindPopup(
        `<b>Destinasjon:</b><br/>${destination.address || 'Ankomststed'}`
      );
      layerGroup.addLayer(dMarker);
      bounds.extend([destination.lat, destination.lng]);
    }

    // Driver Marker with directional beacon
    if (driverLocation && driverLocation.lat && driverLocation.lng) {
      const heading = driverLocation.heading || 0;
      const driverIcon = L.divIcon({
        className: 'driver-car-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <!-- Pulsing radar ring -->
            <div class="absolute w-12 h-12 rounded-full bg-[#34D186]/25 animate-ping"></div>
            <!-- Car circle with arrow -->
            <div class="relative w-10 h-10 rounded-full bg-[#0F172A] border-2 border-[#34D186] flex items-center justify-center shadow-2xl text-[#34D186]" style="transform: rotate(${heading}deg);">
              <svg class="w-5 h-5 text-[#34D186]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      const carMarker = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon }).bindPopup(
        `<b>Sjåførposisjon</b>`
      );
      layerGroup.addLayer(carMarker);
      bounds.extend([driverLocation.lat, driverLocation.lng]);
    }

    // Route Polyline
    if (routeGeometry && routeGeometry.length > 0) {
      const validPoints: [number, number][] = [];
      for (const pt of routeGeometry as any[]) {
        if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
          validPoints.push([pt[0], pt[1]]);
        } else if (pt && typeof pt.lat === 'number' && typeof pt.lng === 'number') {
          validPoints.push([pt.lat, pt.lng]);
        }
      }

      if (validPoints.length > 0) {
        const polyline = L.polyline(validPoints, {
          color: '#34D186',
          weight: 6,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        });
        layerGroup.addLayer(polyline);

        validPoints.forEach(([lat, lng]) => bounds.extend([lat, lng]));
      }
    }

    // ONLY auto-fit view if:
    // 1. It is the initial render
    // 2. Or the route/pickup/destination actually changed to a new trip
    const routeChanged = currentRouteKey !== lastRouteKeyRef.current && (pickup || destination || (routeGeometry && routeGeometry.length > 0));
    
    if (!initialViewSetRef.current || routeChanged) {
      if (bounds.isValid() && (pickup || destination || (routeGeometry && routeGeometry.length > 0))) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else if (driverLocation) {
        map.setView([driverLocation.lat, driverLocation.lng], zoom);
      } else if (centerLat && centerLng) {
        map.setView([centerLat, centerLng], zoom);
      } else {
        map.setView([59.9139, 10.7522], zoom);
      }
      initialViewSetRef.current = true;
      lastRouteKeyRef.current = currentRouteKey;
    }
  }, [pickup, destination, driverLocation, routeGeometry, hotspots, showHotspots, centerLat, centerLng, zoom, currentRouteKey]);

  // Recenter handler
  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;

    if (pickup && destination) {
      const b = L.latLngBounds([[pickup.lat, pickup.lng], [destination.lat, destination.lng]]);
      if (driverLocation) b.extend([driverLocation.lat, driverLocation.lng]);
      map.fitBounds(b, { padding: [50, 50], maxZoom: 15 });
    } else if (driverLocation) {
      map.setView([driverLocation.lat, driverLocation.lng], 15);
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 15);
    } else if (centerLat && centerLng) {
      map.setView([centerLat, centerLng], zoom);
    } else {
      map.setView([59.9139, 10.7522], 13);
    }
  };

  return (
    <div className={className}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {showRecenterButton && (
        <button
          type="button"
          onClick={handleRecenter}
          title="Sentrér kart på min posisjon"
          className="absolute bottom-4 right-4 z-[500] p-2.5 bg-[#0F172A]/90 hover:bg-[#1E293B] text-[#34D186] border border-white/20 rounded-xl shadow-2xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <Locate className="w-4 h-4 text-[#34D186]" />
          <span className="hidden xs:inline">Sentrér</span>
        </button>
      )}
    </div>
  );
};
