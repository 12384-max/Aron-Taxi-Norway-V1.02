import React from 'react';
import { Trip } from '../../types';
import {
  MapPin,
  Navigation,
  Clock,
  Check,
  X,
  Trash2,
  Car,
  DollarSign,
  Sparkles,
  Zap,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';

interface NewTripRequestCardProps {
  trip: Trip;
  countdown: number;
  onAccept: (tripId: string) => Promise<void>;
  onReject: (tripId: string) => Promise<void>;
  onDelete: (tripId: string) => Promise<void>;
}

export const NewTripRequestCard: React.FC<NewTripRequestCardProps> = ({
  trip,
  countdown,
  onAccept,
  onReject,
  onDelete
}) => {
  const driverPayout = Math.round((trip.finalPrice || trip.estimatedPrice || 0) * 0.85);
  const grossPrice = trip.finalPrice || trip.estimatedPrice || 0;
  const isAirport = trip.vehicleCategory === 'airport_vip';

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-full"
    >
      <div className="bg-[#101522]/98 border-2 border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl text-white space-y-3.5">
        
        {/* HEADER / COUNTDOWN */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                NY TURFORESPØRSEL
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                {isAirport ? '✈ Flyplass VIP Express' : 'Aron VIP Executive'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(trip.id)}
              title="Fjern/slett denne bestillingen"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-mono font-black text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{countdown}s</span>
            </div>
          </div>
        </div>

        {/* ADDRESSES */}
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2.5 bg-black/40 border border-white/10 rounded-2xl p-2.5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Hentested</span>
              <span className="text-white font-semibold line-clamp-1">{trip.pickup?.address || 'Oslo'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-black/40 border border-white/10 rounded-2xl p-2.5">
            <Navigation className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Destinasjon</span>
              <span className="text-white font-semibold line-clamp-1">{trip.destination?.address || 'Gardermoen'}</span>
            </div>
          </div>
        </div>

        {/* PAYMENT STATUS BADGE */}
        <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-2xl px-3.5 py-2">
          <div className="flex items-center gap-2">
            {trip.paymentStatus === 'paid' || trip.paymentStatus === 'succeeded' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            )}
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Betalingsstatus:</span>
          </div>

          <div>
            {trip.paymentStatus === 'paid' || trip.paymentStatus === 'succeeded' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-black tracking-wide flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                BETALT ({trip.paymentMethod === 'nets_card' ? 'Nets Test' : trip.paymentMethod === 'stripe' ? 'Kort' : 'Kort/Vipps'})
              </span>
            ) : trip.paymentMethod === 'cash' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                Betales i bil (Kontant)
              </span>
            ) : trip.paymentMethod === 'invoice' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[11px] font-bold">
                Bedriftsfaktura
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                Betales i bil (Kort/Vipps)
              </span>
            )}
          </div>
        </div>

        {/* METRICS & PAYOUT */}
        <div className="grid grid-cols-2 gap-2 bg-[#171E2D] border border-white/10 rounded-2xl p-3">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Din utbetaling</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-400 font-mono">kr {driverPayout}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Brutto {grossPrice} kr</span>
          </div>

          <div className="text-right border-l border-white/10 pl-2">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Turdata</span>
            <div className="text-xs font-bold text-white font-mono mt-0.5">
              ~{trip.distanceKm || 4.5} km
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              ~{trip.durationMinutes || 10} min kjøretid
            </div>
          </div>
        </div>

        {/* ACTIONS: BIG REJECT AND ACCEPT BUTTONS */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => onReject(trip.id)}
            className="py-3 bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1"
          >
            <X className="w-4 h-4" />
            <span>AVSLÅ</span>
          </button>

          <button
            onClick={() => onAccept(trip.id)}
            className="py-3 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>AKSEPTER ({countdown}s)</span>
          </button>
        </div>

      </div>
    </motion.div>
  );
};
