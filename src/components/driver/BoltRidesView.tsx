import React, { useState } from 'react';
import { 
  History, 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MapPin, 
  Clock,
  Car,
  Trash2
} from 'lucide-react';
import { Trip } from '../../types';
import { useTrips } from '../../context/TripContext';
import { toast } from 'sonner';

interface BoltRidesViewProps {
  completedTrips: Trip[];
  onSelectTrip?: (trip: Trip) => void;
}

export const BoltRidesView: React.FC<BoltRidesViewProps> = ({
  completedTrips,
  onSelectTrip,
}) => {
  const { deleteTrip } = useTrips();
  const [rated, setRated] = useState<boolean | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRate = (positive: boolean) => {
    setRated(positive);
    toast.success(positive ? 'Takk for din positive tilbakemelding! 👍' : 'Takk for tilbakemeldingen. Vi forbedrer appen kontinuerlig.');
  };

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (!window.confirm('Vil du slette denne bestillingen fra historikken?')) return;
    try {
      setDeletingId(tripId);
      await deleteTrip(tripId);
      toast.success('Bestilling slettet!');
    } catch (err) {
      toast.error('Kunne ikke slette bestillingen.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 bg-[#10141E] text-white min-h-screen flex flex-col pb-24 animate-in fade-in duration-200">
      
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 bg-[#10141E]/95 backdrop-blur-md border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-white tracking-tight">Turhistorikk (Ride history)</h1>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          {completedTrips.length} {completedTrips.length === 1 ? 'tur' : 'turer'}
        </span>
      </div>

      <div className="p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4">
        
        {/* App Feedback Banner */}
        {rated === null ? (
          <div className="bg-[#171E2D] border border-white/10 rounded-3xl p-5 flex items-center justify-between shadow-md">
            <div>
              <div className="text-sm font-bold text-white">Hvordan vurderer du sjåførappen?</div>
              <div className="text-xs text-slate-400 mt-0.5">Din tilbakemelding hjelper oss å bli bedre</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRate(false)}
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center text-lg transition-transform active:scale-95"
              >
                👎
              </button>
              <button
                onClick={() => handleRate(true)}
                className="w-10 h-10 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-lg transition-transform active:scale-95 border border-emerald-500/30"
              >
                👍
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-center text-xs text-emerald-400 font-medium">
            ✓ Takk for din tilbakemelding!
          </div>
        )}

        {/* Trips List */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 block">
            Nylige turer
          </span>

          {completedTrips.length === 0 ? (
            <div className="bg-[#171E2D] border border-white/10 rounded-3xl p-10 text-center space-y-3 shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                <History className="w-7 h-7" />
              </div>
              <div className="text-sm font-bold text-white">Ingen fullførte turer ennå</div>
              <div className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Når du fullfører kjøreoppdrag, vil de lagres her med full kvittering og inntjeningsoversikt.
              </div>
            </div>
          ) : (
            completedTrips.map((trip) => {
              const dateObj = new Date(trip.completedAt || trip.createdAt || Date.now());
              const dateFormatted = dateObj.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
              const timeFormatted = dateObj.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
              const price = trip.finalPrice || trip.estimatedPrice || 0;
              const net = Math.round(price * 0.85);

              return (
                <div
                  key={trip.id}
                  onClick={() => onSelectTrip?.(trip as Trip)}
                  className="bg-[#171E2D] hover:bg-[#1C2538] border border-white/10 hover:border-emerald-500/30 rounded-3xl p-4 cursor-pointer transition-all shadow-md flex items-center justify-between group"
                >
                  <div className="space-y-1.5 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {dateFormatted}, {timeFormatted}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        Fullført
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="truncate max-w-[220px]">
                        {trip.pickup?.address || 'Oslo'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 pl-5 truncate max-w-[220px]">
                      Til: {trip.destination?.address || 'Destinasjon'}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-sm font-black text-white">
                        kr {net.toLocaleString('no-NO')},00
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Brutto {price} kr
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteTrip(e, trip.id)}
                      disabled={deletingId === trip.id}
                      title="Slett bestilling"
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
