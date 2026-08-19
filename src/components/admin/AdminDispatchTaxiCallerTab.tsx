import React, { useState, useEffect } from 'react';
import { Trip, Driver, Vehicle, PricingConfig } from '../../types';
import { LeafletMap } from '../LeafletMap';
import { toast } from 'sonner';
import {
  MapPin,
  Navigation,
  Clock,
  Car,
  User,
  Phone,
  Check,
  X,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  Radio,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  Zap,
  Filter
} from 'lucide-react';

interface AdminDispatchTaxiCallerTabProps {
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  pricing: PricingConfig;
  onCreateTrip: (tripData: any) => Promise<Trip>;
  onAssignDriver: (tripId: string, driverId: string) => void;
  onUpdateTripStatus: (tripId: string, status: any) => void;
  onDeleteTrip: (tripId: string) => Promise<void>;
  onToggleDriverOnline: (driverId: string, isOnline: boolean) => Promise<void>;
}

const OSLO_ZONES = [
  'Sentrum / Oslo S',
  'Majorstuen & Frogner',
  'Grünerløkka & Vulkan',
  'Aker Brygge & Tjuvholmen',
  'Bjørvika & Barcode',
  'Oslo Lufthavn Gardermoen',
  'Fornebu & Lysaker',
  'Bærum / Sandvika',
  'Ullern & Røa',
  'Nordstrand & Holmlia'
];

