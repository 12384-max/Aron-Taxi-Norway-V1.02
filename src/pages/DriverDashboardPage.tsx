import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LeafletMap } from '../components/LeafletMap';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import { Trip, Driver, Vehicle } from '../types';
import { soundService } from '../services/sound';

// Bolt Driver Components
import { BoltDriverDrawer } from '../components/driver/BoltDriverDrawer';
import { BoltSafetyModal } from '../components/driver/BoltSafetyModal';
import { BoltPreferencesModal } from '../components/driver/BoltPreferencesModal';
import { BoltDestinationModal } from '../components/driver/BoltDestinationModal';
import { BoltSurgeModal } from '../components/driver/BoltSurgeModal';
import { BoltEarningsView } from '../components/driver/BoltEarningsView';
import { BoltEarnMoreView } from '../components/driver/BoltEarnMoreView';
import { BoltRidesView } from '../components/driver/BoltRidesView';
import { BoltHelpView } from '../components/driver/BoltHelpView';
import { BoltScheduledRidesModal } from '../components/driver/BoltScheduledRidesModal';
import { BoltCampaignsModal } from '../components/driver/BoltCampaignsModal';
import { CompactDriverStatusBar } from '../components/driver/CompactDriverStatusBar';
import { NewTripRequestCard } from '../components/driver/NewTripRequestCard';
import { TripStatusOverlay } from '../components/driver/TripStatusOverlay';

