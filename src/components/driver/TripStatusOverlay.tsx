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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('Passasjer møtte ikke opp (No-show)');
  const [customReason, setCustomReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const CANCELLATION_REASONS = [
    'Passasjer møtte ikke opp (No-show)',
    'Kunde ba om avbestilling',
    'Trafikkork / Veisperring / Uhell',
    'Kjøretøysvikt / Punktering',
    'Feilbestilling / Annet'
  ];

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

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      const finalReason = selectedReason === 'Feilbestilling / Annet' && customReason.trim()
        ? customReason.trim()
        : selectedReason;
      await onCancelTrip(trip.id, finalReason);
      setShowCancelModal(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const currentStep = isAcceptedOrArriving ? 1 : isArrived ? 2 : isStarted ? 3 : 4;

  return (
    <>
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

                {!isCompleted && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    title="Kanseller bestilling"
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="hidden sm:inline">Kanseller</span>
                  </button>
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
                <div className="flex items-center gap-1.5">
                  <span>{trip.vehicleCategory === 'airport_vip' ? 'Flyplass VIP Express' : 'Aron VIP'}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  {trip.paymentStatus === 'paid' || trip.paymentStatus === 'succeeded' ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Betalt ({trip.paymentMethod === 'nets_card' ? 'Nets' : 'Kort/Vipps'})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold">
                      {trip.paymentMethod === 'cash' ? 'Kontant i bil' : 'Betales i bil'}
                    </span>
                  )}
                </div>
                <span className="text-emerald-400 font-mono font-bold">
                  Utbetaling: kr {Math.round((trip.finalPrice || trip.estimatedPrice) * 0.85)}
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

            {/* MAIN DYNAMIC STEP ADVANCE BUTTON + CANCEL OPTION */}
            <div className="space-y-2">
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

              {/* Secondary Cancel Option on mobile/PC */}
              {!isCompleted && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-2 text-rose-400 hover:text-rose-300 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Kanseller denne bestillingen
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </AnimatePresence>

      {/* DRIVER CANCELLATION MODAL */}
      <AnimatePresence>
        {showCancelModal && (
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
                  onClick={() => setShowCancelModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Velg årsak til at oppdraget <strong>#{trip.id.slice(-6)}</strong> for <strong>{trip.customerName}</strong> må kanselleres:
              </p>

              <div className="space-y-2">
                {CANCELLATION_REASONS.map((r) => (
                  <label
                    key={r}
                    onClick={() => setSelectedReason(r)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReason === r
                        ? 'bg-rose-500/20 border-rose-500/60 text-white font-bold'
                        : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      checked={selectedReason === r}
                      onChange={() => setSelectedReason(r)}
                      className="accent-rose-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>

              {selectedReason === 'Feilbestilling / Annet' && (
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
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCancelling ? (
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
    </>
  );
};
