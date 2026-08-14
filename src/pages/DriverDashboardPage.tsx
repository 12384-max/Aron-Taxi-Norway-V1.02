import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LeafletMap } from '../components/LeafletMap';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import { Trip, Driver, Vehicle } from '../types';
import { soundService } from '../services/sound';
import { OFFICIAL_ASSETS } from '../constants/assets';
import {
  Car,
  Power,
  MapPin,
  Navigation,
  Clock,
  CheckCircle2,
  DollarSign,
  Percent,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Check,
  Menu,
  X,
  Phone,
  User,
  History,
  TrendingUp,
  Award,
  Star,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  Layers,
  ChevronRight,
  Luggage,
  Users,
  Compass,
  Flame,
  Zap,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Radio
} from 'lucide-react';

// Demand Hotspots in Oslo region with surge multipliers
const OSLO_HOTSPOTS = [
  { id: 'h1', name: 'Oslo S / Jernbanetorget', lat: 59.9111, lng: 10.7528, surge: '1.5x', category: 'Sentrum' },
  { id: 'h2', name: 'Oslo Lufthavn Gardermoen', lat: 60.1975, lng: 11.1004, surge: '1.6x', category: 'Flyplass' },
  { id: 'h3', name: 'Majorstuen / Bogstadveien', lat: 59.9298, lng: 10.7145, surge: '1.3x', category: 'Shopping' },
  { id: 'h4', name: 'Nationaltheatret / Solli', lat: 59.9145, lng: 10.7335, surge: '1.4x', category: 'Natteliv' },
  { id: 'h5', name: 'Aker Brygge / Tjuvholmen', lat: 59.9103, lng: 10.7275, surge: '1.4x', category: 'Restaurant' },
  { id: 'h6', name: 'Grünerløkka / Olaf Ryes', lat: 59.9229, lng: 10.7584, surge: '1.3x', category: 'Kafé & Bar' },
  { id: 'h7', name: 'Fornebu / Telenor Arena', lat: 59.8966, lng: 10.6268, surge: '1.2x', category: 'Næring' }
];

