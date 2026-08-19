import React, { useState } from 'react';
import { Trip, TripStatus, Driver, Vehicle } from '../../types';
import {
  CalendarPlus,
  MapPin,
  Navigation,
  Clock,
  Check,
  X,
  Plus,
  Trash2,
  Phone,
  MessageSquare,
  Zap,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Car,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface DriverBookingsViewProps {
  trips: Trip[];
  currentDriver?: Driver;
  currentVehicle?: Vehicle;
  onAcceptTrip: (tripId: string) => Promise<void>;
  onRejectTrip: (tripId: string) => Promise<void>;
  onCancelTrip?: (tripId: string, reason?: string) => Promise<void>;
  onDeleteTrip: (tripId: string) => Promise<void>;
  onCreateStreetTrip: (tripData: any) => Promise<Trip>;
  onOpenTripOnMap: (trip: Trip) => void;
}

export const DriverBookingsView: React.FC<DriverBookingsViewProps> = ({
  trips,
  currentDriver,
  currentVehicle,
  onAcceptTrip,
  onRejectTrip,
  onCancelTrip,
  onDeleteTrip,
  onCreateStreetTrip,
  onOpenTripOnMap
}) => {
  const [subTab, setSubTab] = useState<'pending' | 'active' | 'scheduled' | 'create_street'>('pending');
  
  // Cancellation Modal state
  const [tripToCancel, setTripToCancel] = useState<Trip | null>(null);
  const [cancelReason, setCancelReason] = useState('Passasjer møtte ikke opp (No-show)');
  const [customReason, setCustomReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const CANCELLATION_REASONS = [
    'Passasjer møtte ikke opp (No-show)',
    'Kunde ba om avbestilling',
    'Trafikkork / Uhell / Forsinkelse',
    'Kjøretøyproblem / Punktering',
    'Feilbestilling / Annet'
  ];

  // Street trip form
  const [streetPickup, setStreetPickup] = useState('Karl Johans gate, Oslo');
  const [streetDestination, setStreetDestination] = useState('Oslo Lufthavn Gardermoen');
  const [streetPrice, setStreetPrice] = useState<number>(1150);
  const [streetPassenger, setStreetPassenger] = useState('Gatetur passasjer');
  const [streetPhone, setStreetPhone] = useState('+47 ');
  const [streetPayment, setStreetPayment] = useState<'cash' | 'card' | 'vipps'>('card');
  const [isCreatingStreet, setIsCreatingStreet] = useState(false);

  const getScheduledTimeDiffMs = (t: Trip): number | null => {
    const timeStr = t.scheduledPickupTime || t.scheduledTime;
    if (!timeStr) return null;
    const parsed = new Date(timeStr).getTime();
    return isNaN(parsed) ? null : parsed - Date.now();
  };

  // Filter trips
  const isTripActiveForDriver = (t: Trip, driverId?: string): boolean => {
    if (!driverId) return false;
    const isThisDriver = t.driverId === driverId || t.acceptedBy === driverId;
    if (!isThisDriver) return false;

    const terminalStatuses: TripStatus[] = [
      'completed',
      'COMPLETED',
      'cancelled',
      'CANCELLED',
      'rejected',
      'DRIVER_DECLINED'
    ];
    if (terminalStatuses.includes(t.status)) return false;

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

    if (
      t.status === 'DRIVER_ACCEPTED' ||
      t.status === 'accepted' ||
      t.status === 'driver_assigned'
    ) {
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

  const isTripPendingForDriver = (t: Trip, driverId?: string): boolean => {
    if (!driverId) return false;

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

    if (t.declinedBy === driverId) return false;
    if (t.rejectedDriverIds && t.rejectedDriverIds.includes(driverId)) return false;

    if (t.driverId && t.driverId !== driverId) return false;
    if (t.acceptedBy && t.acceptedBy !== driverId) return false;

    if (isTripActiveForDriver(t, driverId)) return false;
    if (t.assignedDriverId && t.assignedDriverId !== driverId) return false;

    // If pre-order > 20 min into the future and unassigned, keep in Forhåndsbestillinger list
    // When within 20 min or time arrived, it escalates to normal live popup!
    if (t.isPreorder && !t.driverId && !t.acceptedBy) {
      const diffMs = getScheduledTimeDiffMs(t);
      if (diffMs !== null && diffMs > 20 * 60 * 1000) {
        return false;
      }
    }

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

  const pendingTrips = trips.filter((t) => isTripPendingForDriver(t, currentDriver?.id));

  const activeTrips = trips.filter((t) => isTripActiveForDriver(t, currentDriver?.id));

  const scheduledTrips = trips.filter(
    (t) =>
      Boolean(t.isPreorder || t.scheduledPickupTime || t.scheduledTime) &&
      t.status !== 'completed' &&
      t.status !== 'COMPLETED' &&
      t.status !== 'cancelled' &&
      t.status !== 'CANCELLED'
  );

  const handleConfirmCancel = async () => {
    if (!tripToCancel) return;
    setIsSubmittingCancel(true);
    try {
      const finalReason = cancelReason === 'Feilbestilling / Annet' && customReason.trim()
        ? customReason.trim()
        : cancelReason;
      
      if (onCancelTrip) {
        await onCancelTrip(tripToCancel.id, finalReason);
      }
      toast.info(`Tur #${tripToCancel.id.slice(-6)} ble kansellert.`);
      setTripToCancel(null);
    } catch (e: any) {
      toast.error(e?.message || 'Kunne ikke kansellere turen.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleCreateDirectStreetTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetPickup || !streetDestination) {
      toast.error('Vennligst fyll ut hente- og leveringsadresse.');
      return;
    }

    setIsCreatingStreet(true);
    try {
      const isAirport = streetDestination.toLowerCase().includes('gardermoen') || streetPickup.toLowerCase().includes('gardermoen');
      const newTrip = await onCreateStreetTrip({
        customerId: `street_${Date.now()}`,
        customerName: streetPassenger || 'Gatetur Passasjer',
        customerPhone: streetPhone || '+47 96 99 09 01',
        pickup: {
          address: streetPickup,
          lat: 59.9139,
          lng: 10.7522,
        },
        destination: {
          address: streetDestination,
          lat: isAirport ? 60.1975 : 59.9102,
          lng: isAirport ? 11.1004 : 10.7250,
        },
        vehicleCategory: isAirport ? 'airport_vip' : 'vip_black',
        vehicleId: currentVehicle?.id || 'v1',
        vehicleModel: currentVehicle?.model || 'Tesla Model Y',
        vehicleLicensePlate: currentVehicle?.licensePlate || 'EP 17891',
        permitNumber: currentVehicle?.permitNumber || 'OS 10597',
        driverId: currentDriver?.id,
        driverName: currentDriver?.name || 'Aron Sjåfør',
        driverPhone: currentDriver?.phone || '+47 96 99 09 01',
        distanceKm: isAirport ? 48 : 5.5,
        durationMinutes: isAirport ? 38 : 12,
        estimatedPrice: streetPrice || 350,
        finalPrice: streetPrice || 350,
        paymentMethod: streetPayment,
        paymentStatus: streetPayment === 'cash' ? 'unpaid' : 'paid',
        notes: 'Direkte gatetur opprettet fra sjåførapp',
      });

      toast.success(`⚡ Gatetur opprettet! Turen er nå aktiv.`);
      setSubTab('active');
    } catch (err: any) {
      toast.error(err?.message || 'Kunne ikke opprette gatetur.');
    } finally {
      setIsCreatingStreet(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-24 pt-4 px-4 sm:px-6 max-w-4xl mx-auto space-y-5 text-white font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E5B83B]/10 text-[#E5B83B] border border-[#E5B83B]/30">
              <CalendarPlus className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Bestillingssentral
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Se ledige oppdrag, forhåndsbestillinger, aktive turer og kanselleringer.
          </p>
        </div>

        <button
          onClick={() => setSubTab('create_street')}
          className="px-3.5 py-2 rounded-xl bg-[#E5B83B] hover:bg-[#d4a832] text-slate-950 font-black text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all shadow-lg"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrer gatetur</span>
        </button>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#121724] p-1.5 rounded-2xl border border-white/10">
        <button
          onClick={() => setSubTab('pending')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'pending'
              ? 'bg-[#E5B83B] text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Ledige ({pendingTrips.length})</span>
          {pendingTrips.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setSubTab('active')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'active'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Aktive ({activeTrips.length})</span>
        </button>

        <button
          onClick={() => setSubTab('scheduled')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'scheduled'
              ? 'bg-[#E5B83B] text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Forhåndsbestillinger ({scheduledTrips.length})</span>
        </button>

        <button
          onClick={() => setSubTab('create_street')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'create_street'
              ? 'bg-white/20 text-white font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Gatetur</span>
        </button>
      </div>

      {/* SUB-VIEW 1: PENDING / INCOMING TRIPS */}
      {subTab === 'pending' && (
        <div className="space-y-3">
          {pendingTrips.length === 0 ? (
            <div className="bg-[#121722] border border-white/10 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Ingen ledige oppdrag i øyeblikket</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Når kunder bestiller via appen eller når en forhåndsbestilling når sin oppmøtetid, vil oppdraget umiddelbart dukke opp her og som popup på kartet.
              </p>
            </div>
          ) : (
            pendingTrips.map((trip) => {
              const driverPayout = Math.round((trip.finalPrice || trip.estimatedPrice || 0) * 0.85);
              const isScheduledEscalated = Boolean(trip.isPreorder && (trip.scheduledPickupTime || trip.scheduledTime));

              return (
                <div
                  key={trip.id}
                  className="bg-[#121722] border-2 border-emerald-500/60 hover:border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-xl transition-all space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                        {isScheduledEscalated ? '⚡ FORHÅNDSBESTILLING - NÅ KLAR FOR HENTING' : `NY TURFORESPØRSEL #${trip.id.slice(-6)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDeleteTrip(trip.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Slett bestilling"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                        kr {driverPayout} netto
                      </span>
                    </div>
                  </div>

                  {/* ADDRESSES */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Henting</span>
                        <span className="font-semibold text-white">{trip.pickup?.address || 'Oslo'}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Destinasjon</span>
                        <span className="font-semibold text-white">{trip.destination?.address || 'Gardermoen'}</span>
                      </div>
                    </div>
                  </div>

                  {/* METRICS & CLIENT */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 pt-1">
                    <div className="flex items-center gap-2">
                      <span>Kunde: <strong className="text-white">{trip.customerName || 'Passasjer'}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>{trip.distanceKm || 4.2} km (~{trip.durationMinutes || 12} min)</span>
                      {trip.scheduledPickupTime && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-amber-400 font-bold">Tid: {trip.scheduledPickupTime}</span>
                        </>
                      )}
                    </div>

                    <div className="text-xs font-mono">
                      Brutto: <strong className="text-white font-bold">{trip.estimatedPrice} NOK</strong>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => onRejectTrip(trip.id)}
                      className="py-2.5 bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-bold text-xs uppercase rounded-xl border border-white/10 transition-all cursor-pointer text-center"
                    >
                      Avslå
                    </button>

                    <button
                      onClick={() => onAcceptTrip(trip.id)}
                      className="py-2.5 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>AKSEPTER OPPDRAG</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-VIEW 2: ACTIVE TRIPS */}
      {subTab === 'active' && (
        <div className="space-y-3">
          {activeTrips.length === 0 ? (
            <div className="bg-[#121722] border border-white/10 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Ingen pågående tur</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Du har ingen aktive oppdrag akkurat nå. Se ledige turer eller gå til Driver-fanen for å se kartet.
              </p>
            </div>
          ) : (
            activeTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-[#121722] border-2 border-emerald-500 rounded-3xl p-5 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                      AKTIVT OPPDRAG #{trip.id.slice(-6)}
                    </span>
                  </div>

                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-mono text-xs font-black">
                    {trip.finalPrice || trip.estimatedPrice} NOK
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-black/40 rounded-2xl border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Henting</span>
                    <span className="font-bold text-white text-sm">{trip.pickup?.address}</span>
                  </div>

                  <div className="p-3 bg-black/40 rounded-2xl border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Destinasjon</span>
                    <span className="font-bold text-white text-sm">{trip.destination?.address}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <span className="text-xs text-slate-400">Passasjer:</span>
                    <span className="text-xs font-bold text-white ml-1.5">{trip.customerName} ({trip.customerPhone || 'Registrert'})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTripToCancel(trip)}
                      className="px-3.5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                      <span>Kanseller bestilling</span>
                    </button>

                    <button
                      onClick={() => onOpenTripOnMap(trip)}
                      className="px-4 py-2.5 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Gå til kart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB-VIEW 3: SCHEDULED TRIPS (FORHÅNDSBESTILLINGER) */}
      {subTab === 'scheduled' && (
        <div className="space-y-3">
          {scheduledTrips.length === 0 ? (
            <div className="bg-[#121722] border border-white/10 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#E5B83B]">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Ingen planlagte forhåndsbestillinger</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Turer bestilt for fremtidige tidspunkter vises her. Sjåfører kan godkjenne og reservere oppdrag i god tid før hente-tidspunktet.
              </p>
            </div>
          ) : (
            scheduledTrips.map((trip) => {
              const isMine = trip.driverId === currentDriver?.id || trip.acceptedBy === currentDriver?.id;
              const isUnassigned = !trip.driverId && !trip.acceptedBy;
              const driverPayout = Math.round((trip.finalPrice || trip.estimatedPrice || 0) * 0.85);
              const pickupTimeLabel = trip.scheduledPickupTime || trip.scheduledTime || 'Planlagt tur';

              return (
                <div
                  key={trip.id}
                  className={`bg-[#121722] border rounded-3xl p-4 sm:p-5 shadow-xl space-y-3 transition-all ${
                    isMine
                      ? 'border-emerald-500/70 bg-[#121c19]'
                      : isUnassigned
                      ? 'border-[#E5B83B]/50 hover:border-[#E5B83B]'
                      : 'border-white/10 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#E5B83B]" />
                      <span className="text-xs font-bold text-[#E5B83B]">
                        Hentetid: <strong>{pickupTimeLabel}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMine ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Godkjent & Reservert av deg
                        </span>
                      ) : isUnassigned ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/30">
                          Ledig for reservasjon
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-[11px] font-bold">
                          Tildelt annen sjåfør ({trip.driverName || 'Sjåfør'})
                        </span>
                      )}

                      <span className="text-xs font-mono font-black text-white ml-1">
                        kr {driverPayout} netto
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Henting</span>
                        <span className="font-semibold text-white">{trip.pickup?.address}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Destinasjon</span>
                        <span className="font-semibold text-white">{trip.destination?.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 pt-1">
                    <div className="flex items-center gap-2">
                      <span>Kunde: <strong className="text-white">{trip.customerName}</strong> ({trip.customerPhone || 'Registrert'})</span>
                      <span className="text-slate-600">•</span>
                      <span>Kategori: <strong className="text-[#E5B83B]">{trip.vehicleCategory === 'airport_vip' ? 'Flyplass VIP' : 'VIP Black'}</strong></span>
                    </div>

                    <div className="text-xs font-mono text-slate-400">
                      Totalpris: <span className="text-white font-bold">{trip.estimatedPrice} NOK</span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                    {isUnassigned && (
                      <button
                        onClick={() => onAcceptTrip(trip.id)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#E5B83B] hover:bg-[#d4a832] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>GODKJENN FORHÅNDSBESTILLING</span>
                      </button>
                    )}

                    {isMine && (
                      <>
                        <button
                          onClick={() => setTripToCancel(trip)}
                          className="px-3.5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <X className="w-4 h-4 stroke-[2.5]" />
                          <span>Kanseller bestilling</span>
                        </button>

                        <button
                          onClick={() => onOpenTripOnMap(trip)}
                          className="px-4 py-2.5 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Gå til oppdrag</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-VIEW 4: CREATE STREET TRIP FORM */}
      {subTab === 'create_street' && (
        <form onSubmit={handleCreateDirectStreetTrip} className="bg-[#121722] border border-[#E5B83B]/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#E5B83B]" />
              Opprett direkte gatetur (Taksameter / Manuell tur)
            </h3>
            <span className="text-xs text-slate-400">Kjøretøy: {currentVehicle?.licensePlate || 'EP 17891'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold uppercase text-[10px]">Hentested (Adresse / Sted)</label>
              <input
                type="text"
                required
                value={streetPickup}
                onChange={(e) => setStreetPickup(e.target.value)}
                placeholder="F.eks. Karl Johans gate 1, Oslo"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white font-medium focus:border-[#E5B83B] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold uppercase text-[10px]">Destinasjon (Leveringsadresse)</label>
              <input
                type="text"
                required
                value={streetDestination}
                onChange={(e) => setStreetDestination(e.target.value)}
                placeholder="F.eks. Oslo Lufthavn Gardermoen"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white font-medium focus:border-[#E5B83B] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold uppercase text-[10px]">Avtalt / Taksameter Pris (NOK)</label>
              <input
                type="number"
                required
                min={50}
                value={streetPrice}
                onChange={(e) => setStreetPrice(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:border-[#E5B83B] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold uppercase text-[10px]">Passasjernavn</label>
              <input
                type="text"
                value={streetPassenger}
                onChange={(e) => setStreetPassenger(e.target.value)}
                placeholder="Navn på passasjer"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-[#E5B83B] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold uppercase text-[10px]">Telefonnummer</label>
              <input
                type="text"
                value={streetPhone}
                onChange={(e) => setStreetPhone(e.target.value)}
                placeholder="+47 000 00 000"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-[#E5B83B] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold uppercase text-[10px]">Betalingsform</label>
              <select
                value={streetPayment}
                onChange={(e) => setStreetPayment(e.target.value as any)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white font-medium focus:border-[#E5B83B] focus:outline-none"
              >
                <option value="card">Bankterminal / Kort i bil</option>
                <option value="vipps">Vipps i bil</option>
                <option value="cash">Kontant</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSubTab('pending')}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
            >
              Avbryt
            </button>

            <button
              type="submit"
              disabled={isCreatingStreet}
              className="px-6 py-2.5 rounded-xl bg-[#E5B83B] hover:bg-[#d4a832] text-slate-950 font-black text-xs uppercase shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isCreatingStreet ? 'Oppretter tur...' : 'Start Direkte Gatetur Nå'}</span>
            </button>
          </div>
        </form>
      )}

      {/* DRIVER CANCELLATION MODAL */}
      <AnimatePresence>
        {tripToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121826] border border-rose-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-black text-base">Kanseller bestilling</h3>
                </div>
                <button
                  onClick={() => setTripToCancel(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Velg årsak til at oppdraget <strong>#{tripToCancel.id.slice(-6)}</strong> for <strong>{tripToCancel.customerName}</strong> må kanselleres:
              </p>

              <div className="space-y-2">
                {CANCELLATION_REASONS.map((r) => (
                  <label
                    key={r}
                    onClick={() => setCancelReason(r)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      cancelReason === r
                        ? 'bg-rose-500/20 border-rose-500/60 text-white font-bold'
                        : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel_modal_reason"
                      checked={cancelReason === r}
                      onChange={() => setCancelReason(r)}
                      className="accent-rose-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>

              {cancelReason === 'Feilbestilling / Annet' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Skriv inn årsak her..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setTripToCancel(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  disabled={isSubmittingCancel}
                  onClick={handleConfirmCancel}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingCancel ? (
                    <span>Kansellerer...</span>
                  ) : (
                    <>
                      <X className="w-4 h-4 stroke-[3]" />
                      <span>Bekreft Kansellering</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
