import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LeafletMap } from '../components/LeafletMap';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import { Trip, TripStatus, Driver, Vehicle } from '../types';
import { soundService } from '../services/sound';

// Driver Components
import { DriverBottomNav, DriverNavTab } from '../components/driver/DriverBottomNav';
import { DriverVehiclesView } from '../components/driver/DriverVehiclesView';
import { DriverBookingsView } from '../components/driver/DriverBookingsView';
import { DriverAccountView } from '../components/driver/DriverAccountView';
import { CompactDriverStatusBar } from '../components/driver/CompactDriverStatusBar';
import { NewTripRequestCard } from '../components/driver/NewTripRequestCard';
import { TripStatusOverlay } from '../components/driver/TripStatusOverlay';

// Modals
import { BoltDriverDrawer } from '../components/driver/BoltDriverDrawer';
import { BoltSafetyModal } from '../components/driver/BoltSafetyModal';
import { BoltPreferencesModal } from '../components/driver/BoltPreferencesModal';
import { BoltDestinationModal } from '../components/driver/BoltDestinationModal';
import { BoltSurgeModal } from '../components/driver/BoltSurgeModal';
import { BoltEarningsView } from '../components/driver/BoltEarningsView';
import { BoltScheduledRidesModal } from '../components/driver/BoltScheduledRidesModal';
import { BoltCampaignsModal } from '../components/driver/BoltCampaignsModal';