export const DriverDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
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
    addTipAndRatingToTrip,
    triggerEmergencyAlert,
    emergencyAlerts
  } = useTrips();

  // Find driver object in real Firestore collection
  const currentDriver: Driver | undefined = drivers.find(
    (d) => d.id === user?.uid || d.email?.toLowerCase() === user?.email?.toLowerCase()
  ) || (isAdmin ? drivers[0] : undefined);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'drive' | 'earnings' | 'trips' | 'hotspots' | 'vehicle' | 'profile' | 'settings'>('drive');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencySending, setEmergencySending] = useState(false);
  const [emergencySuccessMessage, setEmergencySuccessMessage] = useState<string | null>(null);

  // Incoming ride request countdown timer (15 seconds)
  const [incomingCountdown, setIncomingCountdown] = useState(15);
  const [activeTripSummary, setActiveTripSummary] = useState<Trip | null>(null);

  // Waiting timer for passenger (seconds)
  const [waitingSeconds, setWaitingSeconds] = useState(0);

  // Passenger rating modal state
  const [passengerRating, setPassengerRating] = useState<number>(5);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>(['Presis', 'Hyggelig']);

  // Sound notification tracker
  const prevPendingCount = useRef<number>(0);

  // Incoming pending trips waiting for assignment in Oslo (filtered for unassigned and not rejected by this driver)
  const pendingTrips = trips.filter(
    (t) =>
      (t.status === 'pending' || t.status === 'requested' || t.status === 'searching_driver') &&
      !t.driverId &&
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

  // Check if this driver has an active emergency alert
  const myActiveAlert = emergencyAlerts.find(
    (a) => a.driverId === currentDriver?.id && a.status === 'active'
  );

  // Sound chime when new trip arrives and driver is ONLINE
  useEffect(() => {
    if (currentDriver?.isOnline && pendingTrips.length > prevPendingCount.current) {
      if (soundEnabled) {
        soundService.playTripRequestChime(0.85);
      }
      setIncomingCountdown(15);
      toast.info('Ny Bolt-turforespørsel i Oslo!', {
        description: `${pendingTrips[0]?.pickup?.address} → ${pendingTrips[0]?.destination?.address} (${pendingTrips[0]?.estimatedPrice} kr)`
      });
    }
    prevPendingCount.current = pendingTrips.length;
  }, [pendingTrips.length, currentDriver?.isOnline, soundEnabled]);

  // Auto-accept mode handler
  useEffect(() => {
    if (autoAccept && currentDriver?.isOnline && pendingTrips.length > 0 && !activeTrip) {
      const targetTrip = pendingTrips[0];
      handleAcceptTrip(targetTrip.id);
    }
  }, [autoAccept, pendingTrips, currentDriver?.isOnline, activeTrip]);

  // Countdown timer for incoming request
  useEffect(() => {
    if (!currentDriver?.isOnline || pendingTrips.length === 0 || activeTrip) return;

    const timer = setInterval(() => {
      setIncomingCountdown((prev) => {
        if (prev <= 1) {
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentDriver?.isOnline, pendingTrips.length, activeTrip]);

  // Live GPS geolocation watch position while ONLINE
  useEffect(() => {
    if (!currentDriver?.id || !currentDriver.isOnline) return;

    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed || 0
          };
          updateDriverLocation(currentDriver.id, coords, activeTrip?.id);
        },
        (err) => {
          console.warn('Driver GPS watch info:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentDriver?.id, currentDriver?.isOnline, activeTrip?.id]);

  // Timer when driver has arrived at pickup waiting for customer
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

  // Authentication guards
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0E17] text-[#F8FAFC] flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-[#111827] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-[#34D186]/15 border border-[#34D186]/40 rounded-full flex items-center justify-center mx-auto text-[#34D186]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Sjåførinnlogging påkrevd</h2>
          <p className="text-xs text-slate-400">
            Du må logge inn på din godkjente sjåførkonto for å få tilgang til Bolt-sjåførportalen.
          </p>
          <button
            onClick={() => navigate('/driver/login')}
            className="w-full py-4 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black uppercase text-xs rounded-2xl shadow-xl transition-all cursor-pointer"
          >
            Gå til Sjåfør Innlogging
          </button>
        </div>
      </div>
    );
  }

  if (!currentDriver) {
    return (
      <div className="min-h-screen bg-[#0A0E17] text-[#F8FAFC] flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-[#111827] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-black text-white">Sjåførprofil ikke funnet</h2>
          <p className="text-xs text-slate-400">
            Denne kontoen ({user.email}) har ikke en aktiv sjåførprofil registrert av Aron Taxi administrasjon.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => navigate('/konto')}
              className="w-full py-3 bg-white/5 border border-white/10 text-slate-200 font-bold uppercase text-xs rounded-xl hover:bg-white/10"
            >
              Gå til Kundekonto
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-3 bg-rose-500/10 text-rose-300 font-bold uppercase text-xs rounded-xl hover:bg-rose-500/20"
            >
              Logg ut
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VEHICLE SELECTION SCREEN (IF NO VEHICLE CHOSEN)
  // ==========================================
  if (!currentDriver.vehicleId) {
    const allowedVehicles = vehicles.filter((v) => {
      if (currentDriver.assignedVehicles && currentDriver.assignedVehicles.length > 0) {
        return currentDriver.assignedVehicles.includes(v.id);
      }
      return true;
    });

    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col">
        <header className="h-16 bg-[#111827] border-b border-white/10 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#34D186] text-slate-950 flex items-center justify-center font-black text-sm">
              B
            </div>
            <span className="font-black text-sm tracking-wider uppercase text-white">
              Aron Taxi · Bolt Driver
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="text-xs text-slate-400 hover:text-white"
          >
            Logg ut
          </button>
        </header>

        <main className="flex-1 py-10 px-4 sm:px-6 max-w-4xl w-full mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34D186]/15 border border-[#34D186]/30 text-[#34D186] text-[10px] font-black uppercase tracking-widest">
              <Car className="w-3.5 h-3.5" />
              START VAKT · VELG KJØRETØY
            </div>
            <h1 className="text-3xl font-black text-white">Velg ditt kjøretøy for vakten</h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Velg det autoriserte drosjekjøretøyet du skal betjene. Løyve og bilnummer knyttes til alle dine turer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {allowedVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-[#111827] border border-white/10 hover:border-[#34D186]/60 rounded-3xl overflow-hidden shadow-2xl transition-all flex flex-col group"
              >
                <div className="h-44 w-full bg-slate-900 overflow-hidden relative">
                  <img
                    src={vehicle.imageUrls[0] || OFFICIAL_ASSETS.teslaCars[0]}
                    alt={vehicle.model}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-[#34D186]">
                    100% Elektrisk
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-white">{vehicle.model}</h3>
                        <p className="text-xs text-slate-400">{vehicle.color} · Årsmodell {vehicle.year}</p>
                      </div>
                      <span className="px-3 py-1 bg-black/60 border border-white/10 font-mono text-xs font-black text-[#34D186] rounded-xl">
                        {vehicle.licensePlate}
                      </span>
                    </div>

                    <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Løyvenummer:</span>
                        <span className="font-black text-slate-200 font-mono">{vehicle.permitNumber}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Kapasitet:</span>
                        <span className="font-semibold text-slate-200">{vehicle.seats} Passasjerer</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Rekkevidde:</span>
                        <span className="font-semibold text-slate-200">{vehicle.rangeKm} km</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await selectDriverVehicle(currentDriver.id, vehicle.id);
                      toast.success(`Valgte ${vehicle.model} (${vehicle.licensePlate})!`);
                    }}
                    className="w-full py-3.5 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Velg Dette Kjøretøyet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // DRIVER ACTIONS & HANDLERS
  // ==========================================
  const handleToggleOnline = () => {
    const nextState = !currentDriver.isOnline;
    toggleDriverOnline(currentDriver.id, nextState);
    if (nextState) {
      if (soundEnabled) soundService.playTripAcceptedSound(0.5);
      toast.success('🟢 Du er nå PÅ NETT i Oslo!', {
        description: 'Klar for å motta nye turoppdrag med 85% sjåførutbetaling.'
      });
    } else {
      toast.info('Du er nå FRAKOBLET (Offline).');
    }
  };

  const handleAcceptTrip = async (tripId: string) => {
    const res = await acceptTripAtomic(tripId, currentDriver.id);
    if (res.success) {
      if (soundEnabled) soundService.playTripAcceptedSound(0.8);
      toast.success('Tur godtatt! Følg ruten til henteadressen.');
    } else {
      toast.error(res.error || 'Kunne ikke godta turen.');
    }
  };

  const handleArrivedAtPickup = (tripId: string) => {
    updateTripStatus(tripId, 'driver_arrived');
    if (soundEnabled) soundService.playTripAcceptedSound(0.6);
    toast.success('Du har ankommet henteadressen! Passasjer er varslet.');
  };

  const handleStartTrip = (tripId: string) => {
    updateTripStatus(tripId, 'trip_started');
    if (soundEnabled) soundService.playTripAcceptedSound(0.6);
    toast.success('Turen er startet! God kjøretur til destinasjonen.');
  };

  const handleCompleteTrip = (trip: Trip) => {
    updateTripStatus(trip.id, 'completed');
    if (soundEnabled) soundService.playTripCompletedSound(0.8);
    setActiveTripSummary(trip);
    toast.success('Turen er fullført! Oppgjør er overført.');
  };

  const handleRejectTrip = async (tripId: string) => {
    if (currentDriver) {
      await rejectTrip(tripId, currentDriver.id);
      toast.info('Turforespørsel avvist.');
    }
  };

  const handleTriggerEmergency = async (reason?: string) => {
    if (!currentDriver?.id) return;
    setEmergencySending(true);
    try {
      await triggerEmergencyAlert(
        currentDriver.id,
        reason || 'Taus nødvarsel utløst fra sjåførkonsoll'
      );
      setEmergencySuccessMessage('Taus nødvarsel sendt til sentralen. Sanntids GPS-posisjon og turdetaljer deles.');
      toast.error('🚨 Nødvarsel aktivert: Sentralen er varslet!', {
        description: 'Din nøyaktige posisjon og turdetaljer spores nå i sanntid av sentralen.'
      });
      setTimeout(() => {
        setShowEmergencyModal(false);
        setEmergencySending(false);
      }, 1500);
    } catch (err: any) {
      toast.error('Kunne ikke sende nødvarsel. Ring 112 om det er akutt fare.');
      setEmergencySending(false);
    }
  };

  // Launch external GPS navigation (Google Maps / Waze / Apple Maps)
  const openExternalNavigation = (destAddress: string, lat?: number, lng?: number) => {
    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(destAddress);
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    window.open(googleUrl, '_blank');
  };

  // Format waiting timer as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#F8FAFC] flex flex-col select-none overflow-x-hidden">
      
      {/* ========================================== */}
      {/* BOLT DRIVER TOP HEADER BAR */}
      {/* ========================================== */}
      <header className="h-16 bg-[#111827]/95 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 backdrop-blur-xl">
        
        {/* LEFT: PROFILE & MENU */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all cursor-pointer"
            aria-label="Åpne meny"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#34D186] to-[#1EA864] text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
              {currentDriver.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="hidden xs:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">{currentDriver.name}</span>
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded-md">
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                  {currentDriver.rating ? currentDriver.rating.toFixed(2) : '4.98'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {currentDriver.vehiclePlate || 'EK 98765'} · {currentDriver.permitNumber || 'Løyve OS 10597'}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: TODAY EARNINGS PILL */}
        <button
          onClick={() => setActiveTab('earnings')}
          className="px-3.5 py-1.5 rounded-full bg-[#182232] border border-white/10 hover:border-[#34D186]/50 text-xs font-black text-white flex items-center gap-2 transition-all cursor-pointer shadow-inner"
        >
          <span className="text-[#34D186] font-extrabold">{currentDriver.todayEarnings || 0} kr</span>
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">• {myCompletedTrips.length} turer</span>
        </button>

        {/* RIGHT: EMERGENCY SOS, SOUND, ONLINE/OFFLINE */}
        <div className="flex items-center gap-2">
          
          {/* QUICK-ACCESS EMERGENCY SOS BUTTON */}
          <button
            onClick={() => setShowEmergencyModal(true)}
            className={`px-3 py-2 rounded-2xl border font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              myActiveAlert
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse ring-2 ring-rose-500/50'
                : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300'
            }`}
            title="Nødvarsel / Taus alarm til sentralen"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="font-black text-[11px]">SOS</span>
          </button>

          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) soundService.playTripRequestChime(0.6);
            }}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
            title={soundEnabled ? 'Lydvarsel på' : 'Lydvarsel av'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleOnline}
            className={`px-4 sm:px-5 py-2 rounded-full font-black text-[11px] uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
              currentDriver.isOnline
                ? 'bg-[#34D186] hover:bg-[#2EB875] text-slate-950 shadow-[#34D186]/30 ring-2 ring-[#34D186]/50'
                : 'bg-[#182232] hover:bg-[#223046] text-slate-300 border border-white/15'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{currentDriver.isOnline ? 'PÅ NETT' : 'FRAKOBLET'}</span>
          </button>
        </div>
      </header>

      {/* ========================================== */}
      {/* SLIDE-OVER DRAWER MENU (BOLT STYLE) */}
      {/* ========================================== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-80 max-w-full bg-[#111827] border-r border-white/10 h-full flex flex-col justify-between p-6 z-10 shadow-2xl">
            <div className="space-y-6">
              
              {/* DRIVER INFO CARD */}
              <div className="flex justify-between items-start pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#34D186] text-slate-950 font-black flex items-center justify-center text-lg shadow-lg">
                    {currentDriver.name[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">{currentDriver.name}</h3>
                    <p className="text-[11px] text-slate-400">{currentDriver.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                        ⭐ {currentDriver.rating?.toFixed(2) || '4.98'}
                      </span>
                      <span className="text-[10px] font-bold text-[#34D186] bg-[#34D186]/10 px-1.5 py-0.5 rounded">
                        98% Aksept
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* NAVIGATION MENU */}
              <nav className="space-y-1.5">
                {[
                  { id: 'drive', label: 'Kjøring / Kart', icon: Navigation },
                  { id: 'earnings', label: 'Inntekt & Oppgjør', icon: TrendingUp },
                  { id: 'trips', label: `Turer & Historikk (${myCompletedTrips.length})`, icon: History },
                  { id: 'hotspots', label: 'Etterspørsel / Varmekart', icon: Flame },
                  { id: 'vehicle', label: 'Mitt Kjøretøy', icon: Car },
                  { id: 'profile', label: 'Sjåførprofil & Løyve', icon: User },
                  { id: 'settings', label: 'Innstillinger', icon: Settings }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#34D186] text-slate-950 shadow-md'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* LOGOUT & APP VERSION */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  logout();
                  navigate('/');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logg ut av sjåførkonto</span>
              </button>
              <p className="text-[10px] text-slate-500 text-center font-mono">
                Aron Taxi Bolt Driver v3.0 (Oslo)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MAIN SCREEN BODY BASED ON TAB */}
      {/* ========================================== */}
      <main className="flex-1 relative flex flex-col">
        
        {/* TAB 1: LIVE DRIVE / MAP (BOLT DRIVER HOMESCREEN) */}
        {activeTab === 'drive' && (
          <div className="relative flex-1 w-full min-h-[calc(100vh-128px)] sm:min-h-[calc(100vh-64px)] flex flex-col">
            
            {/* FULL SCREEN INTERACTIVE LEAFLET MAP */}
            <div className="absolute inset-0 z-0">
              <LeafletMap
                pickup={activeTrip?.pickup || pendingTrips[0]?.pickup}
                destination={activeTrip?.destination || pendingTrips[0]?.destination}
                driverLocation={currentDriver.currentLocation}
                routeGeometry={activeTrip?.routeGeometry || pendingTrips[0]?.routeGeometry}
                hotspots={OSLO_HOTSPOTS}
                showHotspots={showHotspots}
                centerLat={currentDriver.currentLocation?.lat || 59.9139}
                centerLng={currentDriver.currentLocation?.lng || 10.7522}
                zoom={13}
                className="w-full h-full"
              />
            </div>

            {/* FLOATING QUICK CONTROLS (TOP RIGHT ON MAP) */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              
              {/* QUICK-ACCESS EMERGENCY SOS BUTTON */}
              <button
                onClick={() => setShowEmergencyModal(true)}
                className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-md transition-all cursor-pointer ${
                  myActiveAlert
                    ? 'bg-rose-600 text-white border-rose-400 animate-pulse ring-4 ring-rose-500/40'
                    : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-400'
                }`}
                title="Send Nødvarsel / SOS til Sentralen"
              >
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </button>

              {/* HOTSPOTS TOGGLE */}
              <button
                onClick={() => setShowHotspots(!showHotspots)}
                className={`p-3 rounded-2xl border shadow-xl backdrop-blur-md transition-all cursor-pointer ${
                  showHotspots ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : 'bg-[#111827]/90 text-slate-300 border-white/10'
                }`}
                title="Varmekart / Etterspørsel"
              >
                <Flame className="w-5 h-5" />
              </button>

              {/* AUTO-ACCEPT TOGGLE */}
              <button
                onClick={() => {
                  const next = !autoAccept;
                  setAutoAccept(next);
                  toast.info(next ? '⚡ Auto-godta turer aktivert' : 'Auto-godta deaktivert');
                }}
                className={`p-3 rounded-2xl border shadow-xl backdrop-blur-md transition-all cursor-pointer ${
                  autoAccept ? 'bg-[#34D186] text-slate-950 border-[#34D186]' : 'bg-[#111827]/90 text-slate-300 border-white/10'
                }`}
                title={autoAccept ? 'Auto-aksept: PÅ' : 'Auto-aksept: AV'}
              >
                <Zap className="w-5 h-5" />
              </button>
            </div>

            {/* FLOATING TOP STATUS BANNER */}
            <div className="absolute top-4 left-4 right-16 sm:right-auto sm:w-96 z-20">
              {!currentDriver.isOnline ? (
                <div className="bg-[#111827]/95 border border-amber-500/40 rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                      <Power className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Du er Frakoblet</p>
                      <p className="text-[10px] text-slate-400">Gå på nett for å motta turer</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleOnline}
                    className="px-4 py-2 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer"
                  >
                    Gå På Nett
                  </button>
                </div>
              ) : !activeTrip ? (
                <div className="bg-[#111827]/95 border border-[#34D186]/40 rounded-3xl p-3.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-[#34D186] animate-ping absolute inset-0" />
                      <div className="w-3 h-3 rounded-full bg-[#34D186] relative" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">🟢 Søker etter turer...</p>
                      <p className="text-[10px] text-[#34D186]">Høy etterspørsel i Oslo Sentrum</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{pendingTrips.length} i kø</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ========================================== */}
            {/* BOTTOM FLOATING LAYER: ACTIVE TRIP OR INCOMING RIDE */}
            {/* ========================================== */}
            <div className="mt-auto p-3 sm:p-6 z-20 max-w-lg w-full mx-auto space-y-3 pb-20 sm:pb-6">
              
              {/* CASE A: ACTIVE TRIP IN PROGRESS (BOLT 4-STEP STATE MACHINE) */}
              {activeTrip ? (
                <div className="bg-[#111827]/98 border-2 border-[#34D186] rounded-3xl p-5 shadow-2xl backdrop-blur-2xl space-y-4">
                  
                  {/* STEP INDICATOR HEADER */}
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#34D186] animate-pulse" />
                      <span className="text-xs font-black tracking-wider text-[#34D186] uppercase">
                        {activeTrip.status === 'driver_assigned' && '1. KJØR TIL HENTESTED'}
                        {activeTrip.status === 'driver_arrived' && '2. VENTER PÅ PASSASJER'}
                        {activeTrip.status === 'trip_started' && '3. TUR PÅGÅR TIL DESTINASJON'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-300">
                      {activeTrip.id}
                    </span>
                  </div>

                  {/* PASSENGER & ROUTE DETAILS */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#34D186]/15 border border-[#34D186]/40 flex items-center justify-center text-[#34D186] font-black text-sm">
                          {activeTrip.customerName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">{activeTrip.customerName}</p>
                          <p className="text-[10px] text-slate-400">{activeTrip.passengers} passasjerer · {activeTrip.luggage} kolli</p>
                        </div>
                      </div>

                      {/* CALL & SMS BUTTONS */}
                      <div className="flex gap-2">
                        {activeTrip.customerPhone && (
                          <a
                            href={`tel:${activeTrip.customerPhone}`}
                            className="p-2.5 bg-[#34D186] text-slate-950 rounded-xl font-bold flex items-center justify-center shadow-md hover:bg-[#2EB875]"
                            title="Ring kunde"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* ROUTE BOX */}
                    <div className="p-3.5 bg-black/50 rounded-2xl border border-white/5 space-y-2.5 text-xs">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-[#34D186] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-[9px] uppercase font-black text-slate-500 block">Hentested</span>
                          <span className="text-white font-bold leading-tight">{activeTrip.pickup.address}</span>
                        </div>
                        {activeTrip.status === 'driver_assigned' && (
                          <button
                            onClick={() => openExternalNavigation(activeTrip.pickup.address, activeTrip.pickup.lat, activeTrip.pickup.lng)}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#34D186] text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0"
                          >
                            <Navigation className="w-3 h-3" />
                            GPS
                          </button>
                        )}
                      </div>

                      <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                        <Navigation className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-[9px] uppercase font-black text-slate-500 block">Destinasjon</span>
                          <span className="text-white font-bold leading-tight">{activeTrip.destination.address}</span>
                        </div>
                        {activeTrip.status === 'trip_started' && (
                          <button
                            onClick={() => openExternalNavigation(activeTrip.destination.address, activeTrip.destination.lat, activeTrip.destination.lng)}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#34D186] text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0"
                          >
                            <Navigation className="w-3 h-3" />
                            GPS
                          </button>
                        )}
                      </div>
                    </div>

                    {/* FINANCIALS & DISTANCE */}
                    <div className="flex justify-between items-center text-xs px-2 py-1 bg-[#182232] rounded-xl">
                      <span className="text-slate-400">Avstand: <strong className="text-white">{activeTrip.distanceKm} km</strong></span>
                      <span className="text-slate-400">Pris: <strong className="text-[#34D186] font-mono text-sm">{activeTrip.estimatedPrice} kr</strong></span>
                      <span className="text-slate-400">Din andel (85%): <strong className="text-[#34D186]">{Math.round(activeTrip.estimatedPrice * 0.85)} kr</strong></span>
                    </div>

                    {/* WAITING TIMER IN STEP 2 */}
                    {activeTrip.status === 'driver_arrived' && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                          <span className="text-amber-300 font-bold">Ventetid på kunde:</span>
                        </div>
                        <span className="font-mono text-sm font-black text-amber-400">
                          {formatTime(waitingSeconds)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ACTIVE ACTION BUTTONS */}
                  <div className="pt-1">
                    {activeTrip.status === 'driver_assigned' && (
                      <button
                        onClick={() => handleArrivedAtPickup(activeTrip.id)}
                        className="w-full py-4 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Jeg Har Ankommet Hentested
                      </button>
                    )}

                    {activeTrip.status === 'driver_arrived' && (
                      <button
                        onClick={() => handleStartTrip(activeTrip.id)}
                        className="w-full py-4 bg-gradient-to-r from-[#34D186] to-emerald-400 hover:brightness-110 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Navigation className="w-5 h-5" />
                        Start Tur Med Passasjer
                      </button>
                    )}

                    {activeTrip.status === 'trip_started' && (
                      <button
                        onClick={() => handleCompleteTrip(activeTrip)}
                        className="w-full py-4 bg-gradient-to-r from-emerald-400 via-[#34D186] to-teal-400 hover:brightness-110 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Fullfør Tur & Registrer Oppgjør
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                /* CASE B: INCOMING RIDE REQUEST POPUP (BOLT STYLE MODAL) */
                currentDriver.isOnline && pendingTrips.length > 0 && (
                  <div className="bg-[#111827]/98 border-2 border-[#34D186] rounded-3xl p-5 shadow-2xl backdrop-blur-2xl space-y-4 animate-slide-up">
                    
                    {/* COUNTDOWN PROGRESS BAR */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-[#34D186] text-slate-950 rounded-full font-black text-[10px] uppercase animate-pulse">
                            NY FORESPØRSEL
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">{pendingTrips[0].id}</span>
                        </div>
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          {incomingCountdown}s gjenstår
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#34D186] transition-all duration-1000"
                          style={{ width: `${(incomingCountdown / 15) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* BIG FARE & EARNINGS */}
                    <div className="flex justify-between items-end bg-black/40 p-3.5 rounded-2xl border border-white/5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Totalpris</span>
                        <span className="text-2xl font-black text-white">{pendingTrips[0].estimatedPrice} kr</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#34D186] block">Din Nettofortjeneste (85%)</span>
                        <span className="text-xl font-black text-[#34D186]">
                          {Math.round(pendingTrips[0].estimatedPrice * 0.85)} kr
                        </span>
                      </div>
                    </div>

                    {/* ROUTE PREVIEW */}
                    <div className="space-y-2 text-xs bg-black/30 p-3.5 rounded-2xl border border-white/5">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-[#34D186] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Hentested</span>
                          <p className="text-white font-bold leading-tight">{pendingTrips[0].pickup.address}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                        <Navigation className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Destinasjon</span>
                          <p className="text-white font-bold leading-tight">{pendingTrips[0].destination.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* TRIP METRICS */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Avstand</span>
                        <span className="font-bold text-white">{pendingTrips[0].distanceKm} km</span>
                      </div>
                      <div className="p-2 bg-white/5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Kjøretid</span>
                        <span className="font-bold text-white">{pendingTrips[0].durationMinutes} min</span>
                      </div>
                      <div className="p-2 bg-white/5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Passasjer</span>
                        <span className="font-bold text-white">{pendingTrips[0].passengers} pers</span>
                      </div>
                    </div>

                    {/* ACCEPT / DECLINE BUTTONS */}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => handleAcceptTrip(pendingTrips[0].id)}
                        className="flex-1 py-4 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Check className="w-5 h-5" />
                        GODTA TUR
                      </button>
                      <button
                        onClick={() => handleRejectTrip(pendingTrips[0].id)}
                        className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 font-bold text-xs uppercase rounded-2xl cursor-pointer"
                      >
                        Avslå
                      </button>
                    </div>

                  </div>
                )
              )}

            </div>

          </div>
        )}

        {/* TAB 2: INNTEKT & OPPGJØR (EARNINGS & REVENUE) */}
        {activeTab === 'earnings' && (
          <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6 pb-24">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Inntekt & Oppgjør</h1>
                <p className="text-xs text-slate-400">
                  85% sjåførutbetaling · 100% tips rett til din konto
                </p>
              </div>
              <button
                onClick={() => setActiveTab('drive')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-[#34D186]"
              >
                Tilbake til Kart
              </button>
            </div>

            {/* REVENUE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-2">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">I Dag</span>
                <h2 className="text-3xl font-black text-[#34D186]">{currentDriver.todayEarnings || 0} kr</h2>
                <p className="text-[11px] text-slate-400">{myCompletedTrips.length} fullførte turer</p>
              </div>

              <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-2">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Denne Uken</span>
                <h2 className="text-3xl font-black text-white">{currentDriver.weekEarnings || 0} kr</h2>
                <p className="text-[11px] text-slate-400">Automatisk bankutbetaling hver mandag</p>
              </div>

              <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-2">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Mottatt Drikkepenger</span>
                <h2 className="text-3xl font-black text-emerald-400">{currentDriver.tips || 0} kr</h2>
                <p className="text-[11px] text-slate-400">0% provisjon på drikkepenger</p>
              </div>
            </div>

            {/* 85% PROVISJONSMODELL */}
            <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#34D186]">
                <Percent className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Gjennomsiktig Provisjonsmodell</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hos Aron Taxi beholder sjåføren <strong>85% av brutto taksameterbeløp</strong> på alle turer, mens 15% går til administrasjon, kundestøtte og appdrift. Alle tips utbetales 100% uavkortet til sjåføren.
              </p>
            </div>

            {/* BONUS CAMPAIGNS */}
            <div className="bg-gradient-to-br from-[#111827] to-[#182638] border border-[#34D186]/30 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-[#34D186]">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase text-white">Aktive Sjåførbonuser</h3>
                </div>
                <span className="px-3 py-1 bg-[#34D186]/20 text-[#34D186] text-[10px] font-black rounded-full">
                  AKTIV
                </span>
              </div>
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">Helge-rushet i Oslo</h4>
                  <p className="text-[11px] text-slate-400">Kjør 8 turer mellom 20:00 og 04:00 for ekstra bonus</p>
                </div>
                <span className="text-sm font-black text-[#34D186]">+350 kr</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TURER & HISTORIKK (TRIP HISTORY & AVAILABLE POOL) */}
        {activeTab === 'trips' && (
          <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6 pb-24">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Turoversikt</h1>
                <p className="text-xs text-slate-400">
                  {pendingTrips.length} ledige i pool · {myCompletedTrips.length} fullførte oppdrag
                </p>
              </div>
              <button
                onClick={() => setActiveTab('drive')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-[#34D186]"
              >
                Tilbake til Kart
              </button>
            </div>

            {/* SECTION 1: AVAILABLE POOL TRIPS */}
            {pendingTrips.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#34D186]">
                  Ledige Turer i Oslo ({pendingTrips.length})
                </h3>
                <div className="space-y-3">
                  {pendingTrips.map((t) => (
                    <div
                      key={t.id}
                      className="bg-[#111827] border border-[#34D186]/40 hover:border-[#34D186] rounded-3xl p-5 shadow-xl space-y-3 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-black text-[#34D186]">{t.id}</span>
                          <p className="text-xs text-slate-300 font-bold mt-0.5">{t.customerName}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-white">{t.estimatedPrice} kr</span>
                          <span className="block text-[10px] text-[#34D186]">85% netto: {Math.round(t.estimatedPrice * 0.85)} kr</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-black/40 p-3 rounded-2xl border border-white/5">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Fra</span>
                          <span className="text-slate-200 font-semibold">{t.pickup.address}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Til</span>
                          <span className="text-slate-200 font-semibold">{t.destination.address}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xs text-slate-400">{t.distanceKm} km · {t.durationMinutes} min</span>
                        <button
                          onClick={() => {
                            handleAcceptTrip(t.id);
                            setActiveTab('drive');
                          }}
                          className="px-5 py-2 bg-[#34D186] text-slate-950 font-black uppercase text-xs rounded-xl shadow-md hover:bg-[#2EB875]"
                        >
                          Godta Tur
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: COMPLETED TRIPS */}
            <div className="space-y-3 pt-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Fullførte Oppdrag ({myCompletedTrips.length})
              </h3>
              {myCompletedTrips.length === 0 ? (
                <div className="bg-[#111827] border border-white/10 rounded-3xl p-12 text-center space-y-3">
                  <History className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">Ingen fullførte turer ennå</p>
                  <p className="text-xs text-slate-500">Når du fullfører oppdrag vil turkvitteringer vises her.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myCompletedTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="bg-[#111827] border border-white/10 rounded-3xl p-5 space-y-3"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <div>
                          <span className="font-mono text-xs font-bold text-white">{trip.id}</span>
                          <span className="text-[10px] text-slate-400 ml-2">
                            {new Date(trip.completedAt || trip.updatedAt).toLocaleString('no-NO')}
                          </span>
                        </div>
                        <span className="text-sm font-black text-[#34D186]">
                          +{Math.round((trip.finalPrice || trip.estimatedPrice) * 0.85)} kr
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1">
                        <p><strong className="text-slate-400">Fra:</strong> {trip.pickup.address}</p>
                        <p><strong className="text-slate-400">Til:</strong> {trip.destination.address}</p>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-white/5">
                        <span>Totalpris: {trip.finalPrice || trip.estimatedPrice} kr</span>
                        <span>Tips: {trip.tip || 0} kr</span>
                        <span>{trip.vehicleModel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ETTERSPØRSEL & VARMEKART (HOTSPOTS) */}
        {activeTab === 'hotspots' && (
          <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6 pb-24">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Etterspørsel & Varmekart</h1>
                <p className="text-xs text-slate-400">
                  Områder med høy etterspørsel og surge-priser i Oslo
                </p>
              </div>
              <button
                onClick={() => setActiveTab('drive')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-[#34D186]"
              >
                Tilbake til Kart
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OSLO_HOTSPOTS.map((h) => (
                <div
                  key={h.id}
                  className="bg-[#111827] border border-white/10 hover:border-amber-500/50 rounded-3xl p-5 space-y-3 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">{h.category}</span>
                      <h3 className="text-sm font-black text-white">{h.name}</h3>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-black text-xs rounded-xl">
                      {h.surge} SURGE
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-white/5">
                    <span>Høy passasjerfrekvens</span>
                    <button
                      onClick={() => {
                        openExternalNavigation(h.name, h.lat, h.lng);
                      }}
                      className="text-[#34D186] font-bold hover:underline flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      Naviger dit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: KJØRETØY & DRIFT (VEHICLE & COMPLIANCE) */}
        {activeTab === 'vehicle' && (
          <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6 pb-24">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Mitt Kjøretøy</h1>
                <p className="text-xs text-slate-400">
                  Aktiv drosjebil og løyvedetaljer
                </p>
              </div>
              <button
                onClick={() => setActiveTab('drive')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-[#34D186]"
              >
                Tilbake til Kart
              </button>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-black text-[#34D186] uppercase tracking-widest block">
                    AKTIV BIL FOR VAKTEN
                  </span>
                  <h2 className="text-2xl font-black text-white">
                    {currentDriver.vehicleName || 'Tesla Model Y Long Range'}
                  </h2>
                </div>
                <span className="px-4 py-2 bg-black/60 border border-white/10 font-mono text-sm font-black text-[#34D186] rounded-2xl">
                  {currentDriver.vehiclePlate || 'EK 98765'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-slate-400 block mb-1">Løyvenummer</span>
                  <span className="font-black text-white font-mono text-sm">{currentDriver.permitNumber || 'OS 10597'}</span>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-slate-400 block mb-1">Kjøreseddel</span>
                  <span className="font-black text-white font-mono text-sm">{currentDriver.licenseNumber}</span>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-slate-400 block mb-1">Drivlinje</span>
                  <span className="font-black text-[#34D186] text-sm">100% Elektrisk</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={async () => {
                    await selectDriverVehicle(currentDriver.id, '');
                    toast.info('Kjøretøy tilbakestilt. Velg bil på nytt.');
                  }}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs rounded-2xl cursor-pointer"
                >
                  Bytt Kjøretøy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SJÅFØRPROFIL */}
        {activeTab === 'profile' && (
          <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6 pb-24">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Sjåførprofil</h1>
                <p className="text-xs text-slate-400">
                  Offisielle kontoopplysninger og drosjesertifisering
                </p>
              </div>
              <button
                onClick={() => setActiveTab('drive')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-[#34D186]"
              >
                Tilbake til Kart
              </button>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Fullt Navn:</span>
                <span className="font-bold text-white">{currentDriver.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">E-post:</span>
                <span className="font-semibold text-white">{currentDriver.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Telefon:</span>
                <span className="font-semibold text-white">{currentDriver.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Sjåfør ID:</span>
                <span className="font-mono text-white">{currentDriver.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Løyvenummer:</span>
                <span className="font-mono font-bold text-[#34D186]">{currentDriver.permitNumber || 'OS 10597'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Kjøreseddel Gyldighet:</span>
                <span className="font-bold text-emerald-400">Gyldig til 2028 (Godkjent)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: INNSTILLINGER */}
        {activeTab === 'settings' && (
          <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6 pb-24">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Innstillinger</h1>
                <p className="text-xs text-slate-400">
                  Bolt Driver preferanser og navigasjonsvalg
                </p>
              </div>
              <button
                onClick={() => setActiveTab('drive')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-[#34D186]"
              >
                Tilbake til Kart
              </button>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-white">Lydvarsel ved nye turer</h4>
                  <p className="text-[11px] text-slate-400">Spiller av taksilyd når nye turoppdrag mottas</p>
                </div>
                <button
                  onClick={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    if (next) soundService.playTripRequestChime(0.8);
                  }}
                  className={`p-2.5 rounded-xl border ${soundEnabled ? 'bg-[#34D186] text-slate-950 border-[#34D186]' : 'bg-white/5 text-slate-400 border-white/10'}`}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-white">Auto-aksept modus</h4>
                  <p className="text-[11px] text-slate-400">Godtar innkommende turer automatisk</p>
                </div>
                <button
                  onClick={() => setAutoAccept(!autoAccept)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${autoAccept ? 'bg-[#34D186] text-slate-950' : 'bg-white/5 text-slate-400'}`}
                >
                  {autoAccept ? 'PÅ' : 'AV'}
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => soundService.playTripRequestChime(0.85)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-xl text-slate-300"
                >
                  Test Lydsignal
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================== */}
      {/* BOLT BOTTOM TAB BAR (MOBILE & DESKTOP STICKY) */}
      {/* ========================================== */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#111827]/98 border-t border-white/10 px-4 flex items-center justify-around z-40 backdrop-blur-xl">
        {[
          { id: 'drive', label: 'Kjøring', icon: Navigation },
          { id: 'earnings', label: 'Inntekt', icon: TrendingUp },
          { id: 'trips', label: 'Turer', icon: History, badge: pendingTrips.length > 0 ? pendingTrips.length : undefined },
          { id: 'hotspots', label: 'Varmekart', icon: Flame },
          { id: 'vehicle', label: 'Bil & Profil', icon: Car }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
                isActive ? 'text-[#34D186]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
              {tab.badge && (
                <span className="absolute -top-1 right-2 px-1.5 py-0.2 bg-[#34D186] text-slate-950 font-black text-[9px] rounded-full animate-bounce">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ========================================== */}
      {/* POST-TRIP SUMMARY & PASSENGER RATING MODAL */}
      {/* ========================================== */}
      {activeTripSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111827] border-2 border-[#34D186] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-scale-up">
            
            <div className="w-16 h-16 bg-[#34D186]/20 border border-[#34D186]/40 rounded-full flex items-center justify-center mx-auto text-[#34D186]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest text-[#34D186] uppercase">
                TUR FULLFØRT
              </span>
              <h2 className="text-2xl font-black text-white">
                Oppgjør Registrert
              </h2>
            </div>

            {/* RECEIPT BREAKDOWN */}
            <div className="p-4 bg-black/50 rounded-2xl border border-white/5 space-y-2 text-xs text-left">
              <div className="flex justify-between text-slate-400">
                <span>Bruttopris:</span>
                <span className="text-white font-bold">{activeTripSummary.finalPrice || activeTripSummary.estimatedPrice} kr</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Din Andel (85%):</span>
                <span className="text-[#34D186] font-black text-sm">
                  {Math.round((activeTripSummary.finalPrice || activeTripSummary.estimatedPrice) * 0.85)} kr
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Aron Taxi gebyr (15%):</span>
                <span className="text-slate-400">
                  {Math.round((activeTripSummary.finalPrice || activeTripSummary.estimatedPrice) * 0.15)} kr
                </span>
              </div>
            </div>

            {/* RATE THE PASSENGER */}
            <div className="space-y-2 text-left pt-2 border-t border-white/10">
              <span className="text-[11px] font-bold text-slate-300 block text-center">
                Gi vurdering til passasjer ({activeTripSummary.customerName})
              </span>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setPassengerRating(star)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= passengerRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveTripSummary(null)}
              className="w-full py-4 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black uppercase text-xs rounded-2xl shadow-xl transition-all cursor-pointer"
            >
              Klar for Neste Tur
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* QUICK-ACCESS EMERGENCY SOS / NØDVARSEL MODAL */}
      {/* ========================================== */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
          <div className="bg-[#131B2A] border-2 border-rose-500 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center mx-auto text-rose-500 animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                Nødvarsel & Sikkerhet
              </h2>
              <p className="text-xs text-slate-300">
                Utløser en taus alarm til Aron Taxi sin sentral med sanntids GPS-posisjon, turdetaljer og passasjerdata.
              </p>
            </div>

            {myActiveAlert && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
                <Radio className="w-5 h-5 text-rose-400 animate-ping shrink-0" />
                <div>
                  <span className="font-bold block">🚨 Aktivt nødvarsel registrert</span>
                  <span className="text-[11px] text-slate-300">Sentralen sporer din bil ({currentDriver.vehiclePlate || 'Drosje'}) i sanntid.</span>
                </div>
              </div>
            )}

            {/* QUICK SILENT DISPATCH TRIGGER */}
            <div className="space-y-3 pt-2">
              <button
                disabled={emergencySending}
                onClick={() => handleTriggerEmergency('Taus alarm: Sjåfør i potensiell fare')}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <ShieldAlert className="w-5 h-5" />
                {emergencySending ? 'Sender nødvarsel...' : 'SEND TAUS ALARM TIL SENTRAL'}
              </button>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  disabled={emergencySending}
                  onClick={() => handleTriggerEmergency('Kunde urolig / truende oppførsel')}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold rounded-xl text-center cursor-pointer"
                >
                  ⚠️ Truende Passasjer
                </button>
                <button
                  disabled={emergencySending}
                  onClick={() => handleTriggerEmergency('Trafikkulykke / Kollisjon')}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold rounded-xl text-center cursor-pointer"
                >
                  🚗 Ulykke / Kollisjon
                </button>
              </div>

              {/* POLICE DIRECT CALL */}
              <div className="pt-2 border-t border-white/10 flex gap-2">
                <a
                  href="tel:112"
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-rose-400" />
                  Ring Politi (112)
                </a>
                <a
                  href="tel:113"
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Ring Medisinsk (113)
                </a>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200 font-bold underline cursor-pointer"
              >
                Lukk vindu
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
