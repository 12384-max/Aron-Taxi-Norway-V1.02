import React, { useState, useEffect } from 'react';
import { Trip, Driver, Vehicle } from '../../types';
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  MessageSquare,
  Check,
  X,
  Trash2,
  Car,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TripStatusOverlayProps {
  trip: Trip;
  currentDriver?: Driver;
  currentVehicle?: Vehicle;
  onAdvanceStatus: () => Promise<void>;
  onDeleteTrip: (tripId: string) => Promise<void>;
  onCancelTrip: (tripId: string, reason?: string) => Promise<void>;
  onOpenNavigation: (address: string) => void;
  onOpenSmsModal: () => void;
  waitingSeconds: number;
}

export const TripStatusOverlay: React.FC<TripStatusOverlayProps> = ({
  trip,
  currentDriver,
  currentVehicle,
  onAdvanceStatus,
  onDeleteTrip,
  onCancelTrip,
  onOpenNavigation,
  onOpenSmsModal,
  waitingSeconds
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status mapping
  const isAcceptedOrArriving =
    trip.status === 'driver_assigned' ||
    trip.status === 'accepted' ||
    trip.status === 'confirmed' ||
    trip.status === 'driver_arriving';

  const isArrived = trip.status === 'driver_arrived';
  const isStarted = trip.status === 'trip_started' || trip.status === 'active';
  const isCompleted = trip.status === 'completed';

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleAdvance = async () => {
    setIsSubmitting(true);
    try {
      await onAdvanceStatus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = isAcceptedOrArriving ? 1 : isArrived ? 2 : isStarted ? 3 : 4;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="w-full"
      >
        <div className="bg-[#121722]/98 border border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 backdrop-blur-xl text-white">
          
          {/* STEP PROGRESS INDICATOR */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  {isAcceptedOrArriving && '1. TUR AKSEPTERT'}
                  {isArrived && '2. KUNDE HENTES'}
                  {isStarted && '3. TUR PÅGÅR'}
                  {isCompleted && '4. TUR FULLFØRT'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Tur-ID: #{trip.id.slice(-6)}</span>
            </div>

            <div className="flex items-center gap-2">
              {isArrived && (
                <div className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Venter: {formatTime(waitingSeconds)}</span>
                </div>
              )}

              <button
                onClick={() => onDeleteTrip(trip.id)}
                title="Slett tur"
                className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* STEP BARS */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className={`h-1.5 rounded-full transition-all ${currentStep >= 1 ? 'bg-emerald-400' : 'bg-white/10'}`} />
            <div className={`h-1.5 rounded-full transition-all ${currentStep >= 2 ? 'bg-emerald-400' : 'bg-white/10'}`} />
            <div className={`h-1.5 rounded-full transition-all ${currentStep >= 3 ? 'bg-emerald-400' : 'bg-white/10'}`} />
            <div className={`h-1.5 rounded-full transition-all ${currentStep >= 4 ? 'bg-emerald-400' : 'bg-white/10'}`} />
          </div>

          {/* ROUTE INFO BASED ON STEP */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-3 space-y-2.5 text-xs">
            {/* If arriving/pickup step: Focus on Pickup */}
            {(isAcceptedOrArriving || isArrived) && (
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Navigasjon til hentested</span>
                  <div className="text-white font-semibold truncate">{trip.pickup?.address || 'Hentested'}</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                    Avstand: ~{trip.distanceKm || 3.2} km • ETA: ~{trip.durationMinutes || 8} min
                  </div>
                </div>
              </div>
            )}

            {/* If trip started: Focus on Destination */}
            {(isStarted || isCompleted) && (
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Destinasjon</span>
                  <div className="text-white font-semibold truncate">{trip.destination?.address || 'Destinasjon'}</div>
                  <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                    Turavstand: {trip.distanceKm} km • Beregnet tid: {trip.durationMinutes} min
                  </div>
                </div>
              </div>
            )}

            {/* Both summary lines when expanded */}
            <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>{trip.vehicleCategory === 'airport_vip' ? 'Flyplass VIP Express' : 'Aron VIP'}</span>
              <span className="text-emerald-400 font-mono font-bold">
                Utbetaling: kr {Math.round((trip.finalPrice || trip.estimatedPrice) * 0.85)} (Brutto {trip.finalPrice || trip.estimatedPrice} kr)
              </span>
            </div>
          </div>

          {/* PASSENGER ROW */}
          <div className="flex items-center justify-between gap-3 bg-[#171E2D] border border-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{trip.customerName || 'Passasjer'}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">{trip.customerPhone || 'Registrert'}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {trip.customerPhone && (
                <a
                  href={`tel:${trip.customerPhone}`}
                  className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                  title="Ring passasjer"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={onOpenSmsModal}
                className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30 transition-colors cursor-pointer"
                title="Send SMS"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  onOpenNavigation(
                    isStarted || isCompleted ? trip.destination.address : trip.pickup.address
                  )
                }
                className="px-3 py-2.5 rounded-xl bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Start navigasjon i Google Maps"
              >
                <Navigation className="w-4 h-4" />
                <span>GPS</span>
              </button>
            </div>
          </div>

          {/* MAIN DYNAMIC STEP ADVANCE BUTTON */}
          <div>
            {isAcceptedOrArriving && (
              <button
                disabled={isSubmitting}
                onClick={handleAdvance}
                className="w-full py-3.5 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>ANKOMMET HENTESTED</span>
              </button>
            )}

            {isArrived && (
              <button
                disabled={isSubmitting}
                onClick={handleAdvance}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-[#34D186] hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                <span>START TUR NÅ</span>
              </button>
            )}

            {isStarted && (
              <button
                disabled={isSubmitting}
                onClick={handleAdvance}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 hover:brightness-110 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-rose-500/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>AVSLUTT TUR (MOTTA {trip.finalPrice || trip.estimatedPrice} KR)</span>
              </button>
            )}

            {isCompleted && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Turen er fullført!</span>
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {trip.finalPrice || trip.estimatedPrice} NOK
                </div>
                <div className="text-xs text-slate-300">
                  Betalingsstatus: <strong className="text-emerald-400 uppercase">{trip.paymentStatus === 'paid' ? 'Betalt (Kort/Stripe)' : 'Fullført'}</strong>
                </div>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
