import { LocationPoint, PricingConfig } from '../types';
import { INITIAL_PRICING } from '../constants/assets';

export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][]; // [lat, lng]
}

const POPULAR_PRESETS: GeocodeResult[] = [
  { address: 'Oslo S / Jernbanetorget, 0154 Oslo', lat: 59.9111, lng: 10.7528 },
  { address: 'Oslo Lufthavn Gardermoen (OSL), 2060 Gardermoen', lat: 60.1975, lng: 11.1004 },
  { address: 'Karl Johans gate, 0159 Oslo', lat: 59.9139, lng: 10.7410 },
  { address: 'Nationaltheatret Stasjon, 0160 Oslo', lat: 59.9142, lng: 10.7339 },
  { address: 'Aker Brygge, 0250 Oslo', lat: 59.9103, lng: 10.7266 },
  { address: 'Majorstuen T-bane, 0359 Oslo', lat: 59.9298, lng: 10.7153 },
  { address: 'Grünerløkka, 0554 Oslo', lat: 59.9231, lng: 10.7579 },
  { address: 'Nydalen, 0484 Oslo', lat: 59.9508, lng: 10.7644 },
  { address: 'Lysaker Stasjon, 1366 Lysaker', lat: 59.9130, lng: 10.6380 },
  { address: 'Fornebu, 1364 Fornebu', lat: 59.8972, lng: 10.6258 },
  { address: 'Sandvika Stasjon, 1337 Sandvika', lat: 59.8906, lng: 10.5238 },
  { address: 'Bekkestua, 1340 Bekkestua', lat: 59.9180, lng: 10.5880 },
  { address: 'Holmenkollen, 0787 Oslo', lat: 59.9639, lng: 10.6669 },
  { address: 'Ullevål Sykehus, 0450 Oslo', lat: 59.9360, lng: 10.7360 },
  { address: 'Lillestrøm Stasjon, 2000 Lillestrøm', lat: 59.9530, lng: 11.0450 },
  { address: 'Drammen Stasjon, 3015 Drammen', lat: 59.7408, lng: 10.2033 }
];

// OpenStreetMap / Photon Search with local fallback
export async function searchAddresses(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim().toLowerCase();
  const matchedPresets = POPULAR_PRESETS.filter(p =>
    p.address.toLowerCase().includes(cleanQuery)
  );

  let apiResults: GeocodeResult[] = [];

  // 1. Try Photon API (OpenStreetMap geocoder with CORS enabled and fast responses)
  try {
    const encoded = encodeURIComponent(`${query} Norge`);
    const response = await fetch(`https://photon.komoot.io/api/?q=${encoded}&limit=5`, {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.features && Array.isArray(data.features)) {
        apiResults = data.features
          .filter((f: any) => f.geometry && f.geometry.coordinates)
          .map((f: any) => {
            const props = f.properties || {};
            const nameParts = [
              props.name,
              props.street ? `${props.street} ${props.housenumber || ''}`.trim() : null,
              props.city || props.town || props.state,
              props.country
            ].filter(Boolean);

            const addressStr = nameParts.length > 0 ? nameParts.join(', ') : 'Adresse i Norge';
            return {
              address: addressStr,
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0]
            };
          });
      }
    }
  } catch (_photonErr) {
    // Silent catch, fallback to Nominatim
  }

  // 2. Fallback to Nominatim if Photon returned no results
  if (apiResults.length === 0) {
    try {
      const encoded = encodeURIComponent(`${query}, Norge`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=no&limit=5`
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          apiResults = data.map((item: any) => ({
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }));
        }
      }
    } catch (_nomErr) {
      // Network/CORS blocked or offline
    }
  }

  // Combine results with local presets, removing duplicates
  const combined = [...apiResults, ...matchedPresets];
  const uniqueResults: GeocodeResult[] = [];
  const seenAddresses = new Set<string>();

  for (const item of combined) {
    const key = item.address.toLowerCase().slice(0, 30);
    if (!seenAddresses.has(key)) {
      seenAddresses.add(key);
      uniqueResults.push(item);
    }
  }

  return uniqueResults.slice(0, 6);
}

// OSRM Driving Route & Distance
export async function getRouteAndDistance(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteResult> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('OSRM request failed');

    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10; // 1 decimal place
      const durationMinutes = Math.round(route.duration / 60);

      // GeoJSON coordinates are [lon, lat], Leaflet needs [lat, lon]
      const geometry: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      );

      return {
        distanceKm: distanceKm || 1,
        durationMinutes: durationMinutes || 1,
        geometry
      };
    }
  } catch (err) {
    console.error('Error fetching OSRM route:', err);
  }

  // Haversine fallback if network is unreachable
  const R = 6371; // km
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLon = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const approxDistance = Math.round(R * c * 1.3 * 10) / 10; // 1.3 road multiplier
  const approxDuration = Math.round(approxDistance * 2);

  return {
    distanceKm: Math.max(1, approxDistance),
    durationMinutes: Math.max(2, approxDuration),
    geometry: [
      [fromLat, fromLng],
      [toLat, toLng]
    ]
  };
}

// Calculate Price based on exact road distance and rate configuration
export function calculateTripPrice(
  distanceKm: number,
  durationMinutes: number,
  isAirport: boolean = false,
  customPricing?: PricingConfig
) {
  const cfg = customPricing || INITIAL_PRICING;
  const currentHour = new Date().getHours();
  // Day rate 06:00 to 18:00
  const isNight = currentHour < 6 || currentHour >= 18;
  const ratePerKm = isNight ? cfg.nightRateKm : cfg.dayRateKm;

  const startFee = cfg.baseStartFee;
  const distanceCost = distanceKm * ratePerKm;
  const timeCost = durationMinutes * 2; // 2 NOK/min
  const airportFee = isAirport ? cfg.airportAddition : 0;

  const rawTotal = startFee + distanceCost + timeCost + airportFee;
  const totalRounded = Math.round(rawTotal);

  const commissionAron = Math.round(totalRounded * cfg.commissionRate);
  const driverPayout = totalRounded - commissionAron;

  return {
    ratePerKm,
    startFee,
    distanceCost: Math.round(distanceCost),
    timeCost: Math.round(timeCost),
    airportFee,
    totalPrice: Math.max(120, totalRounded), // Minimum fare 120 NOK
    commissionAron,
    driverPayout,
    isNight
  };
}
