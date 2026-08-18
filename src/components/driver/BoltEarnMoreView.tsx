import React from 'react';
import { 
  ChevronRight, 
  Wallet, 
  Calendar, 
  Percent, 
  Tag, 
  Zap, 
  TrendingUp, 
  Fuel, 
  ShieldCheck, 
  Wrench 
} from 'lucide-react';
import { Trip } from '../../types';

interface BoltEarnMoreViewProps {
  onOpenEarnings: () => void;
  onOpenScheduled: () => void;
  onOpenCampaigns: () => void;
  completedTrips: Trip[];
}

export const BoltEarnMoreView: React.FC<BoltEarnMoreViewProps> = ({
  onOpenEarnings,
  onOpenScheduled,
  onOpenCampaigns,
  completedTrips,
}) => {
  const totalGross = completedTrips.reduce((acc, t) => acc + (t.finalPrice || t.estimatedPrice || 0), 0);
  const netEarnings = Math.round(totalGross * 0.85);

  const todayStr = new Date().toISOString().split('T')[0];
  const countToday = completedTrips.filter((t) =>
    (t.completedAt || t.createdAt || '').startsWith(todayStr)
  ).length;

  return (
    <div className="flex-1 bg-[#10141E] text-white min-h-screen flex flex-col pb-24 animate-in fade-in duration-200">
      
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 bg-[#10141E]/95 backdrop-blur-md border-b border-white/10 px-5 py-4">
        <h1 className="text-xl font-black text-white tracking-tight">Tjen mer (Earn more)</h1>
      </div>

      <div className="p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4">
        
        {/* Weekly Earnings Card */}
        <div
          onClick={onOpenEarnings}
          className="bg-[#171E2D] hover:bg-[#1C2538] border border-white/10 rounded-3xl p-5 cursor-pointer transition-all shadow-xl flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight">
                kr {netEarnings.toLocaleString('no-NO')},00
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Inntjent totalt ({completedTrips.length} {completedTrips.length === 1 ? 'tur' : 'turer'})
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </div>

        {/* Quick Links List */}
        <div className="bg-[#171E2D] border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
          
          {/* Scheduled Rides */}
          <div
            onClick={onOpenScheduled}
            className="p-4 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Forhåndsbestillinger (Scheduled)</div>
                <div className="text-xs text-slate-400">Se tilgjengelige flyplass- og forhåndsbestillinger</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </div>

          {/* Partner Discounts */}
          <div className="p-4 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Spar på nødvendigheter</div>
                <div className="text-xs text-slate-400">Få rabatt på lynlading og bilpleie</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </div>

        </div>

        {/* Section: Campaigns */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Kampanjer & Bonuser</span>
            </h2>
            <button
              onClick={onOpenCampaigns}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Se alle &gt;
            </button>
          </div>

          {/* Campaign Card 1 */}
          <div
            onClick={onOpenCampaigns}
            className="bg-[#171E2D] hover:bg-[#1C2538] border border-white/10 rounded-3xl p-5 cursor-pointer transition-all space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">I dag, 00:00–23:59</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                Bonus 100 NOK
              </span>
            </div>

            <div>
              <div className="text-base font-black text-white">
                Bonus 100 NOK for 10 turer!
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Alle kategorier • Oslo-området
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Turer fullført i dag</span>
                <span className="text-white font-mono font-bold">{countToday} / 10</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((countToday / 10) * 100))}%` }} />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
