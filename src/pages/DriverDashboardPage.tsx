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

import {
  Menu,
  Shield,
  Zap,
  Power,
  Flame,
  Navigation,
  Sliders,
  Crosshair,
  ChevronRight,
  Award,
  Star,
  Home,
  Wallet,
  Clock,
  History,
  HelpCircle,
  Check,
  X,
  Phone,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Gift,
  Sparkles,
  MapPin,
  Car,
  Trash2,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';

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

  // Find driver object
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
  const [incomingCountdown, setIncomingCountdown] = useState(15);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [onlineSeconds, setOnlineSeconds] = useState(0);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
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

  // Format online time into hh:mm:ss
  const formatOnlineDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Incoming pending trips in Oslo - clean filter allowing all payments (Card, Vipps, Cash, Invoice, Stripe)
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
      setIncomingCountdown(15);
      toast.info('🚕 Ny turforespørsel i Oslo!', {
        description: `${pendingTrips[0]?.pickup?.address} → ${pendingTrips[0]?.destination?.address} (${pendingTrips[0]?.estimatedPrice} kr)`,
      });
    }
    prevPendingCount.current = pendingTrips.length;
  }, [pendingTrips.length, currentDriver?.isOnline, soundEnabled]);

  // Countdown timer for incoming request
  useEffect(() => {
    if (!currentDriver?.isOnline || pendingTrips.length === 0 || activeTrip) return;

    const timer = setInterval(() => {
      setIncomingCountdown((prev) => {
        if (prev <= 1) return 15;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentDriver?.isOnline, pendingTrips.length, activeTrip]);

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
      toast.success('🟢 Du er nå ONLINE og kartet er i fullskjerm-modus!');
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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#10141E] text-white flex flex-col font-sans select-none">
      
      {/* 1. TOP FLOATING APP BAR (Bolt Style) */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 flex items-center justify-between pointer-events-none">
        
        {/* Left: Hamburger Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-12 h-12 rounded-full bg-[#151B28]/90 hover:bg-[#1C2538] backdrop-blur-md border border-white/10 text-white shadow-xl flex items-center justify-center pointer-events-auto cursor-pointer transition-transform active:scale-95"
          title="Meny"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center: Big Online/Offline Pill Button with Live Tactile Status */}
        <button
          onClick={handleToggleOnline}
          className={`pointer-events-auto px-6 py-3 rounded-full font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-2xl cursor-pointer active:scale-95 ${
            currentDriver?.isOnline
              ? 'bg-[#151B28]/95 hover:bg-[#1C2538] text-white border-2 border-emerald-500 shadow-emerald-500/20'
              : 'bg-[#34D186] hover:bg-[#2EB875] text-slate-950 shadow-emerald-500/30 ring-4 ring-emerald-500/20'
          }`}
        >
          {currentDriver?.isOnline ? (
            <>
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400">ONLINE (På vakt)</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="text-[10px] font-mono text-slate-300">Gå Offline</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Gå Online Nå</span>
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
            className="w-10 h-10 rounded-full bg-[#151B28]/90 hover:bg-[#1C2538] backdrop-blur-md border border-white/10 text-slate-300 shadow-xl flex items-center justify-center cursor-pointer transition-transform active:scale-95"
            title={soundEnabled ? 'Deaktiver lyd' : 'Aktiver lyd'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => setShowSafetyModal(true)}
            className="w-12 h-12 rounded-full bg-[#151B28]/90 hover:bg-[#1C2538] backdrop-blur-md border border-white/10 text-slate-200 shadow-xl flex items-center justify-center cursor-pointer relative transition-transform active:scale-95"
            title="Sikkerhetsverktøy"
          >
            <Shield className="w-6 h-6 text-slate-300" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#151B28]" />
          </button>
        </div>

      </div>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <div className="flex-1 relative w-full h-full">

        {/* VIEW 1: HOME (MAP + BOLT FULLSCREEN COCKPIT OR BOTTOM SHEET) */}
        {activeTab === 'home' && (
          <div className="relative w-full h-full">
            
            {/* FULLSCREEN LEAFLET MAP */}
            <div className="absolute inset-0 z-0">
              <LeafletMap
                interactive={true}
                pickup={
                  activeTrip
                    ? {
                        address: activeTrip.pickup.address,
                        lat: activeTrip.pickup.lat,
                        lng: activeTrip.pickup.lng,
                      }
                    : currentDriver?.currentLocation
                    ? {
                        address: 'Min posisjon',
                        lat: currentDriver.currentLocation.lat,
                        lng: currentDriver.currentLocation.lng,
                      }
                    : undefined
                }
                destination={
                  activeTrip
                    ? {
                        address: activeTrip.destination.address,
                        lat: activeTrip.destination.lat,
                        lng: activeTrip.destination.lng,
                      }
                    : undefined
                }
              />
            </div>

            {/* FULLSCREEN ONLINE HUD COCKPIT BAR (When Online & No Active Trip) */}
            {currentDriver?.isOnline && !activeTrip && (
              <div className="absolute top-20 inset-x-3 sm:inset-x-6 z-20 max-w-lg mx-auto pointer-events-auto animate-in slide-in-from-top duration-300">
                <div className="bg-[#121722]/95 backdrop-blur-xl border border-emerald-500/40 rounded-3xl p-3.5 shadow-2xl space-y-3">
                  
                  {/* Radar Pulse / Search Status */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex items-center justify-center">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
                        <Radio className="w-4 h-4 text-emerald-400 relative z-10" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Søker etter turer i Oslo</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {currentVehicle?.model || 'Tesla Model Y'} • Klar for oppdrag
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono block">Tid på vakt</span>
                      <span className="text-xs font-black font-mono text-emerald-400">
                        {formatOnlineDuration(onlineSeconds)}
                      </span>
                    </div>
                  </div>

                  {/* Day Summary Grid in Cockpit */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div 
                      onClick={() => setShowEarningsView(true)}
                      className="bg-[#171E2D] hover:bg-[#1D2638] rounded-2xl p-2 cursor-pointer transition-colors border border-white/5"
                    >
                      <span className="text-[10px] text-slate-400 block font-medium">Netto i dag</span>
                      <span className="text-xs font-black text-white">kr {todayNet},00</span>
                    </div>

                    <div 
                      onClick={() => setActiveTab('rides')}
                      className="bg-[#171E2D] hover:bg-[#1D2638] rounded-2xl p-2 cursor-pointer transition-colors border border-white/5"
                    >
                      <span className="text-[10px] text-slate-400 block font-medium">Turer i dag</span>
                      <span className="text-xs font-black text-emerald-400">{todayCompletedTrips.length} turer</span>
                    </div>

                    <div className="bg-[#171E2D] rounded-2xl p-2 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-medium">Sjåførscore</span>
                      <span className="text-xs font-black text-white">99%</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* FLOATING ACTION BUTTONS ON MAP (Above bottom controls) */}
            <div className={`absolute left-4 right-4 z-20 flex justify-between items-end pointer-events-none transition-all duration-300 ${
              currentDriver?.isOnline ? 'bottom-[90px]' : 'bottom-[240px] sm:bottom-[280px]'
            }`}>
              
              {/* Bottom Left: Surge Heatmap Button */}
              <button
                onClick={() => setShowSurgeModal(true)}
                className="pointer-events-auto w-12 h-12 rounded-full bg-[#151B28]/90 hover:bg-[#1C2538] backdrop-blur-md border border-white/10 text-amber-400 shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                title="Surge / Varmekart"
              >
                <Flame className="w-6 h-6 fill-amber-400/20" />
              </button>

              {/* Bottom Right Stack: Destination Mode, Preferences, GPS Recenter */}
              <div className="flex flex-col gap-2.5 pointer-events-auto items-center">
                
                {/* Destination Mode Button */}
                <button
                  onClick={() => setShowDestinationModal(true)}
                  className={`w-12 h-12 rounded-full backdrop-blur-md border shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
                    activeDestination
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-[#151B28]/90 hover:bg-[#1C2538] border-white/10 text-slate-200'
                  }`}
                  title="Destinasjonsmodus"
                >
                  <Navigation className="w-5 h-5" />
                </button>

                {/* Preferences Button */}
                <button
                  onClick={() => setShowPreferencesModal(true)}
                  className="w-12 h-12 rounded-full bg-[#151B28]/90 hover:bg-[#1C2538] backdrop-blur-md border border-white/10 text-slate-200 shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                  title="Sjåførpreferanser"
                >
                  <Sliders className="w-5 h-5" />
                </button>

                {/* Recenter GPS */}
                <button
                  onClick={() => toast.info('Kartet er sentrert på din posisjon i Oslo.')}
                  className="w-12 h-12 rounded-full bg-[#151B28]/90 hover:bg-[#1C2538] backdrop-blur-md border border-white/10 text-emerald-400 shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                  title="Sentrer på meg"
                >
                  <Crosshair className="w-5 h-5" />
                </button>
              </div>

            </div>

            {/* INCOMING RIDE REQUEST OVERLAY / MODAL */}
            {currentDriver?.isOnline && !activeTrip && pendingTrips.length > 0 && (
              <div className="absolute inset-x-3 bottom-[72px] sm:bottom-[80px] z-30 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
                <div className="bg-[#121722] border-2 border-emerald-500 rounded-3xl p-5 shadow-2xl space-y-4">
                  
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                        Ny turforespørsel ({pendingTrips[0].vehicleCategory === 'airport_vip' ? 'Flyplass VIP' : 'Aron VIP'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteTripDirect(pendingTrips[0].id)}
                        title="Slett testbestilling"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-mono font-black text-xs">
                        {incomingCountdown}s
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Henteadresse</span>
                        <span className="text-white font-medium">{pendingTrips[0].pickup?.address}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Navigation className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Leveringsadresse</span>
                        <span className="text-white font-medium">{pendingTrips[0].destination?.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fare & Stats */}
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-3.5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Din utbetaling (85%)</span>
                      <span className="text-2xl font-black text-emerald-400">
                        kr {Math.round(pendingTrips[0].estimatedPrice * 0.85)}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">(Brutto {pendingTrips[0].estimatedPrice} kr)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Avstand / Tid</span>
                      <span className="text-xs font-bold text-slate-200">
                        {pendingTrips[0].distanceKm} km · {pendingTrips[0].durationMinutes} min
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRejectTrip(pendingTrips[0].id)}
                      className="py-3.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs uppercase tracking-wider rounded-2xl border border-rose-500/30 transition-all cursor-pointer"
                    >
                      Avslå
                    </button>
                    <button
                      onClick={() => handleAcceptTrip(pendingTrips[0].id)}
                      className="py-3.5 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      Godta tur ({incomingCountdown}s)
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ACTIVE TRIP CONSOLE OVERLAY */}
            {activeTrip && (
              <div className="absolute inset-x-3 bottom-[72px] sm:bottom-[80px] z-30 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
                <div className="bg-[#121722] border-2 border-emerald-500 rounded-3xl p-5 shadow-2xl space-y-4">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-black uppercase tracking-wider">
                        Aktiv tur
                      </span>
                      <span className="text-xs text-slate-400 font-mono">#{activeTrip.id.slice(-6)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeTrip.status === 'driver_arrived' && (
                        <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Venter: {Math.floor(waitingSeconds / 60)}:{(waitingSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteTripDirect(activeTrip.id)}
                        title="Avbryt/slett denne turen"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Step status */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className={`p-2 rounded-xl text-[11px] font-bold ${
                      activeTrip.status === 'driver_assigned' || activeTrip.status === 'accepted' || activeTrip.status === 'confirmed' || activeTrip.status === 'driver_arriving'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-white/5 text-slate-500'
                    }`}>
                      1. På vei
                    </div>
                    <div className={`p-2 rounded-xl text-[11px] font-bold ${
                      activeTrip.status === 'driver_arrived'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-white/5 text-slate-500'
                    }`}>
                      2. Ankommet
                    </div>
                    <div className={`p-2 rounded-xl text-[11px] font-bold ${
                      activeTrip.status === 'trip_started' || activeTrip.status === 'active'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-white/5 text-slate-500'
                    }`}>
                      3. Kjører
                    </div>
                  </div>

                  {/* Route */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-3 space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Henting</span>
                        <span className="text-white font-medium">{activeTrip.pickup?.address}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Navigation className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Levering</span>
                        <span className="text-white font-medium">{activeTrip.destination?.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Passenger row */}
                  <div className="flex items-center justify-between gap-2 bg-[#171E2D] border border-white/10 rounded-2xl p-3">
                    <div className="text-xs">
                      <div className="font-bold text-white">{activeTrip.customerName || 'Passasjer'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{activeTrip.customerPhone || 'Tlf registrert'}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeTrip.customerPhone && (
                        <a
                          href={`tel:${activeTrip.customerPhone}`}
                          className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          title="Ring passasjer"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setShowSmsModal(true)}
                        className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40"
                        title="Send SMS"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleOpenNavigation(
                            activeTrip.status === 'trip_started' || activeTrip.status === 'active'
                              ? activeTrip.destination.address
                              : activeTrip.pickup.address
                          )
                        }
                        className="p-2.5 rounded-xl bg-[#34D186] text-slate-950 font-bold text-xs flex items-center gap-1"
                        title="Start GPS"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>GPS</span>
                      </button>
                    </div>
                  </div>

                  {/* Advance Button */}
                  <button
                    onClick={handleAdvanceTripStatus}
                    className="w-full py-4 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>
                      {activeTrip.status === 'driver_arrived'
                        ? 'Start Turen Nå'
                        : activeTrip.status === 'trip_started' || activeTrip.status === 'active'
                        ? `Fullfør Tur (Motta ${activeTrip.estimatedPrice} kr)`
                        : 'Marker som Ankommet Henteadresse'}
                    </span>
                  </button>

                </div>
              </div>
            )}

            {/* BOLT DRAGGABLE BOTTOM SHEET (Displayed ONLY when OFFLINE and no active trip) */}
            {!currentDriver?.isOnline && !activeTrip && (
              <div
                className={`absolute inset-x-0 bottom-0 z-10 bg-[#121722] border-t border-white/10 rounded-t-[32px] shadow-2xl transition-all duration-300 pb-20 ${
                  bottomSheetExpanded ? 'h-[75vh]' : 'h-[230px] sm:h-[260px]'
                }`}
              >
                
                {/* Drag handle */}
                <div 
                  onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
                  className="w-full py-3 flex items-center justify-center cursor-pointer group"
                >
                  <div className="w-12 h-1.5 bg-slate-700 group-hover:bg-slate-500 rounded-full transition-colors" />
                </div>

                {/* Content scroll area */}
                <div className="px-4 sm:px-6 overflow-y-auto h-full space-y-3 pb-8">
                  
                  {/* Offline Call-to-action */}
                  <div className="bg-[#171E2D] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">Du er nå OFFLINE</div>
                      <div className="text-xs text-slate-400">Gå online for å motta nye kjøreoppdrag i Oslo</div>
                    </div>
                    <button
                      onClick={handleToggleOnline}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Gå Online
                    </button>
                  </div>

                  {/* Action Cards Carousel */}
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                    
                    {/* Card 1: We've got your back */}
                    <div
                      onClick={() => setActiveTab('help')}
                      className="min-w-[220px] bg-[#171E2D] hover:bg-[#1D2638] border border-white/10 rounded-2xl p-3.5 cursor-pointer transition-colors space-y-1.5 shrink-0"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-white">Kundestøtte & Hjelp</div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        Få støtte og råd direkte fra sentralen
                      </div>
                    </div>

                    {/* Card 2: Meet the new auto-accept */}
                    <div
                      onClick={() => setShowPreferencesModal(true)}
                      className="min-w-[220px] bg-[#171E2D] hover:bg-[#1D2638] border border-white/10 rounded-2xl p-3.5 cursor-pointer transition-colors space-y-1.5 shrink-0"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-white">Sjåførinnstillinger</div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        Juster auto-godta og kjørekategorier
                      </div>
                    </div>

                    {/* Card 3: Offers */}
                    <div
                      onClick={() => setActiveTab('earn_more')}
                      className="min-w-[220px] bg-[#171E2D] hover:bg-[#1D2638] border border-white/10 rounded-2xl p-3.5 cursor-pointer transition-colors space-y-1.5 shrink-0"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-white">Bonuser & Kampanjer</div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        Se opptjente bonuser og mål
                      </div>
                    </div>

                  </div>

                  {/* 2x2 CORE STATS GRID */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    
                    {/* Today's earnings */}
                    <div
                      onClick={() => setShowEarningsView(true)}
                      className="bg-[#171E2D] hover:bg-[#1D2638] border border-white/10 rounded-2xl p-3.5 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Dagens inntjening</div>
                        <div className="text-base font-black text-white mt-0.5">kr {todayNet},00</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>

                    {/* Rewards Tier */}
                    <div
                      onClick={() => setShowCampaignsModal(true)}
                      className="bg-[#171E2D] hover:bg-[#1D2638] border border-white/10 rounded-2xl p-3.5 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300 font-semibold">
                          <Award className="w-3.5 h-3.5 text-slate-300" />
                          Silver
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="text-[10px] text-slate-400">Turer i dag: {todayCompletedTrips.length}</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-400 h-full rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>

                    {/* Driver score */}
                    <div className="bg-[#171E2D] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Sjåførscore</div>
                        <div className="text-base font-black text-emerald-400 mt-0.5">99%</div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">Utmerket</span>
                    </div>

                    {/* Acceptance rate */}
                    <div className="bg-[#171E2D] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Akseptgrad</div>
                        <div className="text-base font-black text-white mt-0.5">96%</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400">Aktiv</span>
                    </div>

                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: EARN MORE (TJEN MER) */}
        {activeTab === 'earn_more' && (
          <BoltEarnMoreView
            onOpenEarnings={() => setShowEarningsView(true)}
            onOpenScheduled={() => setShowScheduledModal(true)}
            onOpenCampaigns={() => setShowCampaignsModal(true)}
            completedTrips={myCompletedTrips}
          />
        )}

        {/* VIEW 3: RIDES (TURER) */}
        {activeTab === 'rides' && (
          <BoltRidesView
            completedTrips={myCompletedTrips}
          />
        )}

        {/* VIEW 4: HELP (HJELP) */}
        {activeTab === 'help' && (
          <BoltHelpView
            driverPhone={currentDriver?.phone}
          />
        )}

      </div>

      {/* 2. BOTTOM NAVIGATION BAR (Bolt Style - 4 Tabs) */}
      <div className="sticky bottom-0 z-40 bg-[#10141E] border-t border-white/10 py-2.5 px-4 flex justify-around items-center">
        
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Hjem</span>
        </button>

        {/* Tab 2: Earn More */}
        <button
          onClick={() => setActiveTab('earn_more')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'earn_more' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Tjen mer</span>
        </button>

        {/* Tab 3: Rides History */}
        <button
          onClick={() => setActiveTab('rides')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'rides' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Turer</span>
        </button>

        {/* Tab 4: Help */}
        <button
          onClick={() => setActiveTab('help')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'help' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Hjelp</span>
        </button>

      </div>

      {/* MODALS */}
      <BoltDriverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        driver={currentDriver}
        currentVehicle={currentVehicle}
        onOpenSafety={() => setShowSafetyModal(true)}
        onOpenEarnings={() => setShowEarningsView(true)}
        onOpenScheduled={() => setShowScheduledModal(true)}
        onOpenCampaigns={() => setShowCampaignsModal(true)}
      />

      <BoltSafetyModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        onTriggerEmergency={handleTriggerEmergency}
        driverName={currentDriver?.name}
        vehiclePlate={currentDriver?.vehiclePlate || currentVehicle?.licensePlate}
      />

      <BoltPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
      />

      <BoltDestinationModal
        isOpen={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        activeDestination={activeDestination}
        onSetDestination={(dest) => setActiveDestination(dest)}
      />

      <BoltSurgeModal
        isOpen={showSurgeModal}
        onClose={() => setShowSurgeModal(false)}
      />

      <BoltScheduledRidesModal
        isOpen={showScheduledModal}
        onClose={() => setShowScheduledModal(false)}
        currentDriver={currentDriver}
      />

      <BoltCampaignsModal
        isOpen={showCampaignsModal}
        onClose={() => setShowCampaignsModal(false)}
        completedTrips={myCompletedTrips}
      />

      {showEarningsView && (
        <div className="fixed inset-0 z-50 bg-[#10141E]">
          <BoltEarningsView
            onBack={() => setShowEarningsView(false)}
            completedTrips={myCompletedTrips}
          />
        </div>
      )}

      {/* QUICK SMS MODAL */}
      {showSmsModal && activeTrip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-white/10 rounded-3xl p-5 max-w-sm w-full space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Send hurtigmelding til passasjer</h3>
              <button
                onClick={() => setShowSmsModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSendQuickSms('Hei! Jeg har ankommet henteadressen nå og venter utenfor i en ' + (currentVehicle?.model || 'Tesla') + '.')}
                className="w-full text-left p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/20 text-xs text-slate-200 hover:text-emerald-400 transition-colors border border-white/5"
              >
                «Jeg er fremme og venter utenfor.»
              </button>
              <button
                onClick={() => handleSendQuickSms('Hei! Jeg er på vei og er fremme om ca. 3–5 minutter.')}
                className="w-full text-left p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/20 text-xs text-slate-200 hover:text-emerald-400 transition-colors border border-white/5"
              >
                «Er fremme om ca. 3–5 minutter.»
              </button>
              <button
                onClick={() => handleSendQuickSms('Hei! Det er litt kø i området, ankommer straks.')}
                className="w-full text-left p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/20 text-xs text-slate-200 hover:text-emerald-400 transition-colors border border-white/5"
              >
                «Litt kø i området, ankommer straks.»
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
