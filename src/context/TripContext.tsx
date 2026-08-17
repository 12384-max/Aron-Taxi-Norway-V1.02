import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trip, TripStatus, Driver, Vehicle, PricingConfig, DriverExpense, UserProfile, EmergencyAlert, DriverApplication } from '../types';
import { INITIAL_DRIVERS, INITIAL_VEHICLES, INITIAL_PRICING } from '../constants/assets';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, runTransaction, getDoc } from 'firebase/firestore';
import { queryTripsFromFirestore, TripQueryFilter, TripQueryResult } from '../services/tripQueryService';
import { removeUndefinedFields } from '../utils/firestoreHelper';
import { notificationService } from '../services/notificationService';

// No demo customers - only real registered users from Firestore
const INITIAL_CUSTOMERS: UserProfile[] = [];

interface TripContextType {
  trips: Trip[];
  drivers: Driver[];
  driverApplications: DriverApplication[];
  vehicles: Vehicle[];
  customers: UserProfile[];
  pricing: PricingConfig;
  expenses: DriverExpense[];
  emergencyAlerts: EmergencyAlert[];
  
  createTrip: (tripData: Omit<Trip, 'id' | 'status' | 'createdAt' | 'updatedAt'>, existingTripId?: string) => Promise<Trip>;
  getTripById: (id: string) => Trip | undefined;
  assignDriverToTrip: (tripId: string, driverId: string) => void;
  acceptTripAtomic: (tripId: string, driverId: string) => Promise<{ success: boolean; error?: string }>;
  rejectTrip: (tripId: string, driverId: string) => Promise<void>;
  updateTripStatus: (tripId: string, status: TripStatus, location?: { lat: number; lng: number }) => void;
  toggleDriverOnline: (driverId: string, isOnline: boolean) => void;
  updateDriverLocation: (driverId: string, loc: { lat: number; lng: number; heading?: number; speed?: number }, activeTripId?: string) => void;
  selectDriverVehicle: (driverId: string, vehicleId: string) => Promise<void>;
  updatePricingConfig: (newPricing: PricingConfig) => void;
  updatePricing: (newPricing: PricingConfig) => void;
  addExpense: (expense: Omit<DriverExpense, 'id'>) => void;
  
  // Emergency & Dispatch
  triggerEmergencyAlert: (driverId: string, customNotes?: string) => Promise<EmergencyAlert>;
  resolveEmergencyAlert: (alertId: string, resolvedBy?: string) => Promise<void>;
  
  // Driver Applications & Approval
  submitDriverApplication: (appData: Omit<DriverApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<DriverApplication>;
  approveDriverApplication: (applicationId: string, options?: { vehicleId?: string; permitNumber?: string; adminNotes?: string }) => Promise<void>;
  rejectDriverApplication: (applicationId: string, reason?: string) => Promise<void>;
  deleteDriverApplication: (applicationId: string) => Promise<void>;
  
  // Driver Management
  addDriver: (driverData: Omit<Driver, 'id' | 'todayEarnings' | 'weekEarnings' | 'monthEarnings' | 'totalTrips' | 'rating'> & { password?: string }) => Promise<Driver>;
  updateDriver: (driverId: string, updates: Partial<Driver>) => Promise<void>;
  deleteDriver: (driverId: string) => Promise<void>;
  unassignDriverVehicle: (driverId: string) => Promise<void>;
  
  // Vehicle Fleet Management
  addVehicle: (vehicleData: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
  resetFleetToOfficial: () => Promise<void>;
  
  // Customer Management
  addCustomer: (customerData: Omit<UserProfile, 'uid' | 'createdAt'> & { password?: string }) => Promise<UserProfile>;
  updateCustomer: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteCustomer: (uid: string) => Promise<void>;

  addTipToTrip: (tripId: string, tipAmount: number) => void;
  addTipAndRatingToTrip: (tripId: string, rating: number, tipAmount: number, comment?: string) => Promise<void>;
  queryFirestoreTrips: (filters: TripQueryFilter) => Promise<TripQueryResult>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('aron_trips');
    return saved ? JSON.parse(saved) : [];
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('aron_drivers');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('aron_vehicles');
    if (saved) {
      try {
        const parsed: Vehicle[] = JSON.parse(saved);
        // Ensure strictly only the 2 official vehicles (v1 Tesla Model Y Juniper, v2 Mercedes-Benz EQE Sedan)
        const validVehicles = parsed.filter(v => v.id === 'v1' || v.id === 'v2').map(v => {
          const initMatch = INITIAL_VEHICLES.find(iv => iv.id === v.id);
          return initMatch ? { ...v, imageUrls: initMatch.imageUrls, model: initMatch.model } : v;
        });
        if (validVehicles.length === 2) {
          return validVehicles;
        }
      } catch (e) {}
    }
    return INITIAL_VEHICLES;
  });