import {
  Menu,
  Shield,
  Zap,
  Flame,
  Navigation,
  Sliders,
  Crosshair,
  ChevronRight,
  Clock,
  Check,
  X,
  Phone,
  MessageSquare,
  MapPin,
  Car,
  Trash2,
  Volume2,
  VolumeX,
  Radio
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
  } = useTrips();

  // Find driver object (Aron / Tariq or logged in)
  const currentDriver: Driver | undefined =
    drivers.find(
      (d) => d.id === user?.uid || d.email?.toLowerCase() === user?.email?.toLowerCase()
    ) || drivers[0];

  // Active Bottom Tab: 'home' | 'earn_more' | 'rides' | 'help'
  const [activeTab, setActiveTab] = useState<'home' | 'earn_more' | 'rides' | 'help'>('home');

  // Modals & Sub-views
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showSurgeModal, setShowSurgeModal] = useState(false);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);
  const [showEarningsView, setShowEarningsView] = useState(false);

  // States
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeDestination, setActiveDestination] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [incomingCountdown, setIncomingCountdown] = useState(18);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [onlineSeconds, setOnlineSeconds] = useState(0);
  const [showSmsModal, setShowSmsModal] = useState(false);

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

  // Incoming pending trips in Oslo
  const pendingTrips = trips.filter(
    (t) =>
      (t.status === 'pending' ||
        t.status === 'requested' ||
        t.status === 'searching_driver' ||
        t.status === 'confirmed') &&
      t.status !== 'pending_payment' &&
      !t.driverId &&
      t.paymentStatus !== 'payment_failed' &&
      t.paymentStatus !== 'cancelled' &&
      (!t.rejectedDriverIds || !t.rejectedDriverIds.includes(currentDriver?.id || ''))
  );

  const incomingRequest = pendingTrips.length > 0 ? pendingTrips[0] : null;

  // Active trip assigned to this driver
  const activeTrip = trips.find(
    (t) =>
      (t.driverId === currentDriver?.id || t.assignedDriverId === currentDriver?.id) &&
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      t.status !== 'rejected'
  );

  // Completed trips by this driver
  const myCompletedTrips = trips.filter(
    (t) => t.driverId === currentDriver?.id && t.status === 'completed'
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
      activeTrip.status === 'driver_assigned' ||
      activeTrip.status === 'accepted' ||
      activeTrip.status === 'confirmed' ||
      activeTrip.status === 'driver_arriving'
    ) {
      await updateTripStatus(activeTrip.id, 'driver_arrived');
      toast.success('Markert som ankommet! Venter på passasjer.');
      if (soundEnabled) soundService.playDriverArrivedSound(0.7);
    } else if (activeTrip.status === 'driver_arrived') {
      await updateTripStatus(activeTrip.id, 'trip_started');
      toast.success('Turen er startet! God kjøretur.');
      if (soundEnabled) soundService.playTripStartedSound(0.7);
    } else if (activeTrip.status === 'trip_started' || activeTrip.status === 'active') {
      await updateTripStatus(activeTrip.id, 'completed');
      toast.success(`Turen er fullført! ${activeTrip.estimatedPrice} kr registrert.`);
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
    <div className="relative h-screen w-screen overflow-hidden bg-[#10141E] text-white flex flex-col font-sans select-none">
      
      {/* 1. TOP FLOATING APP BAR (Ultra-compact & high contrast) */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 flex items-center justify-between pointer-events-none">
        
        {/* Left: Hamburger Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#151B28]/95 hover:bg-[#1C2538] backdrop-blur-md border border-white/10 text-white shadow-xl flex items-center justify-center pointer-events-auto cursor-pointer transition-transform active:scale-95"
          title="Meny"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Center: Online/Offline Pill Button */}
        <button
          onClick={handleToggleOnline}
          className={`pointer-events-auto px-4 sm:px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-2xl cursor-pointer active:scale-95 ${
            currentDriver?.isOnline
              ? 'bg-[#151B28]/95 hover:bg-[#1C2538] text-white border-2 border-emerald-500 shadow-emerald-500/20'
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
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#151B28]/95 hover:bg-[#1C2538] backdrop-blur-md border border-white/10 text-slate-300 shadow-xl flex items-center justify-center cursor-pointer transition-transform active:scale-95"
            title={soundEnabled ? 'Deaktiver lyd' : 'Aktiver lyd'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />}
          </button>

          <button
            onClick={() => setShowSafetyModal(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#151B28]/95 hover:bg-[#1C2538] backdrop-blur-md border border-white/10 text-slate-200 shadow-xl flex items-center justify-center cursor-pointer relative transition-transform active:scale-95"
            title="Sikkerhetsverktøy (SOS)"
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border border-[#151B28]" />
          </button>
        </div>

      </div>

      {/* MAIN VIEW CONTAINER */}
      <div className="flex-1 relative w-full h-full overflow-hidden">

        {/* VIEW 1: HOME (FULLSCREEN MAP + MINIMAL HUD) */}
        {activeTab === 'home' && (
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

            {/* 2. COMPACT STATUS OVERLAY (When Online & No Trip Request & No Active Trip) */}
            {currentDriver?.isOnline && !incomingRequest && !activeTrip && (
              <div className="absolute top-18 sm:top-20 inset-x-3 sm:inset-x-6 z-20 pointer-events-auto animate-in slide-in-from-top duration-200">
                <CompactDriverStatusBar
                  isOnline={currentDriver.isOnline}
                  todayNet={todayNet}
                  todayTripsCount={todayCompletedTrips.length}
                  driverScore="100%"
                  onlineDurationText={formatOnlineDuration(onlineSeconds)}
                  vehicleName={currentVehicle?.model || 'Tesla Model Y'}
                  vehiclePlate={currentVehicle?.licensePlate || 'EL 98450'}
                  onOpenEarnings={() => setShowEarningsView(true)}
                  onOpenTrips={() => setActiveTab('rides')}
                />
              </div>
            )}

            {/* 3. MAP UTILITIES (Surge & GPS Controls) */}
            <div className="absolute left-3 sm:left-4 bottom-4 z-20 flex gap-2 pointer-events-auto">
              <button
                onClick={() => setShowSurgeModal(true)}
                className={`h-10 sm:h-11 px-3 rounded-2xl backdrop-blur-md border shadow-xl flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${
                  showHeatmap
                    ? 'bg-[#151B28]/95 border-amber-500/50 text-amber-400'
                    : 'bg-[#151B28]/90 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Surge / Varmekart"
              >
                <Flame className="w-4 h-4 fill-amber-400/20 text-amber-400" />
                <span className="text-xs font-black font-mono">1.6x</span>
              </button>

              <button
                onClick={handleRecenterGPS}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#151B28]/95 hover:bg-[#1C2538] backdrop-blur-md border border-white/10 text-emerald-400 shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                title="Sentrér GPS på kartet"
              >
                <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* 4. NEW TRIP REQUEST CARD OVERLAY (PC: Right-side panel, Mobile: Bottom sheet) */}
            {currentDriver?.isOnline && !activeTrip && incomingRequest && (
              <div className="absolute inset-x-3 bottom-4 md:bottom-auto md:top-20 md:right-6 md:left-auto md:w-96 z-30 pointer-events-auto animate-in slide-in-from-right duration-300">
                <NewTripRequestCard
                  trip={incomingRequest}
                  countdown={incomingCountdown}
                  onAccept={handleAcceptTrip}
                  onReject={handleRejectTrip}
                  onDelete={handleDeleteTripDirect}
                />
              </div>
            )}

            {/* 5. ACTIVE TRIP REAL-TIME STATUS STEPS OVERLAY (PC: Right-side panel, Mobile: Bottom sheet) */}
            {activeTrip && (
              <div className="absolute inset-x-3 bottom-4 md:bottom-auto md:top-20 md:right-6 md:left-auto md:w-96 z-30 pointer-events-auto animate-in slide-in-from-right duration-300">
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

        {/* VIEW 2: EARN MORE (Bonuses & Campaigns) */}
        {activeTab === 'earn_more' && (
          <BoltEarnMoreView
            onBack={() => setActiveTab('home')}
            onOpenCampaigns={() => setShowCampaignsModal(true)}
            onOpenScheduled={() => setShowScheduledModal(true)}
          />
        )}

        {/* VIEW 3: RIDES (History & Details) */}
        {activeTab === 'rides' && (
          <BoltRidesView
            trips={myCompletedTrips}
            onBack={() => setActiveTab('home')}
          />
        )}

        {/* VIEW 4: HELP & SUPPORT */}
        {activeTab === 'help' && (
          <BoltHelpView
            onBack={() => setActiveTab('home')}
            driverPhone={currentDriver?.phone || '+47 96 99 09 01'}
          />
        )}

      </div>

      {/* QUICK SMS MODAL */}
      {showSmsModal && activeTrip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-white/10 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Hurtigmelding til passasjer</h3>
              <button onClick={() => setShowSmsModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleSendQuickSms('Hei! Din Aron Taxi VIP sjåfør er på vei og ankommer om ca 3 min.')}
                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200"
              >
                «Er på vei, ankommer om ca 3 min»
              </button>
              <button
                onClick={() => handleSendQuickSms('Hei! Jeg har ankommet henteadressen og venter utenfor i en ' + (currentVehicle?.model || 'Tesla Model Y') + '.')}
                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200"
              >
                «Jeg er ankommet og venter utenfor»
              </button>
              <button
                onClick={() => handleSendQuickSms('Hei! Det er litt trafikk, ankommer henteadresse om 5 minutter.')}
                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200"
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