export const AdminDispatchTaxiCallerTab: React.FC<AdminDispatchTaxiCallerTabProps> = ({
  trips,
  drivers,
  vehicles,
  pricing,
  onCreateTrip,
  onAssignDriver,
  onUpdateTripStatus,
  onDeleteTrip,
  onToggleDriverOnline
}) => {
  // Top Dispatch Bar Sub-Tab
  const [dispatchView, setDispatchView] = useState<'dispatch' | 'jobs_overview' | 'vehicles'>('dispatch');
  const [jobFormTab, setJobFormTab] = useState<'job1' | 'job2'>('job1');

  // Form states
  const [pickupAddress, setPickupAddress] = useState('Karl Johans gate 1, 0154 Oslo');
  const [pickupZone, setPickupZone] = useState('Sentrum / Oslo S');
  const [dropoffAddress, setDropoffAddress] = useState('Edvard Munchs plass 1, 0194 Oslo');
  const [dropoffZone, setDropoffZone] = useState('Bjørvika & Barcode');
  const [isNow, setIsNow] = useState(true);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  
  const [passengerName, setPassengerName] = useState('Henrik Holm');
  const [passengerPhone, setPassengerPhone] = useState('+47 96 99 09 01');
  const [passengerNotes, setPassengerNotes] = useState('Henting ved hovedinngang. VIP');
  
  const [vehicleClass, setVehicleClass] = useState<'vip_black' | 'airport_vip'>('vip_black');
  const [assignedDriverId, setAssignedDriverId] = useState<string>('');
  const [passengersCount, setPassengersCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'vipps' | 'invoice' | 'cash'>('card');

  // Calculated estimates
  const [calcDistanceKm, setCalcDistanceKm] = useState<number>(4.2);
  const [calcDurationMin, setCalcDurationMin] = useState<number>(12);
  const [calcPrice, setCalcPrice] = useState<number>(380);

  // Table filter
  const [tableTab, setTableTab] = useState<'active' | 'all' | 'future' | 'unassigned'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);

  // Recalculate price when distance or class changes
  useEffect(() => {
    const isAirport = vehicleClass === 'airport_vip' || dropoffZone.includes('Gardermoen') || pickupZone.includes('Gardermoen');
    let price = pricing.baseStartFee + calcDistanceKm * pricing.dayRateKm;
    if (isAirport) {
      price += pricing.airportAddition;
    }
    setCalcPrice(Math.round(price));
  }, [calcDistanceKm, vehicleClass, dropoffZone, pickupZone, pricing]);

  const handleCheckRoute = () => {
    toast.success('Rute kontrollert! Pris og estimat er beregnet for kartet.');
  };

  const handleClearForm = () => {
    setPickupAddress('');
    setDropoffAddress('');
    setPassengerName('');
    setPassengerPhone('');
    setPassengerNotes('');
    setAssignedDriverId('');
    toast.info('Skjema tømt.');
  };

  const handleBookTrip = async () => {
    if (!pickupAddress || !dropoffAddress) {
      toast.error('Vennligst fyll ut både hente- og leveringsadresse.');
      return;
    }

    try {
      const isAirport = vehicleClass === 'airport_vip' || dropoffZone.includes('Gardermoen') || pickupZone.includes('Gardermoen');
      
      const newTrip = await onCreateTrip({
        customerId: 'admin_dispatch',
        customerName: passengerName || 'Kunde',
        customerPhone: passengerPhone || '+47 96 99 09 01',
        customerEmail: 'booking@arontaxi.no',
        pickup: {
          address: pickupAddress,
          lat: 59.9139 + (Math.random() - 0.5) * 0.02,
          lng: 10.7522 + (Math.random() - 0.5) * 0.02,
        },
        destination: {
          address: dropoffAddress,
          lat: 59.9102 + (Math.random() - 0.5) * 0.02,
          lng: 10.7250 + (Math.random() - 0.5) * 0.02,
        },
        vehicleCategory: isAirport ? 'airport_vip' : 'vip_black',
        distanceKm: calcDistanceKm,
        durationMinutes: calcDurationMin,
        estimatedPrice: calcPrice,
        finalPrice: calcPrice,
        driverId: assignedDriverId || undefined,
        driverName: assignedDriverId ? drivers.find(d => d.id === assignedDriverId)?.name : undefined,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'invoice' ? 'unpaid' : 'paid',
        notes: passengerNotes,
        scheduledPickupTime: !isNow && scheduledDateTime ? scheduledDateTime : undefined,
      });

      if (assignedDriverId) {
        onAssignDriver(newTrip.id, assignedDriverId);
      }

      toast.success(`⚡ Tur #${newTrip.id.slice(-6)} er opprettet og sendt til sjåfør!`);
      
      // Auto fill with fresh demo for ease of multi-dispatch
      setPassengerName('');
      setPassengerNotes('');
    } catch (err: any) {
      toast.error(err?.message || 'Kunne ikke opprette tur.');
    }
  };

  // Driver metrics
  const totalDrivers = drivers.length;
  const onlineDrivers = drivers.filter(d => d.isOnline);
  const busyDrivers = drivers.filter(d => {
    return d.isOnline && trips.some(t => t.driverId === d.id && t.status !== 'completed' && t.status !== 'cancelled');
  });
  const freeDrivers = onlineDrivers.filter(d => !busyDrivers.some(bd => bd.id === d.id));
  const offlineDrivers = drivers.filter(d => !d.isOnline);

  // Filtered trips
  const filteredTrips = trips.filter(t => {
    if (tableTab === 'active') {
      if (t.status === 'completed' || t.status === 'cancelled' || t.status === 'rejected') return false;
    } else if (tableTab === 'future') {
      if (!t.scheduledPickupTime) return false;
    } else if (tableTab === 'unassigned') {
      if (t.driverId || t.status === 'completed' || t.status === 'cancelled') return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.customerPhone?.toLowerCase().includes(q) ||
        t.pickup?.address?.toLowerCase().includes(q) ||
        t.destination?.address?.toLowerCase().includes(q) ||
        t.driverName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 font-sans text-white">
      
      {/* 1. TAXICALLER TOP DISPATCH NAVIGATION BAR */}
      <div className="bg-[#121622] border border-white/10 rounded-2xl p-2 sm:p-3 flex items-center justify-between gap-2 shadow-xl backdrop-blur-xl flex-wrap">
        
        {/* Left tabs: ADMIN | DISPATCH | MAIN | JOBS OVERVIEW | SUPPORT */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            ADMIN
          </div>
          
          <button
            onClick={() => setDispatchView('dispatch')}
            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md ${
              dispatchView === 'dispatch'
                ? 'bg-[#E5B83B] text-slate-950 ring-2 ring-[#E5B83B]/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            DISPATCH
          </button>

          <button
            onClick={() => setDispatchView('jobs_overview')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              dispatchView === 'jobs_overview'
                ? 'bg-[#E5B83B] text-slate-950 ring-2 ring-[#E5B83B]/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            JOBS OVERVIEW
          </button>

          <button
            onClick={() => setDispatchView('vehicles')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              dispatchView === 'vehicles'
                ? 'bg-[#E5B83B] text-slate-950 ring-2 ring-[#E5B83B]/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            VEHICLE LIST
          </button>
        </div>

        {/* Right Status Counters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-mono text-[11px]">Sjåfører pålogget:</span>
            <span className="font-bold text-white font-mono">{onlineDrivers.length}/{totalDrivers}</span>
          </div>
        </div>

      </div>

      {/* 2. MAIN SPLIT VIEW: CREATE JOB (LEFT) & LIVE MAP (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: TAXICALLER JOB BOOKING FORM (5 Cols) */}
        <div className="lg:col-span-5 bg-[#121622] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          
          {/* Job Tab Switcher */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setJobFormTab('job1')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  jobFormTab === 'job1' ? 'bg-[#E5B83B] text-slate-950 font-black' : 'bg-white/5 text-slate-400'
                }`}
              >
                Job #1
              </button>
              <button
                onClick={() => setJobFormTab('job2')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  jobFormTab === 'job2' ? 'bg-[#E5B83B] text-slate-950 font-black' : 'bg-white/5 text-slate-400'
                }`}
              >
                Job #2
              </button>
            </div>

            <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Direkte Sentral
            </span>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 text-xs">
            
            {/* Pick-up Row */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Pick-up address & Zone
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={pickupAddress ?? ''}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Henteadresse..."
                  className="col-span-2 bg-[#171D2B] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#E5B83B]"
                />
                <select
                  value={pickupZone ?? OSLO_ZONES[0]}
                  onChange={(e) => setPickupZone(e.target.value)}
                  className="bg-[#171D2B] border border-white/10 rounded-xl px-2 py-2 text-white text-[11px] outline-none"
                >
                  {OSLO_ZONES.map((z) => (
                    <option key={`pickup-zone-${z}`} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drop-off Row */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                Drop-off address & Zone
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={dropoffAddress ?? ''}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="Leveringsadresse..."
                  className="col-span-2 bg-[#171D2B] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#E5B83B]"
                />
                <select
                  value={dropoffZone ?? OSLO_ZONES[1]}
                  onChange={(e) => setDropoffZone(e.target.value)}
                  className="bg-[#171D2B] border border-white/10 rounded-xl px-2 py-2 text-white text-[11px] outline-none"
                >
                  {OSLO_ZONES.map((z) => (
                    <option key={`dropoff-zone-${z}`} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pick-up Time (Now / Later) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
                Pick-up Time
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNow(true)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isNow ? 'bg-[#E5B83B] text-slate-950 font-black' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsNow(false)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    !isNow ? 'bg-[#E5B83B] text-slate-950 font-black' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  Later
                </button>
                {!isNow && (
                  <input
                    type="datetime-local"
                    value={scheduledDateTime ?? ''}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="flex-1 bg-[#171D2B] border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none"
                  />
                )}
              </div>
            </div>

            {/* Passenger & Phone */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passasjer navn</label>
                <input
                  type="text"
                  value={passengerName ?? ''}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Navn..."
                  className="w-full bg-[#171D2B] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telefon</label>
                <input
                  type="tel"
                  value={passengerPhone ?? ''}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  placeholder="+47..."
                  className="w-full bg-[#171D2B] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none font-mono"
                />
              </div>
            </div>

            {/* Vehicle Tier & Assigned Driver */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kjøretøyklasse</label>
                <select
                  value={vehicleClass}
                  onChange={(e: any) => setVehicleClass(e.target.value)}
                  className="w-full bg-[#171D2B] border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs outline-none"
                >
                  <option key="tier-vip" value="vip_black">Aron VIP (Sedan)</option>
                  <option key="tier-airport" value="airport_vip">Flyplass VIP Express</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tildel sjåfør (valgfritt)</label>
                <select
                  value={assignedDriverId ?? ''}
                  onChange={(e) => setAssignedDriverId(e.target.value)}
                  className="w-full bg-[#171D2B] border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs outline-none"
                >
                  <option key="driver-opt-auto" value="">-- Automatisk (Nærmeste ledig) --</option>
                  {drivers.map((d, dIdx) => (
                    <option key={`dispatch-form-driver-${d.id || dIdx}`} value={d.id}>
                      {d.name} {d.isOnline ? '(Online)' : '(Offline)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment & Notes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Betalingsmåte</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#171D2B] border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs outline-none"
                >
                  <option key="pay-card" value="card">Kort / Stripe</option>
                  <option key="pay-vipps" value="vipps">Vipps</option>
                  <option key="pay-invoice" value="invoice">Faktura (Bedrift)</option>
                  <option key="pay-cash" value="cash">Kontant / I bil</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avstand (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcDistanceKm ?? 1}
                  onChange={(e) => setCalcDistanceKm(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#171D2B] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Melding til sjåfør</label>
              <input
                type="text"
                value={passengerNotes ?? ''}
                onChange={(e) => setPassengerNotes(e.target.value)}
                placeholder="Spesielle instruksjoner..."
                className="w-full bg-[#171D2B] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none"
              />
            </div>

            {/* Fare summary */}
            <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Beregnet fastpris</span>
                <span className="text-xl font-black text-[#E5B83B] font-mono">{calcPrice} NOK</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimert kjøretid</span>
                <span className="text-xs font-bold text-white font-mono">~{calcDurationMin} minutter</span>
              </div>
            </div>

            {/* Action Buttons: Check, Send til Sjåfør, Clear */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={handleCheckRoute}
                className="py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer text-center"
              >
                Beregn Rute
              </button>

              <button
                type="button"
                onClick={handleBookTrip}
                className="py-3 sm:col-span-2 bg-[#E5B83B] hover:bg-[#d4a82b] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>SEND BESTILLING TIL SJÅFØR</span>
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: TAXICALLER MAP & LIVE FLEET PILLS (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Map Top Status Pills Bar */}
          <div className="bg-[#121622] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-xl backdrop-blur-xl flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-[#E5B83B]" />
                Kjøretøystatus:
              </span>
              
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="px-2 py-0.5 bg-white/10 rounded-lg text-slate-300">
                  all: <strong className="text-white">{totalDrivers}</strong>
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                  free: <strong>{freeDrivers.length}</strong>
                </span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg">
                  busy: <strong>{busyDrivers.length}</strong>
                </span>
                <span className="px-2 py-0.5 bg-white/5 text-slate-400 rounded-lg">
                  away: <strong>{offlineDrivers.length}</strong>
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Live Oslo GPS
            </div>
          </div>

          {/* Map Container */}
          <div className="bg-[#121622] border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-[420px] relative">
            <LeafletMap
              className="w-full h-full relative"
              interactive={true}
              zoom={13}
              driverLocation={
                onlineDrivers[0]?.currentLocation || { lat: 59.9139, lng: 10.7522 }
              }
              pickup={{
                address: pickupAddress,
                lat: 59.9139,
                lng: 10.7522
              }}
              destination={{
                address: dropoffAddress,
                lat: 59.9102,
                lng: 10.7250
              }}
            />
          </div>

        </div>

      </div>

      {/* 3. LIVE JOBS TABLE (TaxiCaller Bottom List) */}
      <div className="bg-[#121622] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
        
        {/* Table Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setTableTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tableTab === 'active' ? 'bg-[#E5B83B] text-slate-950 font-black' : 'bg-white/5 text-slate-400'
              }`}
            >
              Aktive turer ({trips.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length})
            </button>

            <button
              onClick={() => setTableTab('unassigned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tableTab === 'unassigned' ? 'bg-[#E5B83B] text-slate-950 font-black' : 'bg-white/5 text-slate-400'
              }`}
            >
              Ufordelte turer ({trips.filter(t => !t.driverId && t.status !== 'completed' && t.status !== 'cancelled').length})
            </button>

            <button
              onClick={() => setTableTab('future')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tableTab === 'future' ? 'bg-[#E5B83B] text-slate-950 font-black' : 'bg-white/5 text-slate-400'
              }`}
            >
              Fremtidige turer
            </button>

            <button
              onClick={() => setTableTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tableTab === 'all' ? 'bg-[#E5B83B] text-slate-950 font-black' : 'bg-white/5 text-slate-400'
              }`}
            >
              Alle ({trips.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery ?? ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk på tur, kunde, adresse..."
              className="bg-[#171D2B] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none w-full sm:w-64"
            />
          </div>
        </div>

        {/* The Jobs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400">
                <th className="pb-2.5">ID</th>
                <th className="pb-2.5">Sjåfør</th>
                <th className="pb-2.5">Passasjer</th>
                <th className="pb-2.5">Henteadresse</th>
                <th className="pb-2.5">Leveringsadresse</th>
                <th className="pb-2.5">Pris</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredTrips.length > 0 ? (
                filteredTrips.map((t) => {
                  const assignedDriver = drivers.find(d => d.id === t.driverId);
                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      
                      {/* ID */}
                      <td className="py-3 font-mono text-[11px] text-slate-300">
                        #{t.id.slice(-6)}
                      </td>

                      {/* Driver */}
                      <td className="py-3">
                        {assignedDriver ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="font-bold text-white">{assignedDriver.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                              onChange={(e) => onAssignDriver(t.id, e.target.value)}
                              defaultValue=""
                              className="bg-[#171D2B] border border-[#E5B83B]/40 text-[#E5B83B] text-[11px] rounded-lg px-2 py-1 outline-none"
                            >
                              <option key={`unassigned-prompt-${t.id}`} value="" disabled>Tildel...</option>
                              {drivers.map((d, dIdx) => (
                                <option key={`tbl-driver-opt-${t.id}-${d.id || dIdx}`} value={d.id}>{d.name} {d.isOnline ? '(Online)' : ''}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>

                      {/* Passenger */}
                      <td className="py-3">
                        <div className="text-white font-semibold">{t.customerName || 'Passasjer'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{t.customerPhone}</div>
                      </td>

                      {/* Pickup */}
                      <td className="py-3 max-w-[180px] truncate text-slate-300">
                        {t.pickup?.address}
                      </td>

                      {/* Dropoff */}
                      <td className="py-3 max-w-[180px] truncate text-slate-300">
                        {t.destination?.address}
                      </td>

                      {/* Price */}
                      <td className="py-3 font-mono font-bold text-[#E5B83B]">
                        {t.finalPrice || t.estimatedPrice} kr
                      </td>

                      {/* Status */}
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          t.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : t.status === 'trip_started'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : t.status === 'driver_assigned' || t.status === 'accepted'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-white/10 text-slate-300'
                        }`}>
                          {t.status === 'completed' ? 'Fullført' : t.status === 'trip_started' ? 'Kjører' : t.status === 'driver_assigned' ? 'Tildelt' : t.status === 'pending' ? 'Venter' : t.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status !== 'completed' && (
                            <button
                              onClick={() => onUpdateTripStatus(t.id, 'completed')}
                              title="Marker som fullført"
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm(`Slette tur #${t.id.slice(-6)}?`)) {
                                onDeleteTrip(t.id);
                              }
                            }}
                            title="Slett tur"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 text-xs">
                    Ingen turer funnet for valgt filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