  const [customers, setCustomers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('aron_customers');
    if (saved) {
      const parsed: UserProfile[] = JSON.parse(saved);
      return parsed.filter(c => !c.uid.startsWith('cust_sample_'));
    }
    return [];
  });

  const [pricing, setPricing] = useState<PricingConfig>(() => {
    const saved = localStorage.getItem('aron_pricing');
    return saved ? JSON.parse(saved) : INITIAL_PRICING;
  });

  const [expenses, setExpenses] = useState<DriverExpense[]>(() => {
    const saved = localStorage.getItem('aron_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>(() => {
    const saved = localStorage.getItem('aron_emergency_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  const [driverApplications, setDriverApplications] = useState<DriverApplication[]>(() => {
    const saved = localStorage.getItem('aron_driver_applications');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage and broadcast channel for multi-tab live sync
  const saveTrips = (newTrips: Trip[]) => {
    setTrips(newTrips);
    localStorage.setItem('aron_trips', JSON.stringify(newTrips));
    window.dispatchEvent(new Event('aron_trips_updated'));
  };

  const saveDrivers = (newDrivers: Driver[]) => {
    setDrivers(newDrivers);
    localStorage.setItem('aron_drivers', JSON.stringify(newDrivers));
    window.dispatchEvent(new Event('aron_drivers_updated'));
  };

  const saveDriverApplications = (newApps: DriverApplication[]) => {
    setDriverApplications(newApps);
    localStorage.setItem('aron_driver_applications', JSON.stringify(newApps));
    window.dispatchEvent(new Event('aron_driver_apps_updated'));
  };

  const saveVehicles = (newVehicles: Vehicle[]) => {
    setVehicles(newVehicles);
    localStorage.setItem('aron_vehicles', JSON.stringify(newVehicles));
    window.dispatchEvent(new Event('aron_vehicles_updated'));
  };

  const saveCustomers = (newCustomers: UserProfile[]) => {
    setCustomers(newCustomers);
    localStorage.setItem('aron_customers', JSON.stringify(newCustomers));
    window.dispatchEvent(new Event('aron_customers_updated'));
  };

  const saveEmergencyAlerts = (newAlerts: EmergencyAlert[]) => {
    setEmergencyAlerts(newAlerts);
    localStorage.setItem('aron_emergency_alerts', JSON.stringify(newAlerts));
    window.dispatchEvent(new Event('aron_emergency_updated'));
  };

  useEffect(() => {
    // Listen to window storage events across tabs
    const handleSync = () => {
      const savedTrips = localStorage.getItem('aron_trips');
      if (savedTrips) setTrips(JSON.parse(savedTrips));

      const savedDrivers = localStorage.getItem('aron_drivers');
      if (savedDrivers) setDrivers(JSON.parse(savedDrivers));

      const savedApps = localStorage.getItem('aron_driver_applications');
      if (savedApps) setDriverApplications(JSON.parse(savedApps));

      const savedVehicles = localStorage.getItem('aron_vehicles');
      if (savedVehicles) setVehicles(JSON.parse(savedVehicles));

      const savedCustomers = localStorage.getItem('aron_customers');
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));

      const savedAlerts = localStorage.getItem('aron_emergency_alerts');
      if (savedAlerts) setEmergencyAlerts(JSON.parse(savedAlerts));
    };

    window.addEventListener('aron_trips_updated', handleSync);
    window.addEventListener('aron_drivers_updated', handleSync);
    window.addEventListener('aron_driver_apps_updated', handleSync);
    window.addEventListener('aron_vehicles_updated', handleSync);
    window.addEventListener('aron_customers_updated', handleSync);
    window.addEventListener('aron_emergency_updated', handleSync);
    window.addEventListener('storage', handleSync);

    // Initial first-time seeding ONLY if brand new installation
    const isSeeded = localStorage.getItem('aron_initialized_flag_v2');
    if (!isSeeded) {
      localStorage.setItem('aron_initialized_flag_v2', 'true');
      try {
        INITIAL_DRIVERS.forEach((driver) => {
          setDoc(doc(db, 'drivers', driver.id), driver, { merge: true }).catch(() => {});
        });

        INITIAL_VEHICLES.forEach((vehicle) => {
          setDoc(doc(db, 'vehicles', vehicle.id), vehicle, { merge: true }).catch(() => {});
        });
      } catch (e) {}
    }

    try {
      // Firestore live snapshot listeners that accurately reflect additions AND deletions
      const tripsUnsub = onSnapshot(collection(db, 'trips'), (snapshot) => {
        const fsTrips: Trip[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Trip;
          if (data && data.id && !data.id.startsWith('demo_')) {
            fsTrips.push(data);
          }
        });
        // Sort newest first
        fsTrips.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setTrips(fsTrips);
        localStorage.setItem('aron_trips', JSON.stringify(fsTrips));
      }, (err) => console.log('Firestore trip listener note:', err.message));

      const driversUnsub = onSnapshot(collection(db, 'drivers'), (snapshot) => {
        const fsDrivers: Driver[] = [];
        snapshot.forEach((d) => fsDrivers.push(d.data() as Driver));
        setDrivers(fsDrivers);
        localStorage.setItem('aron_drivers', JSON.stringify(fsDrivers));
      }, (err) => console.log('Firestore driver listener note:', err.message));

      const vehiclesUnsub = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
        const fsVehicles: Vehicle[] = [];
        snapshot.forEach((d) => {
          const v = d.data() as Vehicle;
          if (v && (v.id === 'v1' || v.id === 'v2')) {
            const initMatch = INITIAL_VEHICLES.find(iv => iv.id === v.id);
            fsVehicles.push(initMatch ? { ...v, imageUrls: initMatch.imageUrls, model: initMatch.model } : v);
          }
        });
        if (fsVehicles.length > 0) {
          setVehicles(fsVehicles);
          localStorage.setItem('aron_vehicles', JSON.stringify(fsVehicles));
        } else {
          setVehicles(INITIAL_VEHICLES);
          localStorage.setItem('aron_vehicles', JSON.stringify(INITIAL_VEHICLES));
        }
      }, (err) => console.log('Firestore vehicle listener note:', err.message));

      const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        const fsUsers: UserProfile[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as UserProfile;
          if (data && data.uid && !data.uid.startsWith('cust_sample_')) {
            fsUsers.push(data);
          }
        });
        setCustomers(fsUsers);
        localStorage.setItem('aron_customers', JSON.stringify(fsUsers));
      }, (err) => console.log('Firestore users listener note:', err.message));

      const alertsUnsub = onSnapshot(collection(db, 'emergency_alerts'), (snapshot) => {
        const fsAlerts: EmergencyAlert[] = [];
        snapshot.forEach((d) => fsAlerts.push(d.data() as EmergencyAlert));
        fsAlerts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setEmergencyAlerts(fsAlerts);
        localStorage.setItem('aron_emergency_alerts', JSON.stringify(fsAlerts));
      }, (err) => console.log('Firestore emergency alert listener note:', err.message));

      const driverAppsUnsub = onSnapshot(collection(db, 'driver_applications'), (snapshot) => {
        const fsApps: DriverApplication[] = [];
        snapshot.forEach((d) => fsApps.push(d.data() as DriverApplication));
        fsApps.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setDriverApplications(fsApps);
        localStorage.setItem('aron_driver_applications', JSON.stringify(fsApps));
      }, (err) => console.log('Firestore driver applications listener note:', err.message));

      return () => {
        tripsUnsub();
        driversUnsub();
        vehiclesUnsub();
        usersUnsub();
        alertsUnsub();
        driverAppsUnsub();
        window.removeEventListener('aron_trips_updated', handleSync);
        window.removeEventListener('aron_drivers_updated', handleSync);
        window.removeEventListener('aron_driver_apps_updated', handleSync);
        window.removeEventListener('aron_vehicles_updated', handleSync);
        window.removeEventListener('aron_customers_updated', handleSync);
        window.removeEventListener('aron_emergency_updated', handleSync);
        window.removeEventListener('storage', handleSync);
      };
    } catch (e) {
      // Fallback to local storage bus
    }
  }, []);

  const createTrip = async (
    tripData: Omit<Trip, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
    existingTripId?: string
  ): Promise<Trip> => {
    const id = existingTripId || `TRIP-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const isStripePending = tripData.paymentStatus === 'pending_payment';
    const initialStatus: TripStatus = isStripePending ? 'pending_payment' : 'confirmed';

    const newTrip: Trip = {
      ...tripData,
      id,
      tripId: id,
      status: initialStatus,
      rejectedDriverIds: [],
      createdAt: now,
      updatedAt: now
    };

    const updatedTrips = [newTrip, ...trips.filter((t) => t.id !== id)];
    saveTrips(updatedTrips);

    // 1. Notify Admin (push + chime + in-app)
    notificationService.notify({
      title: isStripePending ? '💳 Stripe-betaling startet' : '🚕 Ny tur bestilt!',
      message: `${newTrip.customerName || 'Passasjer'} (${newTrip.pickup?.address || 'Hentested'} → ${newTrip.destination?.address || 'Destinasjon'}, ${newTrip.estimatedPrice} kr)`,
      type: 'trip_created',
      targetRole: 'admin',
      tripId: id,
      actionUrl: '/admin',
      soundType: 'request'
    });

    // Only dispatch to drivers and confirm to customer IF paid or cash/invoice!
    if (!isStripePending) {
      // 2. Notify Drivers (chime + push on mobile/PC)
      notificationService.notify({
        title: '⚡ Ny turforespørsel tilgjengelig',
        message: `${newTrip.pickup?.address || 'Oslo'} → ${newTrip.destination?.address || 'Destinasjon'} (${newTrip.estimatedPrice} kr)`,
        type: 'trip_created',
        targetRole: 'driver',
        tripId: id,
        actionUrl: '/driver',
        soundType: 'request'
      });

      // 3. Notify Customer
      notificationService.notify({
        title: '✅ Bestilling bekreftet',
        message: `Turforespørsel registrert. Vi søker etter nærmeste ledige sjåfør i Oslo.`,
        type: 'trip_created',
        targetRole: 'customer',
        targetUserId: newTrip.customerId,
        tripId: id,
        actionUrl: '/konto',
        soundType: 'ping'
      });
    }

    try {
      const cleanData = removeUndefinedFields(newTrip);
      await setDoc(doc(db, 'trips', id), cleanData, { merge: true });
      console.log('✅ Tur synkronisert til skyen (Firestore):', id, 'status:', initialStatus);
    } catch (err: any) {
      console.error('❌ Feil ved lagring av tur til Firestore:', err?.message || err);
    }

    return newTrip;
  };

  const getTripById = (id: string) => {
    return trips.find((t) => t.id === id);
  };

  const assignDriverToTrip = (tripId: string, driverId: string) => {
    const targetDriver = drivers.find((d) => d.id === driverId);
    const targetVehicle = vehicles.find((v) => v.id === targetDriver?.vehicleId) || vehicles[0];
    const targetTrip = trips.find((t) => t.id === tripId);

    const now = new Date().toISOString();
    const updated = trips.map((t) => {
      if (t.id === tripId) {
        return {
          ...t,
          driverId,
          assignedDriverId: driverId,
          driverName: targetDriver?.name || 'Aron Sjåfør',
          driverPhone: targetDriver?.phone || '+47 96 99 09 01',
          vehicleId: targetDriver?.vehicleId || targetVehicle?.id || 'v1',
          vehicleModel: targetDriver?.vehicleName || targetVehicle?.model || 'Tesla Model Y',
          vehicleLicensePlate: targetDriver?.vehiclePlate || targetVehicle?.licensePlate || 'EP 17891',
          permitNumber: targetDriver?.permitNumber || targetVehicle?.permitNumber || 'OS 10597',
          driverLocation: targetDriver?.currentLocation || { lat: 59.9139, lng: 10.7522 },
          status: 'driver_assigned' as TripStatus,
          updatedAt: now
        };
      }
      return t;
    });

    saveTrips(updated);

    // Notify Customer on PC and mobile
    if (targetDriver) {
      notificationService.notify({
        title: '🚗 Sjåfør på vei!',
        message: `${targetDriver.name} i ${targetDriver.vehicleName || targetVehicle?.model || 'Tesla'} (${targetDriver.vehiclePlate || targetVehicle?.licensePlate || ''}) er på vei til hentepunktet.`,
        type: 'driver_assigned',
        targetRole: 'customer',
        targetUserId: targetTrip?.customerId,
        tripId: tripId,
        actionUrl: '/konto',
        soundType: 'accepted'
      });

      // Notify Admin
      notificationService.notify({
        title: '👤 Sjåfør tildelt tur',
        message: `${targetDriver.name} er tildelt tur ${tripId} (${targetTrip?.customerName || 'Kunde'}).`,
        type: 'driver_assigned',
        targetRole: 'admin',
        tripId: tripId,
        actionUrl: '/admin',
        soundType: 'accepted'
      });

      // Notify Driver
      notificationService.notify({
        title: '🎯 Oppdrag bekreftet',
        message: `Du er tildelt tur for ${targetTrip?.customerName || 'kunde'} til ${targetTrip?.pickup?.address || 'Hentested'}.`,
        type: 'driver_assigned',
        targetRole: 'driver',
        targetUserId: driverId,
        tripId: tripId,
        actionUrl: '/driver',
        soundType: 'accepted'
      });
    }

    try {
      const updatedTrip = updated.find((t) => t.id === tripId);
      if (updatedTrip) {
        setDoc(doc(db, 'trips', tripId), removeUndefinedFields(updatedTrip), { merge: true }).catch(() => {});
      }
    } catch (e) {}
  };


  // Atomic Firestore Concurrency for accepting a trip (ensures only 1 driver gets the ride)
  const acceptTripAtomic = async (tripId: string, driverId: string): Promise<{ success: boolean; error?: string }> => {
    const targetDriver = drivers.find((d) => d.id === driverId);
    if (!targetDriver) return { success: false, error: 'Fant ikke sjåførprofil.' };

    const targetVehicle = vehicles.find((v) => v.id === targetDriver.vehicleId) || vehicles[0];
    const now = new Date().toISOString();
    const localTrip = trips.find((t) => t.id === tripId || t.tripId === tripId);

    const tripUpdates: Partial<Trip> = {
      driverId,
      assignedDriverId: driverId,
      driverName: targetDriver.name,
      driverPhone: targetDriver.phone,
      vehicleId: targetDriver.vehicleId || targetVehicle?.id || 'v1',
      vehicleModel: targetDriver.vehicleName || targetVehicle?.model || 'Tesla Model Y',
      vehicleLicensePlate: targetDriver.vehiclePlate || targetVehicle?.licensePlate || 'EP 17891',
      permitNumber: targetDriver.permitNumber || targetVehicle?.permitNumber || 'OS 10597',
      driverLocation: targetDriver.currentLocation || { lat: 59.9139, lng: 10.7522 },
      status: 'driver_assigned',
      updatedAt: now
    };

    const cleanTripUpdates = removeUndefinedFields(tripUpdates);

    try {
      const tripRef = doc(db, 'trips', tripId);
      await runTransaction(db, async (transaction) => {
        const tripDoc = await transaction.get(tripRef);
        if (!tripDoc.exists()) {
          // If the document doesn't exist in Firestore yet, but is available locally, write it directly!
          if (localTrip) {
            transaction.set(tripRef, removeUndefinedFields({
              ...localTrip,
              ...tripUpdates
            }));
            return true;
          }
          throw new Error('Turen eksisterer ikke lenger.');
        }

        const data = tripDoc.data() as Trip;
        // Verify trip is still unassigned / waiting for driver or already assigned to this driver
        if (data.driverId && data.driverId !== driverId) {
          throw new Error('Turen ble nettopp tatt av en annen sjåfør.');
        }
        const validStatuses: TripStatus[] = ['pending', 'requested', 'searching_driver', 'driver_assigned', 'accepted'];
        if (data.status && !validStatuses.includes(data.status)) {
          throw new Error('Denne turen er ikke lenger tilgjengelig.');
        }

        transaction.update(tripRef, cleanTripUpdates);
        return true;
      });

      // Update local state and notify storage
      assignDriverToTrip(tripId, driverId);
      return { success: true };
    } catch (err: any) {
      console.warn('Accept trip transaction error / fallback:', err.message);

      // If another driver actually took the trip concurrently, respect that
      if (err.message === 'Turen ble nettopp tatt av en annen sjåfør.') {
        return { success: false, error: err.message };
      }

      // If we have the trip locally, apply assignment gracefully so driver is never blocked
      if (localTrip) {
        assignDriverToTrip(tripId, driverId);
        try {
          const mergedTrip: Trip = {
            ...localTrip,
            ...tripUpdates
          };
          await setDoc(doc(db, 'trips', tripId), removeUndefinedFields(mergedTrip), { merge: true });
        } catch (syncErr) {
          console.warn('Fallback setDoc error:', syncErr);
        }
        return { success: true };
      }

      return { success: false, error: err.message || 'Kunne ikke godta turen.' };
    }
  };

  // Reject trip for a single driver (adds driverId to rejectedDriverIds)
  const rejectTrip = async (tripId: string, driverId: string) => {
    const target = trips.find(t => t.id === tripId);
    if (!target) return;

    const currentRejected = target.rejectedDriverIds || [];
    if (!currentRejected.includes(driverId)) {
      const updatedRejected = [...currentRejected, driverId];
      const updated = trips.map(t => t.id === tripId ? { ...t, rejectedDriverIds: updatedRejected } : t);
      saveTrips(updated);
      try {
        await setDoc(doc(db, 'trips', tripId), { rejectedDriverIds: updatedRejected }, { merge: true });
      } catch (err) {
        console.warn('Reject trip write error:', err);
      }
    }
  };

  // Emergency Alert Trigger from Driver App
  const triggerEmergencyAlert = async (driverId: string, customNotes?: string): Promise<EmergencyAlert> => {
    const targetDriver = drivers.find(d => d.id === driverId);
    const targetVehicle = vehicles.find(v => v.id === targetDriver?.vehicleId);
    const active = trips.find(t => t.driverId === driverId && t.status !== 'completed' && t.status !== 'cancelled');

    const id = `EMG-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newAlert: EmergencyAlert = {
      id,
      driverId,
      driverName: targetDriver?.name || 'Aron Sjåfør',
      driverPhone: targetDriver?.phone || '+47 96 99 09 01',
      vehiclePlate: targetDriver?.vehiclePlate || targetVehicle?.licensePlate || 'Ukjent bil',
      vehicleModel: targetDriver?.vehicleName || targetVehicle?.model || 'Tesla Model Y',
      permitNumber: targetDriver?.permitNumber || targetVehicle?.permitNumber || 'OS 10597',
      location: targetDriver?.currentLocation,
      activeTripId: active?.id,
      tripDetails: active ? {
        customerName: active.customerName,
        customerPhone: active.customerPhone,
        pickup: active.pickup?.address,
        destination: active.destination?.address,
        price: active.estimatedPrice
      } : undefined,
      notes: customNotes || 'Nødsituasjonsvarsel / taus alarm utløst fra sjåførkonsoll',
      status: 'active',
      createdAt: now
    };

    const updated = [newAlert, ...emergencyAlerts];
    saveEmergencyAlerts(updated);

    // Emergency Notification with Siren sound and device vibration
    notificationService.notify({
      title: '🚨 NØDVARSEL: Taus alarm utløst!',
      message: `Sjåfør ${targetDriver?.name || 'Aron Sjåfør'} (${targetDriver?.vehiclePlate || targetVehicle?.licensePlate || 'Bil'}) har utløst alarm!`,
      type: 'emergency',
      targetRole: 'admin',
      actionUrl: '/admin',
      soundType: 'emergency',
      requireInteraction: true
    });

    try {
      await setDoc(doc(db, 'emergency_alerts', id), removeUndefinedFields(newAlert), { merge: true });
    } catch (err) {
      console.warn('Emergency alert firestore write note:', err);
    }

    return newAlert;
  };


  const resolveEmergencyAlert = async (alertId: string, resolvedBy: string = 'Sentral / Dispatch') => {
    const now = new Date().toISOString();
    const updated = emergencyAlerts.map(a => a.id === alertId ? { ...a, status: 'resolved' as const, resolvedAt: now, resolvedBy } : a);
    saveEmergencyAlerts(updated);

    try {
      await setDoc(doc(db, 'emergency_alerts', alertId), { status: 'resolved', resolvedAt: now, resolvedBy }, { merge: true });
    } catch (err) {
      console.warn('Resolve emergency alert error:', err);
    }
  };

  const selectDriverVehicle = async (driverId: string, vehicleId: string) => {
    const targetVehicle = vehicles.find(v => v.id === vehicleId);
    if (!targetVehicle) return;

    const updatedDrivers = drivers.map(d => {
      if (d.id === driverId) {
        return {
          ...d,
          vehicleId: targetVehicle.id,
          vehicleName: targetVehicle.model,
          vehiclePlate: targetVehicle.licensePlate,
          permitNumber: targetVehicle.permitNumber
        };
      }
      return d;
    });
    saveDrivers(updatedDrivers);

    const updatedVehicles = vehicles.map(v => {
      if (v.id === vehicleId) {
        const d = drivers.find(drv => drv.id === driverId);
        return {
          ...v,
          assignedDriverId: driverId,
          assignedDriverName: d?.name || 'Sjåfør'
        };
      }
      return v;
    });
    saveVehicles(updatedVehicles);

    try {
      const dObj = updatedDrivers.find(d => d.id === driverId);
      if (dObj) await setDoc(doc(db, 'drivers', driverId), removeUndefinedFields(dObj), { merge: true });
      const vObj = updatedVehicles.find(v => v.id === vehicleId);
      if (vObj) await setDoc(doc(db, 'vehicles', vehicleId), removeUndefinedFields(vObj), { merge: true });
    } catch (e) {}
  };

  const updateDriverLocation = (driverId: string, loc: { lat: number; lng: number; heading?: number; speed?: number }, activeTripId?: string) => {
    const updatedDrivers = drivers.map(d => {
      if (d.id === driverId) {
        return { ...d, currentLocation: loc };
      }
      return d;
    });
    saveDrivers(updatedDrivers);

    try {
      setDoc(doc(db, 'drivers', driverId), removeUndefinedFields({ currentLocation: loc }), { merge: true }).catch(() => {});
      if (activeTripId) {
        setDoc(doc(db, 'trips', activeTripId), removeUndefinedFields({ driverLocation: loc }), { merge: true }).catch(() => {});
      }
    } catch (e) {}
  };

  const updateTripStatus = (tripId: string, status: TripStatus, location?: { lat: number; lng: number }) => {
    const now = new Date().toISOString();
    const targetTrip = trips.find(t => t.id === tripId);

    const isComp = status === 'completed';
    const finalP = isComp ? (targetTrip?.estimatedPrice || 0) : targetTrip?.finalPrice;

    const updated = trips.map((t) => {
      if (t.id === tripId) {
        return {
          ...t,
          status,
          finalPrice: finalP || t.estimatedPrice,
          driverLocation: location || t.driverLocation,
          updatedAt: now,
          completedAt: isComp ? now : t.completedAt
        };
      }
      return t;
    });

    saveTrips(updated);

    // Real-time notifications for customer, driver, and admin across devices
    if (status === 'driver_arrived') {
      // Customer: friendly chime & double buzz
      notificationService.notify({
        title: '📍 Sjåføren er fremme!',
        message: `${targetTrip?.driverName || 'Sjåføren'} venter nå utenfor hentepunktet (${targetTrip?.pickup?.address || 'adressen'}).`,
        type: 'driver_arrived',
        targetRole: 'customer',
        targetUserId: targetTrip?.customerId,
        tripId: tripId,
        actionUrl: '/konto',
        soundType: 'arrived'
      });

      // Admin
      notificationService.notify({
        title: '📍 Sjåfør ankommet hentepunkt',
        message: `${targetTrip?.driverName || 'Sjåfør'} har ankommet for tur ${tripId} (${targetTrip?.customerName || 'Kunde'}).`,
        type: 'driver_arrived',
        targetRole: 'admin',
        tripId: tripId,
        actionUrl: '/admin',
        soundType: 'ping'
      });
    } else if (status === 'trip_started' || status === 'active') {
      // Customer: trip started acceleration tone
      notificationService.notify({
        title: '🛣️ Turen har startet',
        message: `God reise! Turen mot ${targetTrip?.destination?.address || 'destinasjonen'} er påbegynt.`,
        type: 'trip_started',
        targetRole: 'customer',
        targetUserId: targetTrip?.customerId,
        tripId: tripId,
        actionUrl: '/konto',
        soundType: 'started'
      });

      // Admin
      notificationService.notify({
        title: '⏱️ Tur påbegynt',
        message: `Tur ${tripId} med ${targetTrip?.driverName || 'Sjåfør'} er i gang mot ${targetTrip?.destination?.address || 'destinasjon'}.`,
        type: 'trip_started',
        targetRole: 'admin',
        tripId: tripId,
        actionUrl: '/admin',
        soundType: 'ping'
      });
    } else if (status === 'completed') {
      const price = targetTrip?.estimatedPrice || 0;
      const driverEarn = Math.round(price * 0.85);

      // Customer
      notificationService.notify({
        title: '🎉 Turen er fullført!',
        message: `Takk for at du reiste med Aron Taxi! Kvittering på ${price} kr er klar på profilen din.`,
        type: 'trip_completed',
        targetRole: 'customer',
        targetUserId: targetTrip?.customerId,
        tripId: tripId,
        actionUrl: '/konto',
        soundType: 'completed'
      });

      // Driver
      notificationService.notify({
        title: '💰 Tur fullført!',
        message: `Godt levert! Du tjente ${driverEarn} kr for dette oppdraget.`,
        type: 'trip_completed',
        targetRole: 'driver',
        targetUserId: targetTrip?.driverId,
        tripId: tripId,
        actionUrl: '/driver',
        soundType: 'completed'
      });

      // Admin
      notificationService.notify({
        title: '✅ Tur fullført',
        message: `Tur ${tripId} fullført av ${targetTrip?.driverName || 'Sjåfør'}. Beløp: ${price} kr.`,
        type: 'trip_completed',
        targetRole: 'admin',
        tripId: tripId,
        actionUrl: '/admin',
        soundType: 'completed'
      });
    } else if (status === 'cancelled') {
      // Customer
      notificationService.notify({
        title: '❌ Tur kansellert',
        message: `Turen ${tripId} ble kansellert.`,
        type: 'trip_cancelled',
        targetRole: 'customer',
        targetUserId: targetTrip?.customerId,
        tripId: tripId,
        soundType: 'cancel'
      });

      // Driver
      if (targetTrip?.driverId) {
        notificationService.notify({
          title: '❌ Tur kansellert av kunden',
          message: `Oppdraget ${tripId} ble avbrutt.`,
          type: 'trip_cancelled',
          targetRole: 'driver',
          targetUserId: targetTrip?.driverId,
          tripId: tripId,
          soundType: 'cancel'
        });
      }

      // Admin
      notificationService.notify({
        title: '⚠️ Tur kansellert',
        message: `Tur ${tripId} (${targetTrip?.customerName || 'Kunde'}) ble kansellert.`,
        type: 'trip_cancelled',
        targetRole: 'admin',
        tripId: tripId,
        actionUrl: '/admin',
        soundType: 'cancel'
      });
    }


    if (status === 'completed' && targetTrip?.driverId) {
      const price = targetTrip.estimatedPrice;
      const driverEarn = Math.round(price * 0.85);
      
      const updatedDriversList = drivers.map((d) => {
        if (d.id === targetTrip.driverId) {
          const updatedDriverObj = {
            ...d,
            todayEarnings: (d.todayEarnings || 0) + driverEarn,
            weekEarnings: (d.weekEarnings || 0) + driverEarn,
            monthEarnings: (d.monthEarnings || 0) + driverEarn,
            totalTrips: (d.totalTrips || 0) + 1
          };
          try {
            setDoc(doc(db, 'drivers', d.id), removeUndefinedFields(updatedDriverObj), { merge: true }).catch(() => {});
          } catch (e) {}
          return updatedDriverObj;
        }
        return d;
      });
      saveDrivers(updatedDriversList);
    }

    try {
      const updatedTrip = updated.find((t) => t.id === tripId);
      if (updatedTrip) {
        setDoc(doc(db, 'trips', tripId), removeUndefinedFields(updatedTrip), { merge: true }).catch(() => {});
      }
    } catch (e) {}
  };

  const toggleDriverOnline = (driverId: string, isOnline: boolean) => {
    const updated = drivers.map((d) => {
      if (d.id === driverId) {
        return { ...d, isOnline };
      }
      return d;
    });
    saveDrivers(updated);

    try {
      const updatedDriver = updated.find((d) => d.id === driverId);
      if (updatedDriver) {
        setDoc(doc(db, 'drivers', driverId), removeUndefinedFields(updatedDriver), { merge: true }).catch((err) => {
          console.log('Driver status cloud sync note:', err);
        });
      }
    } catch (e) {}
  };

  const updatePricingConfig = (newPricing: PricingConfig) => {
    setPricing(newPricing);
    localStorage.setItem('aron_pricing', JSON.stringify(newPricing));
    try {
      setDoc(doc(db, 'config', 'pricing'), newPricing, { merge: true }).catch(() => {});
    } catch (e) {}
  };

  const addExpense = (exp: Omit<DriverExpense, 'id'>) => {
    const newExp: DriverExpense = {
      ...exp,
      id: `exp_${Date.now()}`
    };
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    localStorage.setItem('aron_expenses', JSON.stringify(updated));
    try {
      setDoc(doc(db, 'expenses', newExp.id), newExp, { merge: true }).catch(() => {});
    } catch (e) {}
  };

  // DRIVER APPLICATION & APPROVAL WORKFLOW
  const submitDriverApplication = async (appData: Omit<DriverApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<DriverApplication> => {
    const id = `app_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

    const newApplication: DriverApplication = {
      ...appData,
      id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newApplication, ...driverApplications];
    saveDriverApplications(updated);

    // Notify Admin via Push / In-app notification
    notificationService.notify({
      title: '📄 Ny sjåførsøknad mottatt',
      message: `${newApplication.name} (${newApplication.phone}) har sendt inn søknad om å bli sjåfør i Oslo. Løyvenr: ${newApplication.permitNumber || 'Ikke oppgitt'}.`,
      type: 'trip_created',
      targetRole: 'admin',
      actionUrl: '/admin',
      soundType: 'request'
    });

    try {
      await setDoc(doc(db, 'driver_applications', id), removeUndefinedFields(newApplication), { merge: true });
      console.log('✅ Ny sjåførsøknad lagret i Firestore:', id);
    } catch (e: any) {
      console.error('❌ Feil ved lagring av sjåførsøknad i Firestore:', e?.message || e);
    }

    return newApplication;
  };

  const approveDriverApplication = async (applicationId: string, options?: { vehicleId?: string; permitNumber?: string; adminNotes?: string }) => {
    const targetApp = driverApplications.find(a => a.id === applicationId);
    if (!targetApp) return;

    const now = new Date().toISOString();
    const updatedApp: DriverApplication = {
      ...targetApp,
      status: 'approved',
      adminNotes: options?.adminNotes || targetApp.adminNotes,
      reviewedBy: 'Aron Taxi Admin',
      reviewedAt: now,
      updatedAt: now,
    };

    // Update applications state
    const updatedApps = driverApplications.map(a => a.id === applicationId ? updatedApp : a);
    saveDriverApplications(updatedApps);

    // Assign vehicle if selected
    const chosenVehicleId = options?.vehicleId || (targetApp.hasOwnVehicle ? undefined : 'v1');
    const assignedVehicle = vehicles.find(v => v.id === chosenVehicleId);

    // Create or activate Driver profile
    const driverId = `d_${Date.now().toString().slice(-4)}`;
    const driverName = targetApp.name;
    const driverPhone = targetApp.phone;
    const driverEmail = targetApp.email;
    const permitNumber = options?.permitNumber || targetApp.permitNumber || 'OS 10597';

    const newDriver: Driver = {
      id: driverId,
      name: driverName,
      email: driverEmail,
      phone: driverPhone,
      password: targetApp.password || 'aron1234',
      licenseNumber: targetApp.licenseNumber || 'NO-99999999',
      permitNumber: permitNumber,
      driverCardNumber: targetApp.driverCardNumber || undefined,
      vehicleId: chosenVehicleId || undefined,
      vehicleName: assignedVehicle?.model || targetApp.vehicleModel || (targetApp.hasOwnVehicle ? 'Egen Drosje' : 'Tesla Model Y Juniper'),
      vehiclePlate: assignedVehicle?.licensePlate || targetApp.vehiclePlate || (targetApp.hasOwnVehicle ? 'EL 99999' : 'EP 17891'),
      assignedVehicles: chosenVehicleId ? [chosenVehicleId] : ['v1', 'v2'],
      isOnline: false,
      todayEarnings: 0,
      weekEarnings: 0,
      monthEarnings: 0,
      totalTrips: 0,
      rating: 5.0,
      documentsVerified: true,
      status: 'active',
      applicationId: applicationId,
    };

    // Save driver to state and cloud
    const updatedDrivers = [...drivers.filter(d => d.email.toLowerCase() !== driverEmail.toLowerCase()), newDriver];
    saveDrivers(updatedDrivers);

    // Register UserProfile
    const userDoc: UserProfile = {
      uid: driverId,
      email: driverEmail,
      name: driverName,
      phone: driverPhone,
      role: 'driver',
      password: newDriver.password,
      createdAt: now,
    };

    // If vehicle chosen, update vehicle
    if (chosenVehicleId && assignedVehicle) {
      const updatedVehicles = vehicles.map(v => v.id === chosenVehicleId ? {
        ...v,
        assignedDriverId: driverId,
        assignedDriverName: driverName,
      } : v);
      saveVehicles(updatedVehicles);
      try {
        await setDoc(doc(db, 'vehicles', chosenVehicleId), removeUndefinedFields({ assignedDriverId: driverId, assignedDriverName: driverName }), { merge: true });
      } catch (e) {}
    }

    try {
      await setDoc(doc(db, 'driver_applications', applicationId), removeUndefinedFields(updatedApp), { merge: true });
      await setDoc(doc(db, 'drivers', driverId), removeUndefinedFields(newDriver), { merge: true });
      await setDoc(doc(db, 'users', driverId), removeUndefinedFields(userDoc), { merge: true });
      console.log('✅ Sjåfør godkjent og aktivert:', driverName, driverEmail);
    } catch (e: any) {
      console.error('Feil ved godkjenning av sjåfør:', e?.message || e);
    }
  };

  const rejectDriverApplication = async (applicationId: string, reason?: string) => {
    const targetApp = driverApplications.find(a => a.id === applicationId);
    if (!targetApp) return;

    const now = new Date().toISOString();
    const updatedApp: DriverApplication = {
      ...targetApp,
      status: 'rejected',
      adminNotes: reason || 'Søknaden oppfyller dessverre ikke våre nåværende krav.',
      reviewedBy: 'Aron Taxi Admin',
      reviewedAt: now,
      updatedAt: now,
    };

    const updatedApps = driverApplications.map(a => a.id === applicationId ? updatedApp : a);
    saveDriverApplications(updatedApps);

    try {
      await setDoc(doc(db, 'driver_applications', applicationId), removeUndefinedFields(updatedApp), { merge: true });
    } catch (e: any) {
      console.error('Feil ved avslag av sjåførsøknad:', e?.message || e);
    }
  };

  const deleteDriverApplication = async (applicationId: string) => {
    const updated = driverApplications.filter(a => a.id !== applicationId);
    saveDriverApplications(updated);

    try {
      await deleteDoc(doc(db, 'driver_applications', applicationId));
    } catch (e: any) {
      console.error('Feil ved sletting av sjåførsøknad:', e?.message || e);
    }
  };

  // DRIVER MANAGEMENT
  const addDriver = async (driverData: Omit<Driver, 'id' | 'todayEarnings' | 'weekEarnings' | 'monthEarnings' | 'totalTrips' | 'rating'> & { password?: string }): Promise<Driver> => {
    const id = `d_${Date.now().toString().slice(-4)}`;
    const newDriver: Driver = {
      ...driverData,
      id,
      password: driverData.password || 'aron1234',
      todayEarnings: 0,
      weekEarnings: 0,
      monthEarnings: 0,
      totalTrips: 0,
      rating: 5.0
    };
    const updated = [...drivers, newDriver];
    saveDrivers(updated);

    // Also register user profile in users collection so driver can log in
    const driverUserDoc: UserProfile = {
      uid: id,
      email: newDriver.email,
      name: newDriver.name,
      phone: newDriver.phone,
      role: 'driver',
      password: newDriver.password,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'drivers', id), removeUndefinedFields(newDriver), { merge: true });
      await setDoc(doc(db, 'users', id), removeUndefinedFields(driverUserDoc), { merge: true });
    } catch (e) {}

    return newDriver;
  };

  const updateDriver = async (driverId: string, updates: Partial<Driver>) => {
    const updated = drivers.map((d) => {
      if (d.id === driverId) {
        return { ...d, ...updates };
      }
      return d;
    });
    saveDrivers(updated);

    try {
      const target = updated.find((d) => d.id === driverId);
      if (target) {
        await setDoc(doc(db, 'drivers', driverId), removeUndefinedFields(target), { merge: true });
        
        // Also update corresponding user profile if email, password, name or phone changed
        const userUpdates: Partial<UserProfile> = {};
        if (updates.name) userUpdates.name = updates.name;
        if (updates.email) userUpdates.email = updates.email;
        if (updates.phone) userUpdates.phone = updates.phone;
        if (updates.password) userUpdates.password = updates.password;

        if (Object.keys(userUpdates).length > 0) {
          await setDoc(doc(db, 'users', driverId), removeUndefinedFields(userUpdates), { merge: true });
        }
      }
    } catch (e) {}
  };

  const deleteDriver = async (driverId: string) => {
    // 1. Remove from drivers
    const updatedDrivers = drivers.filter((d) => d.id !== driverId);
    saveDrivers(updatedDrivers);

    // 2. Unassign from any vehicles
    const updatedVehicles = vehicles.map((v) => {
      if (v.assignedDriverId === driverId) {
        return {
          ...v,
          assignedDriverId: undefined,
          assignedDriverName: undefined
        };
      }
      return v;
    });
    saveVehicles(updatedVehicles);

    try {
      await deleteDoc(doc(db, 'drivers', driverId));
      await deleteDoc(doc(db, 'users', driverId));
      for (const v of updatedVehicles) {
        if (!v.assignedDriverId) {
          await setDoc(doc(db, 'vehicles', v.id), removeUndefinedFields(v), { merge: true });
        }
      }
    } catch (e) {}
  };

  // VEHICLE FLEET MANAGEMENT
  const addVehicle = async (vehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const id = `v_${Date.now().toString().slice(-4)}`;
    const newVehicle: Vehicle = {
      ...vehicleData,
      id
    };
    const updated = [...vehicles, newVehicle];
    saveVehicles(updated);

    try {
      await setDoc(doc(db, 'vehicles', id), removeUndefinedFields(newVehicle), { merge: true });
    } catch (e) {}
    return newVehicle;
  };

  const updateVehicle = async (vehicleId: string, updates: Partial<Vehicle>) => {
    const updated = vehicles.map((v) => {
      if (v.id === vehicleId) {
        return { ...v, ...updates };
      }
      return v;
    });
    saveVehicles(updated);

    try {
      const target = updated.find((v) => v.id === vehicleId);
      if (target) {
        await setDoc(doc(db, 'vehicles', vehicleId), removeUndefinedFields(target), { merge: true });
      }
    } catch (e) {}
  };

  const deleteVehicle = async (vehicleId: string) => {
    // 1. Remove from vehicles
    const updatedVehicles = vehicles.filter((v) => v.id !== vehicleId);
    saveVehicles(updatedVehicles);

    // 2. Unassign from any drivers who drove this vehicle
    const updatedDrivers = drivers.map((d) => {
      if (d.vehicleId === vehicleId) {
        return {
          ...d,
          vehicleId: undefined,
          vehicleName: undefined,
          vehiclePlate: undefined
        };
      }
      return d;
    });
    saveDrivers(updatedDrivers);

    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId));
      for (const d of updatedDrivers) {
        if (!d.vehicleId) {
          await setDoc(doc(db, 'drivers', d.id), removeUndefinedFields(d), { merge: true });
        }
      }
    } catch (e) {}
  };

  const unassignDriverVehicle = async (driverId: string) => {
    // 1. Clear vehicle details on driver
    const updatedDrivers = drivers.map((d) => {
      if (d.id === driverId) {
        return {
          ...d,
          vehicleId: undefined,
          vehicleName: undefined,
          vehiclePlate: undefined
        };
      }
      return d;
    });
    saveDrivers(updatedDrivers);

    // 2. Clear assigned driver on any vehicle that was assigned to this driver
    const updatedVehicles = vehicles.map((v) => {
      if (v.assignedDriverId === driverId) {
        return {
          ...v,
          assignedDriverId: undefined,
          assignedDriverName: undefined
        };
      }
      return v;
    });
    saveVehicles(updatedVehicles);

    try {
      const targetDriver = updatedDrivers.find((d) => d.id === driverId);
      if (targetDriver) {
        await setDoc(doc(db, 'drivers', driverId), removeUndefinedFields(targetDriver), { merge: true });
      }
      for (const v of updatedVehicles) {
        await setDoc(doc(db, 'vehicles', v.id), removeUndefinedFields(v), { merge: true });
      }
    } catch (e) {}
  };

  const resetFleetToOfficial = async () => {
    // Reset vehicles to the 2 official cars (Tesla & Mercedes) without assigned drivers
    const freshVehicles = INITIAL_VEHICLES.map((v) => ({
      ...v,
      assignedDriverId: undefined,
      assignedDriverName: undefined
    }));
    saveVehicles(freshVehicles);

    // Reset drivers so neither driver 1 nor driver 2 has a car assigned
    const freshDrivers = drivers.map((d) => ({
      ...d,
      vehicleId: undefined,
      vehicleName: undefined,
      vehiclePlate: undefined
    }));
    saveDrivers(freshDrivers);

    try {
      // Clean and overwrite vehicles in Firestore
      for (const v of freshVehicles) {
        await setDoc(doc(db, 'vehicles', v.id), removeUndefinedFields(v));
      }
      for (const d of freshDrivers) {
        await setDoc(doc(db, 'drivers', d.id), removeUndefinedFields(d), { merge: true });
      }
    } catch (e) {}
  };

  // CUSTOMER MANAGEMENT
  const addCustomer = async (customerData: Omit<UserProfile, 'uid' | 'createdAt'> & { password?: string }): Promise<UserProfile> => {
    const uid = `cust_${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const newCustomer: UserProfile = {
      ...customerData,
      uid,
      role: customerData.role || 'customer',
      password: customerData.password || 'kunde1234',
      createdAt: now,
      updatedAt: now
    };

    const updated = [newCustomer, ...customers];
    saveCustomers(updated);

    try {
      await setDoc(doc(db, 'users', uid), removeUndefinedFields(newCustomer), { merge: true });
    } catch (e) {}

    return newCustomer;
  };

  const updateCustomer = async (uid: string, updates: Partial<UserProfile>) => {
    const now = new Date().toISOString();
    const updated = customers.map((c) => {
      if (c.uid === uid) {
        return { ...c, ...updates, updatedAt: now };
      }
      return c;
    });
    saveCustomers(updated);

    try {
      const target = updated.find((c) => c.uid === uid);
      if (target) {
        await setDoc(doc(db, 'users', uid), removeUndefinedFields(target), { merge: true });
      }
    } catch (e) {}
  };

  const deleteCustomer = async (uid: string) => {
    const updated = customers.filter((c) => c.uid !== uid);
    saveCustomers(updated);
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {}
  };

  const addTipToTrip = (tripId: string, tipAmount: number) => {
    const now = new Date().toISOString();
    const updated = trips.map((t) => {
      if (t.id === tripId) {
        const newTip = (t.tip || 0) + tipAmount;
        return {
          ...t,
          tip: newTip,
          updatedAt: now
        };
      }
      return t;
    });
    saveTrips(updated);
    try {
      const updatedTrip = updated.find((t) => t.id === tripId);
      if (updatedTrip) {
        setDoc(doc(db, 'trips', tripId), removeUndefinedFields(updatedTrip), { merge: true }).catch(() => {});
      }
    } catch (e) {}
  };

  const addTipAndRatingToTrip = async (tripId: string, rating: number, tipAmount: number, comment?: string) => {
    const now = new Date().toISOString();
    const targetTrip = trips.find(t => t.id === tripId);
    if (!targetTrip) return;

    const newTip = (targetTrip.tip || 0) + tipAmount;

    const updated = trips.map((t) => {
      if (t.id === tripId) {
        return {
          ...t,
          rating,
          tip: newTip,
          customerNotes: comment || t.customerNotes,
          updatedAt: now
        };
      }
      return t;
    });
    saveTrips(updated);

    // Recalculate driver stats
    if (targetTrip.driverId) {
      const updatedDriversList = drivers.map((d) => {
        if (d.id === targetTrip.driverId) {
          const prevCount = d.ratingCount || 0;
          const prevRating = d.rating || 0;
          const newCount = prevCount + 1;
          const calculatedAvg = prevCount === 0 ? rating : Number((((prevRating * prevCount) + rating) / newCount).toFixed(1));
          
          const updatedDriverObj: Driver = {
            ...d,
            rating: calculatedAvg,
            ratingCount: newCount,
            tips: (d.tips || 0) + tipAmount
          };

          try {
            setDoc(doc(db, 'drivers', d.id), removeUndefinedFields(updatedDriverObj), { merge: true }).catch(() => {});
          } catch (e) {}

          return updatedDriverObj;
        }
        return d;
      });
      saveDrivers(updatedDriversList);
    }

    try {
      const updatedTrip = updated.find((t) => t.id === tripId);
      if (updatedTrip) {
        await setDoc(doc(db, 'trips', tripId), removeUndefinedFields(updatedTrip), { merge: true });
      }
    } catch (e) {}
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        drivers,
        driverApplications,
        vehicles,
        customers,
        pricing,
        expenses,
        emergencyAlerts,
        createTrip,
        getTripById,
        assignDriverToTrip,
        acceptTripAtomic,
        rejectTrip,
        updateTripStatus,
        toggleDriverOnline,
        updateDriverLocation,
        selectDriverVehicle,
        updatePricingConfig,
        updatePricing: updatePricingConfig,
        addExpense,
        triggerEmergencyAlert,
        resolveEmergencyAlert,
        submitDriverApplication,
        approveDriverApplication,
        rejectDriverApplication,
        deleteDriverApplication,
        addDriver,
        updateDriver,
        deleteDriver,
        unassignDriverVehicle,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        resetFleetToOfficial,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addTipToTrip,
        addTipAndRatingToTrip,
        queryFirestoreTrips: queryTripsFromFirestore
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrips must be used within TripProvider');
  return context;
};
