import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle2, ChevronRight, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTrips } from '../../context/TripContext';
import { Driver, Trip } from '../../types';

interface BoltScheduledRidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDriver?: Driver;
}

export const BoltScheduledRidesModal: React.FC<BoltScheduledRidesModalProps> = ({
  isOpen,
  onClose,
  currentDriver,
}) => {
  const { trips, acceptTripAtomic } = useTrips();
  const [tab, setTab] = useState<'requests' | 'accepted'>('requests');

  if (!isOpen) return null;

  // Real scheduled / preorder trips
  const scheduledRequests = trips.filter(
    (t) =>
      t.isPreorder &&
      !t.driverId &&
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      t.status !== 'rejected'
  );

  const myAcceptedScheduled = trips.filter(
    (t) =>
      t.isPreorder &&
      t.driverId === currentDriver?.id &&
      t.status !== 'completed' &&
      t.status !== 'cancelled'
  );

  const handleAcceptScheduled = async (tripId: string) => {
    if (!currentDriver) return;
    const res = await acceptTripAtomic(tripId, currentDriver.id);
    if (res.success) {
      toast.success('Forhåndsbestilling bekreftet! Lagt til i dine oppdrag.');
      setTab('accepted');
    } else {
      toast.error(res.error || 'Kunne ikke godta forhåndsbestillingen.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#10141E] text-white flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#10141E]/95 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-white">Forhåndsbestillinger (Scheduled)</h1>
        <div className="w-8" />
      </div>

      {/* Tabs */}
      <div className="p-4 border-b border-white/10 bg-[#171E2D]">
        <div className="flex bg-[#10141E] p-1 rounded-2xl border border-white/10 max-w-md mx-auto">
          <button
            onClick={() => setTab('requests')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
              tab === 'requests'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Forespørsler ({scheduledRequests.length})
          </button>
          <button
            onClick={() => setTab('accepted')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
              tab === 'accepted'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mine oppdrag ({myAcceptedScheduled.length})
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4">
        {tab === 'requests' ? (
          scheduledRequests.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#171E2D] border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Ingen forhåndsbestillinger akkurat nå</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Når kunder legger inn forhåndsbestillinger for flyplassturer eller VIP-transport, vises de her i sanntid.
              </p>
            </div>
          ) : (
            scheduledRequests.map((req) => {
              const netPrice = Math.round(req.estimatedPrice * 0.85);
              return (
                <div
                  key={req.id}
                  className="bg-[#171E2D] border border-white/10 rounded-3xl p-5 space-y-3.5 shadow-md hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold font-mono border border-emerald-500/30 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {req.scheduledTime || 'Forhåndsbestilt'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold capitalize">
                      {req.vehicleCategory?.replace('_', ' ') || 'Aron Taxi'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Henting</span>
                        <span className="text-white font-medium">{req.pickup?.address}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Levering</span>
                        <span className="text-white font-medium">{req.destination?.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Din utbetaling (85%)</span>
                      <span className="text-lg font-black text-emerald-400">kr {netPrice}</span>
                      <span className="text-[10px] text-slate-500 ml-1.5">(Brutto: kr {req.estimatedPrice})</span>
                    </div>

                    <button
                      onClick={() => handleAcceptScheduled(req.id)}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Godta oppdrag
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : myAcceptedScheduled.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#171E2D] border border-white/10 flex items-center justify-center mx-auto text-slate-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Ingen tildelte forhåndsbestillinger</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Godta forespørsler fra fanen til venstre for å se planlagte oppdrag her.
            </p>
          </div>
        ) : (
          myAcceptedScheduled.map((req) => {
            const netPrice = Math.round(req.estimatedPrice * 0.85);
            return (
              <div
                key={req.id}
                className="bg-[#171E2D] border border-emerald-500/30 rounded-3xl p-5 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                    {req.scheduledTime || 'Tildelt'}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">Godkjent oppdrag</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div><strong>Fra:</strong> {req.pickup?.address}</div>
                  <div><strong>Til:</strong> {req.destination?.address}</div>
                  <div><strong>Kunde:</strong> {req.customerName} ({req.customerPhone})</div>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Netto utbetaling:</span>
                  <span className="text-emerald-400 font-black text-sm">kr {netPrice},00</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
