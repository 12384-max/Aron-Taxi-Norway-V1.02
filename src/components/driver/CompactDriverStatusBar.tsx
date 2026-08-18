import React from 'react';
import { Radio, Zap, ChevronRight } from 'lucide-react';

interface CompactDriverStatusBarProps {
  isOnline: boolean;
  todayNet: number;
  todayTripsCount: number;
  driverScore: number | string;
  onlineDurationText: string;
  vehicleName: string;
  vehiclePlate: string;
  onOpenEarnings: () => void;
  onOpenTrips: () => void;
}

export const CompactDriverStatusBar: React.FC<CompactDriverStatusBarProps> = ({
  isOnline,
  todayNet,
  todayTripsCount,
  driverScore,
  onlineDurationText,
  vehicleName,
  vehiclePlate,
  onOpenEarnings,
  onOpenTrips
}) => {
  if (!isOnline) return null;

  return (
    <div className="bg-[#111622]/90 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-xl flex items-center justify-between gap-3 text-white max-w-xl mx-auto">
      
      {/* 1. Radar / Online status pill */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 relative z-10" />
        </div>
        <div>
          <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block">
            Online
          </span>
          <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">
            {onlineDurationText}
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-white/10 shrink-0" />

      {/* 2. Netto i dag */}
      <button
        onClick={onOpenEarnings}
        className="text-left hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span className="text-[9px] text-slate-400 block font-medium group-hover:text-slate-200">Netto i dag</span>
        <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">kr {todayNet}</span>
      </button>

      <div className="h-6 w-px bg-white/10 shrink-0" />

      {/* 3. Turer i dag */}
      <button
        onClick={onOpenTrips}
        className="text-left hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span className="text-[9px] text-slate-400 block font-medium group-hover:text-slate-200">Turer i dag</span>
        <span className="text-xs sm:text-sm font-black text-white">{todayTripsCount}</span>
      </button>

      <div className="h-6 w-px bg-white/10 shrink-0" />

      {/* 4. Sjåførscore */}
      <div className="text-left">
        <span className="text-[9px] text-slate-400 block font-medium">Sjåførscore</span>
        <span className="text-xs sm:text-sm font-black text-white font-mono">{driverScore}</span>
      </div>

    </div>
  );
};
