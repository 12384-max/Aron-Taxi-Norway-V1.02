import { Vehicle, Driver, PricingConfig } from '../types';
import eqeFront from '../assets/images/real_mercedes_eqe_front_1786900915150.jpg';
import eqeSide from '../assets/images/real_mercedes_eqe_side_1786900927080.jpg';
import eqeInterior from '../assets/images/real_mercedes_eqe_interior_1786900938158.jpg';
import eqeRear from '../assets/images/real_mercedes_eqe_rear_1786900951388.jpg';

export const TESLA_MODEL_Y_IMAGES = [
  'https://cdn.shopify.com/s/files/1/0749/4212/0071/files/WhatsApp_Image_2026-08-05_at_22.57.55_2.jpg?v=1786652864',
  'https://cdn.shopify.com/s/files/1/0749/4212/0071/files/WhatsApp_Image_2026-08-05_at_22.57.55.jpg?v=1786652863'
];

export const MERCEDES_EQE_IMAGES = [
  eqeFront,
  eqeSide,
  eqeInterior,
  eqeRear
];

export const OFFICIAL_ASSETS = {
  logo: 'https://cdn.shopify.com/s/files/1/0749/4212/0071/files/ChatGPT_Image_25._juli_2026_22_28_14.png?v=1785534957',
  teslaCars: TESLA_MODEL_Y_IMAGES,
  mercedesCars: MERCEDES_EQE_IMAGES,
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
    model: 'Tesla Model Y Juniper',
    licensePlate: '',
    permitNumber: '',
    year: 2025,
    color: 'Midnatt Svart',
    fuelType: 'Elektrisk',
    status: 'active',
    assignedDriverId: undefined,
    assignedDriverName: undefined,
    imageUrls: TESLA_MODEL_Y_IMAGES,
    seats: 4,
    rangeKm: 565,
    features: [
      '100% Elektrisk Tesla Model Y Juniper',
      'Panoramatak i helglass',
      'Romslig bagasjeplass og sittekomfort',
      'Stillegående og utslippsfri kjøring',
      'Topp moderne sikkerhets- og navigasjonsteknologi',
      'Førsteklasses privatsjåføropplevelse i Oslo'
    ]
  },
  {
    id: 'v2',
    model: 'Mercedes-Benz EQE Sedan',
    licensePlate: '',
    permitNumber: '',
    year: 2025,
    color: 'Obsidian Svart',
    fuelType: 'Elektrisk',
    status: 'active',
    assignedDriverId: undefined,
    assignedDriverName: undefined,
    imageUrls: MERCEDES_EQE_IMAGES,
    seats: 4,
    rangeKm: 618,
    features: [
      '100% Elektrisk Mercedes-Benz EQE luksussedan',
      'Airmatic adaptiv luftfjæring',
      'Burmester 3D Surround lydanlegg',
      'MBUX Digital Widescreen',
      'Perforert skinninteriør med ambient belysning',
      'Akustikkglass med maksimal støydemping',
      'Førsteklasses VIP- og direktørkomfort'
    ]
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'Aron',
    email: 'aron.taxi@hotmail.com',
    phone: '+47 96 99 09 01',
    licenseNumber: 'NO-984501',
    permitNumber: 'TAX-001-OSLO',
    assignedVehicles: ['v1'],
    vehicleId: 'v1',
    vehicleName: 'Tesla Model Y Juniper',
    vehiclePlate: 'EL 98450',
    isOnline: false,
    currentLocation: { lat: 59.9139, lng: 10.7522 },
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalTrips: 0,
    rating: 5.0,
    ratingCount: 0,
    tips: 0,
    todayDistanceKm: 0,
    todayOnlineSeconds: 0
  },
  {
    id: 'd2',
    name: 'Tariq',
    email: 'tariq@arontaxi.no',
    phone: '+47 96 99 09 01',
    licenseNumber: 'NO-984502',
    permitNumber: 'TAX-002-OSLO',
    assignedVehicles: ['v2'],
    vehicleId: 'v2',
    vehicleName: 'Mercedes-Benz EQE Sedan',
    vehiclePlate: 'EK 74219',
    isOnline: false,
    currentLocation: { lat: 59.9234, lng: 10.7579 },
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalTrips: 0,
    rating: 5.0,
    ratingCount: 0,
    tips: 0,
    todayDistanceKm: 0,
    todayOnlineSeconds: 0
  }
];

