import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trip, TripStatus, Driver, Vehicle, PricingConfig, DriverExpense, UserProfile } from '../types';
import { INITIAL_DRIVERS, INITIAL_VEHICLES, INITIAL_PRICING } from '../constants/assets';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, runTransaction, getDoc } from 'firebase/firestore';
import { queryTripsFromFirestore, TripQueryFilter, TripQueryResult } from '../services/tripQueryService';

const INITIAL_CUSTOMERS: UserProfile[] = [
  {
    uid: 'cust_sample_1',
    name: 'Henrik Solberg',
    email: 'henrik.solberg@gmail.com',
    phone: '+47 912 34 567',
    role: 'customer',
    address: 'Frognerveien 12, 0263 Oslo',
    postalCode: '0263',
    password: 'password123',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    uid: 'cust_sample_2',
    name: 'Astrid Lind',
    email: 'astrid.lind@bedrift.no',
    phone: '+47 480 99 112',
    role: 'customer',
    address: 'Storgata 33, 0184 Oslo',
    postalCode: '0184',
    password: 'password123',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

interface TripContextType {
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: UserProfile[];
  pricing: PricingConfig;
  expenses: DriverExpense[];
  
  createTrip: (tripData: Omit<Trip, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Trip>;
  getTripById: (id: string) => Trip | undefined;
  assignDriverToTrip: (tripId: string, driverId: string) => void;
  acceptTripAtomic: (tripId: string, driverId: string) => Promise<{ success: boolean; error?: string }>;
  updateTripStatus: (tripId: string, status: TripStatus, location?: { lat: number; lng: number }) => void;
  toggleDriverOnline: (driverId: string, isOnline: boolean) => void;
  updateDriverLocation: (driverId: string, loc: { lat: number; lng: number; heading?: number; speed?: number }, activeTripId?: string) => void;
  selectDriverVehicle: (driverId: string, vehicleId: string) => Promise<void>;
  updatePricingConfig: (newPricing: PricingConfig) => void;
  updatePricing: (newPricing: PricingConfig) => void;
  addExpense: (expense: Omit<DriverExpense, 'id'>) => void;
  
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
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [customers, setCustomers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('aron_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [pricing, setPricing] = useState<PricingConfig>(() => {
    const saved = localStorage.getItem('aron_pricing');
    return saved ? JSON.parse(saved) : INITIAL_PRICING;
  });

  const [expenses, setExpenses] = useState<DriverExpense[]>(() => {
    const saved = localStorage.getItem('aron_expenses');
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

  useEffect(() => {
    // Listen to window storage events across tabs
    const handleSync = () => {
      const savedTrips = localStorage.getItem('aron_trips');
      if (savedTrips) setTrips(JSON.parse(savedTrips));

      const savedDrivers = localStorage.getItem('aron_drivers');
      if (savedDrivers) setDrivers(JSON.parse(savedDrivers));

      const savedVehicles = localStorage.getItem('aron_vehicles');
      if (savedVehicles) setVehicles(JSON.parse(savedVehicles));

      const savedCustomers = localStorage.getItem('aron_customers');
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    };

    window.addEventListener('aron_trips_updated', handleSync);
    window.addEventListener('aron_drivers_updated', handleSync);
    window.addEventListener('aron_vehicles_updated', handleSync);
    window.addEventListener('aron_customers_updated', handleSync);
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

        INITIAL_CUSTOMERS.forEach((customer) => {
          setDoc(doc(db, 'users', customer.uid), customer, { merge: true }).catch(() => {});
        });
      } catch (e) {}
    }

    try {
      // Firestore live snapshot listeners that accurately reflect additions AND deletions
      const tripsUnsub = onSnapshot(collection(db, 'trips'), (snapshot) => {
        const fsTrips: Trip[] = [];
        snapshot.forEach((d) => fsTrips.push(d.data() as Trip));
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
        snapshot.forEach((d) => fsVehicles.push(d.data() as Vehicle));
        setVehicles(fsVehicles);
        localStorage.setItem('aron_vehicles', JSON.stringify(fsVehicles));
      }, (err) => console.log('Firestore vehicle listener note:', err.message));

      const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        const fsUsers: UserProfile[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as UserProfile;
          fsUsers.push(data);
        });
        setCustomers(fsUsers);
        localStorage.setItem('aron_customers', JSON.stringify(fsUsers));
      }, (err) => console.log('Firestore users listener note:', err.message));

      return () => {
        tripsUnsub();
        driversUnsub();
        vehiclesUnsub();
        usersUnsub();
        window.removeEventListener('aron_trips_updated', handleSync);
        window.removeEventListener('aron_drivers_updated', handleSync);
        window.removeEventListener('aron_vehicles_updated', handleSync);
        window.removeEventListener('aron_customers_updated', handleSync);
        window.removeEventListener('storage', handleSync);
      };
    } catch (e) {
      // Fallback to local storage bus
    }
  }, []);

  const createTrip = async (tripData: Omit<Trip, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Trip> => {
    const id = `TRIP-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newTrip: Trip = {
      ...tripData,
      id,
      status: 'searching_driver',
      createdAt: now,
      updatedAt: now
    };

    const updatedTrips = [newTrip, ...trips];
    saveTrips(updatedTrips);

    try {
      await setDoc(doc(db, 'trips', id), newTrip, { merge: true });
    } catch (err) {
      console.log('Saved locally to Firestore cache:', err);
    }

    return newTrip;
  };

  const getTripById = (id: string) => {
    return trips.find((t) => t.id === id);
  };

  const assignDriverToTrip = (tripId: string, driverId: string) => {
    const targetDriver = drivers.find((d) => d.id === driverId);
    const targetVehicle = vehicles.find((v) => v.id === targetDriver?.vehicleId) || vehicles[0];

    const now = new Date().toISOString();
    const updated = trips.map((t) => {
      if (t.id === tripId) {
        return {
          ...t,
          driverId,
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

    try {
      const updatedTrip = updated.find((t) => t.id === tripId);
      if (updatedTrip) {
        setDoc(doc(db, 'trips', tripId), updatedTrip, { merge: true }).catch(() => {});
      }
    } catch (e) {}
  };

  // Atomic Firestore Concurrency for accepting a trip (ensures only 1 driver gets the ride)
  const acceptTripAtomic = async (tripId: string, driverId: string): Promise<{ success: boolean; error?: string }> => {
    const targetDriver = drivers.find((d) => d.id === driverId);
    if (!targetDriver) return { success: false, error: 'Fant ikke sjåførprofil.' };

    const targetVehicle = vehicles.find((v) => v.id === targetDriver.vehicleId) || vehicles[0];
    const now = new Date().toISOString();

    try {
      const tripRef = doc(db, 'trips', tripId);
      const result = await runTransaction(db, async (transaction) => {
        const tripDoc = await transaction.get(tripRef);
        if (!tripDoc.exists()) {
          throw new Error('Turen eksisterer ikke lenger.');
        }

        const data = tripDoc.data() as Trip;
        // Verify trip is still unassigned / waiting for driver
        if (data.driverId && data.driverId !== driverId) {
          throw new Error('Turen ble nettopp tatt av en annen sjåfør.');
        }
        if (data.status !== 'requested' && data.status !== 'searching_driver' && data.status !== 'driver_assigned') {
          throw new Error('Denne turen er ikke lenger tilgjengelig.');
        }

        const updates: Partial<Trip> = {
          driverId,
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

        transaction.update(tripRef, updates);
        return true;
      });

      // Update local state
      assignDriverToTrip(tripId, driverId);
      return { success: true };
    } catch (err: any) {
      console.warn('Accept trip transaction failed:', err.message);
      return { success: false, error: err.message || 'Kunne ikke godta turen.' };
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
      if (dObj) await setDoc(doc(db, 'drivers', driverId), dObj, { merge: true });
      const vObj = updatedVehicles.find(v => v.id === vehicleId);
      if (vObj) await setDoc(doc(db, 'vehicles', vehicleId), vObj, { merge: true });
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
      setDoc(doc(db, 'drivers', driverId), { currentLocation: loc }, { merge: true }).catch(() => {});
      if (activeTripId) {
        setDoc(doc(db, 'trips', activeTripId), { driverLocation: loc }, { merge: true }).catch(() => {});
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
            setDoc(doc(db, 'drivers', d.id), updatedDriverObj, { merge: true }).catch(() => {});
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
        setDoc(doc(db, 'trips', tripId), updatedTrip, { merge: true }).catch(() => {});
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
        setDoc(doc(db, 'drivers', driverId), updatedDriver, { merge: true }).catch((err) => {
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
      await setDoc(doc(db, 'drivers', id), newDriver, { merge: true });
      await setDoc(doc(db, 'users', id), driverUserDoc, { merge: true });
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
        await setDoc(doc(db, 'drivers', driverId), target, { merge: true });
        
        // Also update corresponding user profile if email, password, name or phone changed
        const userUpdates: Partial<UserProfile> = {};
        if (updates.name) userUpdates.name = updates.name;
        if (updates.email) userUpdates.email = updates.email;
        if (updates.phone) userUpdates.phone = updates.phone;
        if (updates.password) userUpdates.password = updates.password;

        if (Object.keys(userUpdates).length > 0) {
          await setDoc(doc(db, 'users', driverId), userUpdates, { merge: true });
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
          await setDoc(doc(db, 'vehicles', v.id), v, { merge: true });
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
      await setDoc(doc(db, 'vehicles', id), newVehicle, { merge: true });
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
        await setDoc(doc(db, 'vehicles', vehicleId), target, { merge: true });
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
          await setDoc(doc(db, 'drivers', d.id), d, { merge: true });
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
        await setDoc(doc(db, 'drivers', driverId), targetDriver, { merge: true });
      }
      for (const v of updatedVehicles) {
        await setDoc(doc(db, 'vehicles', v.id), v, { merge: true });
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
        await setDoc(doc(db, 'vehicles', v.id), v);
      }
      for (const d of freshDrivers) {
        await setDoc(doc(db, 'drivers', d.id), d, { merge: true });
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
      await setDoc(doc(db, 'users', uid), newCustomer, { merge: true });
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
        await setDoc(doc(db, 'users', uid), target, { merge: true });
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
        setDoc(doc(db, 'trips', tripId), updatedTrip, { merge: true }).catch(() => {});
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
            setDoc(doc(db, 'drivers', d.id), updatedDriverObj, { merge: true }).catch(() => {});
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
        await setDoc(doc(db, 'trips', tripId), updatedTrip, { merge: true });
      }
    } catch (e) {}
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        drivers,
        vehicles,
        customers,
        pricing,
        expenses,
        createTrip,
        getTripById,
        assignDriverToTrip,
        acceptTripAtomic,
        updateTripStatus,
        toggleDriverOnline,
        updateDriverLocation,
        selectDriverVehicle,
        updatePricingConfig,
        updatePricing: updatePricingConfig,
        addExpense,
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