import {
  Menu,
  Shield,
  Zap,
  Flame,
  Navigation,
  Crosshair,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';

const OSLO_HOTSPOTS = [
  { id: '1', name: 'Oslo Sentrum / Jernbanetorget', lat: 59.91149, lng: 10.7505, surge: '1.6x', category: 'high' },
  { id: '2', name: 'Oslo Lufthavn Gardermoen', lat: 60.1975, lng: 11.1004, surge: '1.8x', category: 'airport' },
  { id: '3', name: 'Grünerløkka & Vulkan', lat: 59.9234, lng: 10.7579, surge: '1.4x', category: 'nightlife' },
  { id: '4', name: 'Majorstuen & Bogstadveien', lat: 59.9298, lng: 10.7144, surge: '1.3x', category: 'shopping' },
  { id: '5', name: 'Aker Brygge & Tjuvholmen', lat: 59.9102, lng: 10.7250, surge: '1.5x', category: 'business' },
  { id: '6', name: 'Barcode & Bjørvika', lat: 59.9077, lng: 10.7583, surge: '1.4x', category: 'corporate' },
];

export const DriverDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    trips,
    drivers,
    vehicles,
    toggleDriverOnline,
    updateDriverLocation,
    selectDriverVehicle,
    acceptTripAtomic,
    rejectTrip,
    updateTripStatus,
    deleteTrip,
    cancelTrip,
    triggerEmergencyAlert,
    createTrip
  } = useTrips();

  // Find driver object (Aron / logged in driver)
  const currentDriver: Driver | undefined =
    drivers.find(
      (d) => d.id === user?.uid || d.email?.toLowerCase() === user?.email?.toLowerCase()
    ) || drivers[0];

  // Active Bottom Tab: 'vehicles' | 'bookings' | 'driver' | 'account'
  const [navTab, setNavTab] = useState<DriverNavTab>('driver');

  // Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showSurgeModal, setShowSurgeModal] = useState(false);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);
  const [showEarningsView, setShowEarningsView] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  // States
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeDestination, setActiveDestination] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [incomingCountdown, setIncomingCountdown] = useState(18);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [onlineSeconds, setOnlineSeconds] = useState(0);

  const prevPendingCount = useRef<number>(0);

  // Active Vehicle
  const currentVehicle: Vehicle =
    vehicles.find((v) => v.id === currentDriver?.vehicleId) || vehicles[0];

  // Live online timer counter
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (currentDriver?.isOnline) {
      timer = setInterval(() => {
        setOnlineSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setOnlineSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentDriver?.isOnline]);

  // Format online time into mm:ss or hh:mm:ss
  const formatOnlineDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}t ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  // Active trip validation helper
  // Time tick to auto-promote pre-orders when their scheduled time approaches
  const [timeTick, setTimeTick] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const getScheduledTimeDiffMs = (t: Trip): number | null => {
    const timeStr = t.scheduledPickupTime || t.scheduledTime;
    if (!timeStr) return null;
    const parsed = new Date(timeStr).getTime();
    return isNaN(parsed) ? null : parsed - Date.now();
  };

  const isTripActiveForDriver = (t: Trip, driverId?: string): boolean => {
    if (!driverId) return false;
    const isThisDriver = t.driverId === driverId || t.acceptedBy === driverId;
    if (!isThisDriver) return false;

    // Terminal statuses can NEVER be active
    const terminalStatuses: TripStatus[] = [
      'completed',
      'COMPLETED',
      'cancelled',
      'CANCELLED',
      'rejected',
      'DRIVER_DECLINED'
    ];
    if (terminalStatuses.includes(t.status)) return false;

    // Active in-ride statuses are always immediately active
    const inProgressStatuses: TripStatus[] = [
      'DRIVER_ARRIVING',
      'driver_arriving',
      'DRIVER_ARRIVED',
      'driver_arrived',
      'IN_PROGRESS',
      'trip_started',
      'active'
    ];
    if (inProgressStatuses.includes(t.status)) return true;

    // For accepted/assigned status:
    if (
      t.status === 'DRIVER_ACCEPTED' ||
      t.status === 'accepted' ||
      t.status === 'driver_assigned'
    ) {
      // If it's a pre-order scheduled far in future (> 30 min), keep in scheduled tab until time comes
      if (t.isPreorder) {
        const diffMs = getScheduledTimeDiffMs(t);
        if (diffMs !== null && diffMs > 30 * 60 * 1000) {
          return false;
        }
      }
      return true;
    }

    return false;
  };

  // Active trip assigned to this driver
  const activeTrip = trips.find((t) => isTripActiveForDriver(t, currentDriver?.id));

  // Helper to verify if an order is a NEW incoming request for this driver
  const isTripPendingForDriver = (t: Trip, driverId?: string): boolean => {
    if (!driverId) return false;

    // Terminal or declined statuses must NEVER be shown as incoming request
    const terminalStatuses: TripStatus[] = [
      'completed',
      'COMPLETED',
      'cancelled',
      'CANCELLED',
      'rejected',
      'DRIVER_DECLINED',
      'pending_payment'
    ];
    if (terminalStatuses.includes(t.status)) return false;
    if (t.paymentStatus === 'payment_failed' || t.paymentStatus === 'cancelled') return false;

    // If driver already declined or rejected this order, never show again
    if (t.declinedBy === driverId) return false;
    if (t.rejectedDriverIds && t.rejectedDriverIds.includes(driverId)) return false;

    // If already active or taken by another driver, never show
    if (t.driverId && t.driverId !== driverId) return false;
    if (t.acceptedBy && t.acceptedBy !== driverId) return false;

    // If already active for this driver, it belongs in activeTrip view
    if (isTripActiveForDriver(t, driverId)) return false;

    // If explicitly assigned to another driver, do not show
    if (t.assignedDriverId && t.assignedDriverId !== driverId) return false;

    // For unaccepted pre-orders scheduled in the future:
    // If > 20 min in future, leave in Forhåndsbestillinger list
    // When <= 20 min or time arrived, it automatically pops up as a normal live request!
    if (t.isPreorder && !t.driverId && !t.acceptedBy) {
      const diffMs = getScheduledTimeDiffMs(t);
      if (diffMs !== null && diffMs > 20 * 60 * 1000) {
        return false;
      }
    }

    // Allowed pending statuses
    const pendingStatuses: TripStatus[] = [
      'NEW',
      'pending',
      'requested',
      'searching_driver',
      'confirmed',
      'ASSIGNED'
    ];
    return pendingStatuses.includes(t.status);
  };

  // Incoming pending trips in Oslo (Real database orders only)
  const pendingTrips = trips.filter((t) => isTripPendingForDriver(t, currentDriver?.id));

  const incomingRequest = pendingTrips.length > 0 ? pendingTrips[0] : null;

  // Completed trips by this driver (Strictly real from database)
  const myCompletedTrips = trips.filter(
    (t) =>
      t.driverId === currentDriver?.id &&
      (t.status === 'completed' || t.status === 'COMPLETED')
  );

  // Today's completed trips
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCompletedTrips = myCompletedTrips.filter((t) =>
    (t.completedAt || t.createdAt || '').startsWith(todayStr)
  );

  const todayGross = todayCompletedTrips.reduce(
    (acc, t) => acc + (t.finalPrice || t.estimatedPrice || 0),
    0
  );
  const todayNet = Math.round(todayGross * 0.85);

  // Real acceptance rate and points calculation strictly based on database orders
  const myAcceptedTrips = trips.filter(
    (t) =>
      t.acceptedBy === currentDriver?.id ||
      (t.driverId === currentDriver?.id &&
        ['DRIVER_ACCEPTED', 'accepted', 'driver_assigned', 'driver_arrived', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'trip_started', 'COMPLETED', 'completed'].includes(t.status))
  );
  const myDeclinedTrips = trips.filter(
    (t) =>
      t.declinedBy === currentDriver?.id ||
      (t.rejectedDriverIds && t.rejectedDriverIds.includes(currentDriver?.id || ''))
  );
  const totalDecisions = myAcceptedTrips.length + myDeclinedTrips.length;
  const realAcceptanceRateNumber = totalDecisions > 0 ? Math.round((myAcceptedTrips.length / totalDecisions) * 100) : 0;
  const acceptanceRateText = `${realAcceptanceRateNumber}%`;
  const driverPoints = (myCompletedTrips.length * 50) + (myAcceptedTrips.length * 10);
  const driverTier = 'Sølv';

  // Sound chime when new trip arrives and driver is ONLINE
  useEffect(() => {
    if (currentDriver?.isOnline && pendingTrips.length > prevPendingCount.current) {
      if (soundEnabled) {
        soundService.playTripRequestChime(0.9);
      }
      setIncomingCountdown(18);
      toast.info('🚕 Ny turforespørsel i Oslo!', {
        description: `${pendingTrips[0]?.pickup?.address} → ${pendingTrips[0]?.destination?.address} (${pendingTrips[0]?.estimatedPrice} kr)`,
      });
    }
    prevPendingCount.current = pendingTrips.length;
  }, [pendingTrips.length, currentDriver?.isOnline, soundEnabled]);

  // Countdown timer for incoming request
  useEffect(() => {
    if (!currentDriver?.isOnline || !incomingRequest || activeTrip) return;

    const timer = setInterval(() => {
      setIncomingCountdown((prev) => {
        if (prev <= 1) return 18;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentDriver?.isOnline, incomingRequest?.id, activeTrip]);

  // GPS tracking while online
  useEffect(() => {
    if (!currentDriver?.id || !currentDriver.isOnline) return;

    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          updateDriverLocation(
            currentDriver.id,
            {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              heading: pos.coords.heading || 0,
              speed: pos.coords.speed || 0,
            },
            activeTrip?.id
          );
        },
        (err) => console.warn('Driver GPS watch note:', err.message),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentDriver?.id, currentDriver?.isOnline, activeTrip?.id]);

  // Waiting timer for passenger
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTrip?.status === 'driver_arrived') {
      interval = setInterval(() => {
        setWaitingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setWaitingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTrip?.status]);

  const handleToggleOnline = async () => {
    if (!currentDriver) return;
    const nextState = !currentDriver.isOnline;
    await toggleDriverOnline(currentDriver.id, nextState);
    if (nextState) {
      toast.success('🟢 Du er nå ONLINE. Kartet er aktivt!');
      if (soundEnabled) soundService.playTripAcceptedSound(0.5);
    } else {
      toast.info('🔴 Du er nå OFFLINE.');
    }
  };

  const handleAcceptTrip = async (tripId: string) => {
    if (!currentDriver) return;
    const res = await acceptTripAtomic(tripId, currentDriver.id);
    if (res.success) {
      toast.success('Tur godtatt! Naviger til henteadresse.');
      setNavTab('driver');
      if (soundEnabled) soundService.playTripAcceptedSound(0.8);
    } else {
      toast.error(res.error || 'Kunne ikke godta turen.');
    }
  };

  const handleRejectTrip = async (tripId: string) => {
    if (!currentDriver) return;
    await rejectTrip(tripId, currentDriver.id);
    toast.info('Tur avvist.');
  };

  const handleDeleteTripDirect = async (tripId: string) => {
    if (!window.confirm('Er du sikker på at du vil slette denne bestillingen?')) return;
    await deleteTrip(tripId);
    toast.success('Bestilling slettet!');
  };

  const handleCancelTripDirect = async (tripId: string, reason?: string) => {
    if (!window.confirm('Vil du kansellere turen?')) return;
    await cancelTrip(tripId, reason || 'Kansellert av sjåfør');
    toast.info('Turen ble kansellert.');
  };

  const handleAdvanceTripStatus = async () => {
    if (!activeTrip) return;

    if (
      activeTrip.status === 'DRIVER_ACCEPTED' ||
      activeTrip.status === 'driver_assigned' ||
      activeTrip.status === 'accepted' ||
      activeTrip.status === 'confirmed' ||
      activeTrip.status === 'driver_arriving' ||
      activeTrip.status === 'DRIVER_ARRIVING'
    ) {
      await updateTripStatus(activeTrip.id, 'driver_arrived');
      toast.success('Markert som ankommet! Venter på passasjer.');
      if (soundEnabled) soundService.playDriverArrivedSound(0.7);
    } else if (
      activeTrip.status === 'driver_arrived' ||
      activeTrip.status === 'DRIVER_ARRIVED'
    ) {
      await updateTripStatus(activeTrip.id, 'trip_started');
      toast.success('Turen er startet! God kjøretur.');
      if (soundEnabled) soundService.playTripStartedSound(0.7);
    } else if (
      activeTrip.status === 'trip_started' ||
      activeTrip.status === 'IN_PROGRESS' ||
      activeTrip.status === 'active'
    ) {
      await updateTripStatus(activeTrip.id, 'completed');
      const earned = Math.round((activeTrip.finalPrice || activeTrip.estimatedPrice || 0) * 0.85);
      toast.success(`Turen er fullført! ${earned} kr registrert på din sjåførkonto.`);
      if (soundEnabled) soundService.playTripCompletedSound(0.9);
    }
  };

  const handleOpenNavigation = (destinationAddress: string) => {
    const encoded = encodeURIComponent(destinationAddress);
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    window.open(googleUrl, '_blank');
  };

  const handleSendQuickSms = (text: string) => {
    if (!activeTrip?.customerPhone) return;
    const cleanPhone = activeTrip.customerPhone.replace(/\s+/g, '');
    window.open(`sms:${cleanPhone}?body=${encodeURIComponent(text)}`, '_blank');
    setShowSmsModal(false);
    toast.success('SMS-klient åpnet!');
  };

  const handleTriggerEmergency = async () => {
    if (!currentDriver) return;
    await triggerEmergencyAlert(currentDriver.id, 'Nødalarm utløst av sjåfør fra Cockpit');
    toast.error('🚨 NØDVARSEL SENDT TIL SENTRALEN MED DIN LIVE GPS-POSISJON!');
  };

  const handleRecenterGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (currentDriver) {
            updateDriverLocation(
              currentDriver.id,
              {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                heading: pos.coords.heading || 0,
                speed: pos.coords.speed || 0,
              },
              activeTrip?.id
            );
          }
          toast.success('📍 Kartet er sentrert på din GPS-posisjon!');
        },
        () => {
          if (currentDriver) {
            updateDriverLocation(
              currentDriver.id,
              { lat: 59.9139, lng: 10.7522, heading: 0 },
              activeTrip?.id
            );
          }
          toast.info('📍 Kartet er sentrert på Oslo.');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      toast.info('📍 Kartet er sentrert på Oslo.');
    }
  };

  // Map target coordinates based on active trip or incoming request
  const mapCenterLat = activeTrip
    ? activeTrip.driverLocation?.lat || activeTrip.pickup?.lat || 59.9139
    : incomingRequest
    ? (incomingRequest.pickup?.lat + (currentDriver?.currentLocation?.lat || 59.9139)) / 2
    : currentDriver?.currentLocation?.lat || 59.9139;

  const mapCenterLng = activeTrip
    ? activeTrip.driverLocation?.lng || activeTrip.pickup?.lng || 10.7522
    : incomingRequest
    ? (incomingRequest.pickup?.lng + (currentDriver?.currentLocation?.lng || 10.7522)) / 2
    : currentDriver?.currentLocation?.lng || 10.7522;

  const mapPickup = activeTrip
    ? { address: activeTrip.pickup.address, lat: activeTrip.pickup.lat, lng: activeTrip.pickup.lng }
    : incomingRequest
    ? { address: incomingRequest.pickup.address, lat: incomingRequest.pickup.lat, lng: incomingRequest.pickup.lng }
    : undefined;

  const mapDestination = activeTrip
    ? { address: activeTrip.destination.address, lat: activeTrip.destination.lat, lng: activeTrip.destination.lng }
    : incomingRequest
    ? { address: incomingRequest.destination.address, lat: incomingRequest.destination.lat, lng: incomingRequest.destination.lng }
    : undefined;

  const mapRouteGeometry = activeTrip?.routeGeometry || incomingRequest?.routeGeometry;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0A0E17] text-white flex flex-col font-sans select-none">
      
      {/* 1. TOP FLOATING APP BAR (Always accessible on map and views) */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 flex items-center justify-between pointer-events-none">
        
        {/* Left: Hamburger Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#121724]/95 hover:bg-[#1A2234] backdrop-blur-md border border-white/10 text-white shadow-xl flex items-center justify-center pointer-events-auto cursor-pointer transition-transform active:scale-95"
          title="Meny"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Center: Online/Offline Pill Button */}
        <button
          onClick={handleToggleOnline}
          className={`pointer-events-auto px-4 sm:px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-2xl cursor-pointer active:scale-95 ${
            currentDriver?.isOnline
              ? 'bg-[#121724]/95 hover:bg-[#1A2234] text-white border-2 border-emerald-500 shadow-emerald-500/20'
              : 'bg-[#34D186] hover:bg-[#2EB875] text-slate-950 shadow-emerald-500/30 ring-4 ring-emerald-500/20'
          }`}
        >
          {currentDriver?.isOnline ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-bold">ONLINE</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="text-[11px] font-mono text-slate-300">Gå Offline</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Gå Online</span>
            </>
          )}
        </button>

        {/* Right: Sound & Safety Tool Stack */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              toast.info(soundEnabled ? 'Lydvarsler deaktivert' : 'Lydvarsler aktivert 🔔');
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#121724]/95 hover:bg-[#1A2234] backdrop-blur-md border border-white/10 text-slate-300 shadow-xl flex items-center justify-center cursor-pointer transition-transform active:scale-95"
            title={soundEnabled ? 'Deaktiver lyd' : 'Aktiver lyd'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />}
          </button>

          <button
            onClick={() => setShowSafetyModal(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#121724]/95 hover:bg-[#1A2234] backdrop-blur-md border border-white/10 text-slate-200 shadow-xl flex items-center justify-center cursor-pointer relative transition-transform active:scale-95"
            title="Sikkerhetsverktøy (SOS)"
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border border-[#121724]" />
          </button>
        </div>

      </div>

      {/* MAIN VIEW CONTAINER */}
      <div className="flex-1 relative w-full h-full overflow-hidden">

        {/* 1. TAB: DRIVER (FULLSCREEN MAP + HUD + COMPACT POPUPS) */}
        {navTab === 'driver' && (
          <div className="relative w-full h-full">
            
            {/* FULLSCREEN LEAFLET MAP - 100% Kant-til-kant */}
            <div className="absolute inset-0 z-0 w-full h-full">
              <LeafletMap
                className="w-full h-full relative"
                interactive={true}
                hotspots={OSLO_HOTSPOTS}
                showHotspots={showHeatmap}
                showRecenterButton={false}
                centerLat={mapCenterLat}
                centerLng={mapCenterLng}
                zoom={activeTrip || incomingRequest ? 14 : 13}
                driverLocation={
                  currentDriver?.currentLocation
                    ? {
                        lat: currentDriver.currentLocation.lat,
                        lng: currentDriver.currentLocation.lng,
                        heading: currentDriver.currentLocation.heading || 0,
                      }
                    : { lat: 59.9139, lng: 10.7522, heading: 0 }
                }
                pickup={mapPickup}
                destination={mapDestination}
                routeGeometry={mapRouteGeometry}
              />
            </div>

            {/* COMPACT STATUS OVERLAY (When Online & No Trip Request & No Active Trip) */}
            {currentDriver?.isOnline && !incomingRequest && !activeTrip && (
              <div className="absolute top-18 sm:top-20 inset-x-3 sm:inset-x-6 z-20 pointer-events-auto animate-in slide-in-from-top duration-200">
                <CompactDriverStatusBar
                  isOnline={currentDriver.isOnline}
                  todayNet={todayNet}
                  todayTripsCount={todayCompletedTrips.length}
                  acceptanceRate={acceptanceRateText}
                  points={driverPoints}
                  tierName={driverTier}
                  onlineDurationText={formatOnlineDuration(onlineSeconds)}
                  vehicleName={currentVehicle?.model || 'Tesla Model Y'}
                  vehiclePlate={currentVehicle?.licensePlate || 'EP 17891'}
                  onOpenEarnings={() => setShowEarningsView(true)}
                  onOpenTrips={() => setNavTab('bookings')}
                />
              </div>
            )}

            {/* MAP UTILITIES (Surge & GPS Controls) */}
            <div className="absolute left-3 sm:left-4 bottom-20 z-20 flex gap-2 pointer-events-auto">
              <button
                onClick={() => setShowSurgeModal(true)}
                className={`h-10 sm:h-11 px-3 rounded-2xl backdrop-blur-md border shadow-xl flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${
                  showHeatmap
                    ? 'bg-[#121724]/95 border-amber-500/50 text-amber-400'
                    : 'bg-[#121724]/90 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Surge / Varmekart"
              >
                <Flame className="w-4 h-4 fill-amber-400/20 text-amber-400" />
                <span className="text-xs font-black font-mono">1.6x</span>
              </button>

              <button
                onClick={handleRecenterGPS}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#121724]/95 hover:bg-[#1A2234] backdrop-blur-md border border-white/10 text-emerald-400 shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                title="Sentrér GPS på kartet"
              >
                <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* COMPACT NEW TRIP REQUEST CARD (Above Bottom Navigation) */}
            {currentDriver?.isOnline && !activeTrip && incomingRequest && (
              <div className="absolute inset-x-3 bottom-20 md:bottom-auto md:top-20 md:right-6 md:left-auto md:w-96 z-30 pointer-events-auto animate-in slide-in-from-right duration-300">
                <NewTripRequestCard
                  trip={incomingRequest}
                  countdown={incomingCountdown}
                  onAccept={handleAcceptTrip}
                  onReject={handleRejectTrip}
                  onDelete={handleDeleteTripDirect}
                />
              </div>
            )}

            {/* COMPACT ACTIVE TRIP STATUS STEPS OVERLAY (Above Bottom Navigation) */}
            {activeTrip && (
              <div className="absolute inset-x-3 bottom-20 md:bottom-auto md:top-20 md:right-6 md:left-auto md:w-96 z-30 pointer-events-auto animate-in slide-in-from-right duration-300">
                <TripStatusOverlay
                  trip={activeTrip}
                  currentDriver={currentDriver}
                  currentVehicle={currentVehicle}
                  onAdvanceStatus={handleAdvanceTripStatus}
                  onDeleteTrip={handleDeleteTripDirect}
                  onCancelTrip={handleCancelTripDirect}
                  onOpenNavigation={handleOpenNavigation}
                  onOpenSmsModal={() => setShowSmsModal(true)}
                  waitingSeconds={waitingSeconds}
                />
              </div>
            )}

          </div>
        )}

        {/* 2. TAB: BILER (Vehicles & Fleet Management) */}
        {navTab === 'vehicles' && (
          <div className="h-full pt-16">
            <DriverVehiclesView
              currentDriver={currentDriver}
              vehicles={vehicles}
              onSelectVehicle={selectDriverVehicle}
            />
          </div>
        )}

        {/* 3. TAB: BESTILL (Orders & Bookings Central) */}
        {navTab === 'bookings' && (
          <div className="h-full pt-16">
            <DriverBookingsView
              trips={trips}
              currentDriver={currentDriver}
              currentVehicle={currentVehicle}
              onAcceptTrip={handleAcceptTrip}
              onRejectTrip={handleRejectTrip}
              onCancelTrip={handleCancelTripDirect}
              onDeleteTrip={handleDeleteTripDirect}
              onCreateStreetTrip={createTrip}
              onOpenTripOnMap={(trip) => {
                setNavTab('driver');
              }}
            />
          </div>
        )}

        {/* 4. TAB: KONTO (Driver Profile & Real Earnings) */}
        {navTab === 'account' && (
          <div className="h-full pt-16">
            <DriverAccountView
              currentDriver={currentDriver}
              currentVehicle={currentVehicle}
              completedTrips={myCompletedTrips}
              acceptanceRate={acceptanceRateText}
              points={driverPoints}
              tierName={driverTier}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onLogout={() => {
                logout();
                navigate('/sjafor/login');
              }}
            />
          </div>
        )}

      </div>

      {/* 2. FIXED BOTTOM NAVIGATION BAR (Sticky at bottom, always available) */}
      <DriverBottomNav
        activeTab={navTab}
        onSelectTab={setNavTab}
        pendingCount={pendingTrips.length}
        hasActiveTrip={Boolean(activeTrip)}
        isOnline={Boolean(currentDriver?.isOnline)}
      />

      {/* QUICK SMS MODAL */}
      {showSmsModal && activeTrip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-white/10 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Hurtigmelding til passasjer</h3>
              <button onClick={() => setShowSmsModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleSendQuickSms('Hei! Din Aron Taxi VIP sjåfør er på vei og ankommer om ca 3 min.')}
                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 cursor-pointer"
              >
                «Er på vei, ankommer om ca 3 min»
              </button>
              <button
                onClick={() => handleSendQuickSms('Hei! Jeg har ankommet henteadressen og venter utenfor i en ' + (currentVehicle?.model || 'Tesla Model Y') + '.')}
                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 cursor-pointer"
              >
                «Jeg er ankommet og venter utenfor»
              </button>
              <button
                onClick={() => handleSendQuickSms('Hei! Det er litt trafikk, ankommer henteadresse om 5 minutter.')}
                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 cursor-pointer"
              >
                «Litt trafikk, ankommer om 5 minutter»
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isDrawerOpen && (
        <BoltDriverDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          driver={currentDriver}
          vehicle={currentVehicle}
          todayEarnings={todayNet}
          todayTrips={todayCompletedTrips.length}
          acceptanceRate={acceptanceRateText}
          points={driverPoints}
          tierName={driverTier}
          onOpenEarnings={() => {
            setIsDrawerOpen(false);
            setShowEarningsView(true);
          }}
          onOpenCampaigns={() => {
            setIsDrawerOpen(false);
            setShowCampaignsModal(true);
          }}
          onOpenScheduled={() => {
            setIsDrawerOpen(false);
            setShowScheduledModal(true);
          }}
          onOpenPreferences={() => {
            setIsDrawerOpen(false);
            setShowPreferencesModal(true);
          }}
          onOpenSafety={() => {
            setIsDrawerOpen(false);
            setShowSafetyModal(true);
          }}
          onLogout={() => {
            logout();
            navigate('/sjafor/login');
          }}
        />
      )}

      {showSafetyModal && (
        <BoltSafetyModal
          isOpen={showSafetyModal}
          onClose={() => setShowSafetyModal(false)}
          driver={currentDriver}
          activeTrip={activeTrip}
          onTriggerEmergency={handleTriggerEmergency}
        />
      )}

      {showPreferencesModal && (
        <BoltPreferencesModal
          isOpen={showPreferencesModal}
          onClose={() => setShowPreferencesModal(false)}
          driver={currentDriver}
          vehicles={vehicles}
          onSelectVehicle={selectDriverVehicle}
        />
      )}

      {showDestinationModal && (
        <BoltDestinationModal
          isOpen={showDestinationModal}
          onClose={() => setShowDestinationModal(false)}
          activeDestination={activeDestination}
          onSetDestination={(dest) => {
            setActiveDestination(dest);
            toast.success(`Destinasjonsmodus satt: ${dest}`);
          }}
          onClearDestination={() => {
            setActiveDestination('');
            toast.info('Destinasjonsmodus deaktivert.');
          }}
        />
      )}

      {showSurgeModal && (
        <BoltSurgeModal
          isOpen={showSurgeModal}
          onClose={() => setShowSurgeModal(false)}
          hotspots={OSLO_HOTSPOTS}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
        />
      )}

      {showScheduledModal && (
        <BoltScheduledRidesModal
          isOpen={showScheduledModal}
          onClose={() => setShowScheduledModal(false)}
          onAcceptScheduled={handleAcceptTrip}
        />
      )}

      {showCampaignsModal && (
        <BoltCampaignsModal
          isOpen={showCampaignsModal}
          onClose={() => setShowCampaignsModal(false)}
        />
      )}

      {showEarningsView && (
        <BoltEarningsView
          onClose={() => setShowEarningsView(false)}
          todayEarnings={todayNet}
          weekEarnings={currentDriver?.weekEarnings || todayNet}
          monthEarnings={currentDriver?.monthEarnings || todayNet}
          completedTrips={myCompletedTrips}
        />
      )}

    </div>
  );
};
