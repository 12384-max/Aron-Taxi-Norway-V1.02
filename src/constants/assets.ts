import { Vehicle, Driver, PricingConfig } from '../types';

export const OFFICIAL_ASSETS = {
  logo: 'https://cdn.shopify.com/s/files/1/0749/4212/0071/files/ChatGPT_Image_25._juli_2026_22_28_14.png?v=1785534957',
  teslaCars: [
    'https://cdn.shopify.com/s/files/1/0749/4212/0071/files/WhatsApp_Image_2026-05-04_at_21.19.32.jpg?v=1786652897',
    'https://cdn.shopify.com/s/files/1/0749/4212/0071/files/WhatsApp_Image_2026-05-04_at_21.19.33.jpg?v=1786652898',
    'https://cdn.shopify.com/s/files/1/0749/4212/0071/files/WhatsApp_Image_2026-05-04_at_21.19.33_1_1.jpg?v=1786652897'
  ],
  mercedesCars: [
    'https://cdn.shopify.com/s/files/1/0749/4212/0071/files/WhatsApp_Image_2026-08-05_at_22.57.55_2.jpg?v=1786652864',
    'https://cdn.shopify.com/s/files/1/0749/4212/0071/files/WhatsApp_Image_2026-08-05_at_22.57.55_1.jpg?v=1786652863',
    'https://cdn.shopify.com/s/files/1/0749/4212/0071/files/WhatsApp_Image_2026-08-05_at_22.57.55.jpg?v=1786652863'
  ],
  company: {
    name: 'Aron Taxi Norway',
    tagline: 'Oslo',
    established: 'Siden 2025',
    phone: '+47 96 99 09 01',
    phoneRaw: '+4796990901',
    email: 'aron.taxi@hotmail.com'
  }
};

export const INITIAL_PRICING: PricingConfig = {
  dayRateKm: 18,        // 18 NOK/km (06:00-18:00)
  nightRateKm: 20,      // 20 NOK/km (18:00-06:00)
  baseStartFee: 54,     // 54 NOK startpris
  airportAddition: 150, // 150 NOK flyplasstillegg
  vatRate: 0.12,        // 12% MVA
  commissionRate: 0.15  // 15% Aron Taxi provisjon
};

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    model: 'Tesla Model Y',
    licensePlate: 'EP 17891',
    permitNumber: 'OS 10597',
    year: 2026,
    color: 'Svart',
    fuelType: 'Elektrisk',
    status: 'active',
    assignedDriverId: undefined,
    assignedDriverName: undefined,
    imageUrls: OFFICIAL_ASSETS.teslaCars,
    seats: 4,
    rangeKm: 533,
    features: [
      '100% Elektrisk drivlinje',
      'Løyvenummer: OS 10597',
      'Bilnummer: EP 17891',
      'Stille og eksklusiv kupé',
      'Panorama glasstak',
      'Premium skinnseter',
      'Trådløs hurtiglading',
      'Romslig bagasjerom'
    ]
  },
  {
    id: 'v2',
    model: 'Mercedes EQE',
    licensePlate: 'EF 79664',
    permitNumber: 'OS 13937',
    year: 2025,
    color: 'Svart',
    fuelType: 'Elektrisk',
    status: 'active',
    assignedDriverId: undefined,
    assignedDriverName: undefined,
    imageUrls: OFFICIAL_ASSETS.mercedesCars,
    seats: 4,
    rangeKm: 618,
    features: [
      '100% Elektrisk luksus sedan',
      'Løyvenummer: OS 13937',
      'Bilnummer: EF 79664',
      'Airmatic adaptiv luftfjæring',
      'Burmester 3D Surround lyd',
      'Nappa skinn og ambient lys',
      'Akustikkglass (støydemping)',
      'Førsteklasses komfort'
    ]
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'Aron (Sjåfør 1)',
    email: 'sjafor1@arontaxi.no',
    phone: '+47 96 99 09 01',
    licenseNumber: 'OS 10597',
    permitNumber: 'OS 10597',
    assignedVehicles: ['v1', 'v2'],
    vehicleId: undefined,
    vehicleName: undefined,
    vehiclePlate: undefined,
    isOnline: false,
    currentLocation: { lat: 59.9139, lng: 10.7522 },
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalTrips: 0,
    rating: 0,
    ratingCount: 0,
    tips: 0,
    todayDistanceKm: 0,
    todayOnlineSeconds: 0
  },
  {
    id: 'd2',
    name: 'Tariq (Sjåfør 2)',
    email: 'sjafor2@arontaxi.no',
    phone: '+47 96 99 09 01',
    licenseNumber: 'OS 13937',
    permitNumber: 'OS 13937',
    assignedVehicles: ['v1', 'v2'],
    vehicleId: undefined,
    vehicleName: undefined,
    vehiclePlate: undefined,
    isOnline: false,
    currentLocation: { lat: 59.9200, lng: 10.7400 },
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalTrips: 0,
    rating: 0,
    ratingCount: 0,
    tips: 0,
    todayDistanceKm: 0,
    todayOnlineSeconds: 0
  }
];
