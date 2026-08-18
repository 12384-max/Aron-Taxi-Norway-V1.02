import React from 'react';
import { ArrowLeft, Tag, Info, CheckCircle2, ChevronRight, Gift, Sparkles } from 'lucide-react';
import { Trip } from '../../types';

interface BoltCampaignsModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedTrips?: Trip[];
}

export const BoltCampaignsModal: React.FC<BoltCampaignsModalProps> = ({
  isOpen,
  onClose,
  completedTrips = [],
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrips = completedTrips.filter((t) =>
    (t.completedAt || t.createdAt || '').startsWith(todayStr)
  );
  const countToday = todayTrips.length;

  const target1 = 10;
  const progress1 = Math.min(100, Math.round((countToday / target1) * 100));

  const target2 = 20;
  const progress2 = Math.min(100, Math.round((countToday / target2) * 100));

  const totalBonuses = (countToday >= target1 ? 100 : 0) + (countToday >= target2 ? 175 : 0);

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
        <h1 className="text-base font-bold text-white">Kampanjer & Bonuser (Campaigns)</h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 max-w-lg mx-auto w-full space-y-5">
        
        {/* Current Bonus Banner */}
        <div className="bg-[#171E2D] border border-white/10 rounded-3xl p-6 text-center space-y-2 shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Opptjente bonuser i dag</span>
          <div className="text-3xl font-black text-emerald-400">kr {totalBonuses},00</div>
          <p className="text-xs text-slate-400">
            {countToday > 0 
              ? `${countToday} fullførte turer registrert i dag. Bonuser legges automatisk til din utbetaling.` 
              : 'Fullfør oppdrag for å låse opp dagens nivå-bonuser.'}
          </p>
        </div>

        {/* Section: Active Now */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Aktive kampanjer i Oslo
          </h2>

          {/* Campaign 1 */}
          <div className="bg-[#171E2D] border border-white/10 rounded-3xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">I dag, 00:00–23:59</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                Bonus 100 NOK
              </span>
            </div>

            <div>
              <div className="text-base font-black text-white">Bonus 100 NOK for 10 turer!</div>
              <div className="text-xs text-slate-400 mt-0.5">Alle kategorier • Oslo • Krever min. 80% akseptgrad</div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Fremgang</span>
                <span className="text-white font-mono font-bold">{countToday} / {target1} turer</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress1}%` }} />
              </div>
            </div>
          </div>

          {/* Campaign 2 */}
          <div className="bg-[#171E2D] border border-white/10 rounded-3xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">I dag, 00:00–23:59</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold border border-amber-500/30">
                Superbonus 175 NOK
              </span>
            </div>

            <div>
              <div className="text-base font-black text-white">Ekstrabonus 175 NOK for 20 turer!</div>
              <div className="text-xs text-slate-400 mt-0.5">Nå 20 turer for å maksimere dagens provisjonsfrihet</div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Fremgang</span>
                <span className="text-white font-mono font-bold">{countToday} / {target2} turer</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${progress2}%` }} />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
