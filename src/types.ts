export type TripStatus =
  | 'pending'
  | 'requested'
  | 'searching_driver'
  | 'accepted'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'trip_started'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type UserRole = 'customer' | 'driver' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  password?: string;
  pinCode?: string;
  address?: string;
  postalCode?: string;
  role: UserRole;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  favoriteAddresses?: { name: string; address: string }[];
}

export interface LocationPoint {
  address: string;
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  tripId?: string;
  guestId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  
  pickup: LocationPoint;
  destination: LocationPoint;
  viaStops?: string[];
  
  passengers: number;
  luggage: number;
  isPreorder: boolean;
  scheduledTime?: string;
  notes?: string;
  
  // Dynamic Route Metrics
  distanceKm: number;
  durationMinutes: number;
  routeGeometry?: ([number, number] | { lat: number; lng: number })[]; // [lat, lng] or {lat, lng} points for polyline
  
  // Financials
  estimatedPrice: number;
  finalPrice?: number;
  originalPrice?: number;
  discountAmount?: number;
  couponCode?: string;
  ratePerKm: number;
  startFee: number;
  airportFee?: number;
  tollFee?: number;
  tip?: number;
  tipAmount?: number;
  commissionAron: number; // 15%
  driverPayout: number;    // 85%
  paymentMethod: 'vipps' | 'card' | 'apple_pay' | 'cash' | 'invoice' | 'stripe';
  paymentStatus: 'pending' | 'completed' | 'pending_payment' | 'paid' | 'payment_failed' | 'cancelled';
  stripeSessionId?: string;
  paymentIntentId?: string;
  paidAt?: string;
  receiptUrl?: string;
  
  // Luxury & Vehicle Tier
  vehicleCategory?: 'vip_black' | 'comfort_eco' | 'airport_vip';
  ridePreferences?: {
    quietRide?: boolean;
    temperature?: 'cool' | 'warm' | 'normal';
    luggageHelp?: boolean;
    childSeat?: boolean;
    petFriendly?: boolean;
  };
  flightNumber?: string;

  // Driver & Vehicle
  driverId?: string;
  assignedDriverId?: string;
  driverName?: string;
  driverPhone?: string;
  permitNumber?: string;
  vehicleId?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  driverLocation?: { lat: number; lng: number; heading?: number; speed?: number };
  rejectedDriverIds?: string[];
  
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface EmergencyAlert {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  permitNumber?: string;
  location?: { lat: number; lng: number; heading?: number; speed?: number };
  activeTripId?: string;
  tripDetails?: {
    customerName?: string;
    customerPhone?: string;
    pickup?: string;
    destination?: string;
    price?: number;
  };
  notes?: string;
  status: 'active' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  pinCode?: string;
  licenseNumber: string;
  permitNumber?: string;
  driverCardNumber?: string;
  assignedVehicles?: string[]; // IDs of vehicles authorized for this driver (e.g. ['v1', 'v2'])
  vehicleId?: string;
  vehicleName?: string;
  vehiclePlate?: string;
  isOnline: boolean;
  currentLocation?: { lat: number; lng: number; heading?: number; speed?: number };
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalTrips: number;
  rating: number;
  ratingCount?: number;
  tips?: number;
  todayDistanceKm?: number;
  todayOnlineSeconds?: number;
  insuranceNotes?: string;
  documentsVerified?: boolean;
  status?: 'active' | 'pending_approval' | 'suspended' | 'rejected';
  applicationId?: string;
}

export type DriverApplicationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export interface DriverApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  birthDate?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  licenseNumber: string; // Førerkortnummer (Klasse B)
  licenseExpiryDate?: string;
  permitNumber?: string; // Drosjeløyvenummer
  driverCardNumber?: string; // Kjøreseddelnummer
  driverCardExpiryDate?: string;
  experienceYears?: number | string; // Erfaring
  hasOwnVehicle: boolean;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleYear?: number;
  languages?: string[];
  backgroundCheckClean: boolean; // Bekreftet plettfri vandel
  notes?: string;
  status: DriverApplicationStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  model: string;
  licensePlate: string;
  permitNumber: string;
  year: number;
  color: string;
  fuelType: 'Elektrisk' | 'Hybrid' | 'Bensin' | 'Diesel';
  status: 'active' | 'service' | 'inactive';
  assignedDriverId?: string;
  assignedDriverName?: string;
  imageUrls: string[];
  seats: number;
  rangeKm: number;
  features: string[];
}

export interface PricingConfig {
  dayRateKm: number;      // e.g. 18 NOK/km (06:00 - 18:00)
  nightRateKm: number;    // e.g. 20 NOK/km (18:00 - 06:00)
  baseStartFee: number;   // e.g. 54 NOK
  airportAddition: number;// e.g. 150 NOK
  vatRate: number;        // e.g. 12% for taxi in Norway
  commissionRate: number; // 0.15 (15%)
}

export interface DriverExpense {
  id: string;
  driverId: string;
  category: 'charging' | 'toll' | 'wash' | 'maintenance' | 'other';
  amount: number;
  description: string;
  date: string;
}

export interface Invoice {
  id: string;
  tripId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  orgNumber?: string;
  kidNumber: string;
  issueDate: string;
  dueDate: string;
  pickupAddress: string;
  destinationAddress: string;
  distanceKm?: number;
  durationMinutes?: number;
  vehiclePlate?: string;
  permitNumber?: string;
  amountExVat: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'credited';
  paymentMethod: 'invoice' | 'vipps' | 'card' | 'bank_transfer' | 'cash';
  notes?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
  minTripAmount?: number;
  description: string;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'drivers' | 'passengers';
  channel: 'push' | 'sms' | 'system';
  sentAt: string;
  deliveredCount: number;
}

export interface SurgeZone {
  id: string;
  name: string;
  multiplier: number;
  radiusKm: number;
  centerLat: number;
  centerLng: number;
  lat?: number;
  lng?: number;
  isActive: boolean;
  category: 'Sentrum' | 'Flyplass' | 'Natteliv' | 'Arrangement' | 'Vær';
}

export interface CorporatePartner {
  id: string;
  companyName: string;
  orgNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  contactEmail?: string;
  contactPhone?: string;
  billingAddress?: string;
  billingCycle?: 'monthly' | 'biweekly';
  creditLimit: number;
  currentBalance: number;
  discountPercent: number;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'trip_created' | 'driver_assigned' | 'driver_arrived' | 'trip_started' | 'trip_completed' | 'trip_cancelled' | 'emergency' | 'broadcast' | 'info';
  targetRole: 'all' | 'admin' | 'driver' | 'customer';
  targetUserId?: string;
  tripId?: string;
  isRead: boolean;
  actionUrl?: string;
  soundType?: 'request' | 'accepted' | 'arrived' | 'started' | 'completed' | 'cancel' | 'emergency' | 'ping';
}

export type Language = 'no' | 'en';

