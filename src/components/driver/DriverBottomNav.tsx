import React from 'react';
import { Car, CalendarPlus, Navigation, User, Bell } from 'lucide-react';

export type DriverNavTab = 'vehicles' | 'bookings' | 'driver' | 'account';

interface DriverBottomNavProps {
  activeTab: DriverNavTab;
  onSelectTab: (tab: DriverNavTab) => void;
  pendingCount?: number;
  hasActiveTrip?: boolean;
  isOnline?: boolean;
}

export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingCount = 0,
  hasActiveTrip = false,
  isOnline = false,
}) => {
  return (
    <nav
      id="driver-bottom-navigation"
      aria-label="Sjåfør Hovednavigasjon"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#0B0F19]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl px-2 sm:px-6 py-2 transition-all"
    >
      <div className="max-w-xl mx-auto grid grid-cols-4 gap-1 sm:gap-2">
        {/* 1. BILER */}
        <button
          id="driver-nav-biler"
          onClick={() => onSelectTab('vehicles')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
            activeTab === 'vehicles'
              ? 'bg-white/10 text-[#E5B83B] font-bold shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="relative">
            <Car className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'vehicles' ? 'text-[#E5B83B]' : 'text-slate-400'}`} />
          </div>
          <span className="text-[11px] sm:text-xs mt-1 tracking-tight">Biler</span>
        </button>

        {/* 2. BESTILL (Ordre / Oppdrag) */}
        <button
          id="driver-nav-bestill"
          onClick={() => onSelectTab('bookings')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative ${
            activeTab === 'bookings'
              ? 'bg-white/10 text-[#E5B83B] font-bold shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="relative">
            <CalendarPlus className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'bookings' ? 'text-[#E5B83B]' : 'text-slate-400'}`} />
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-bounce shadow-md">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-[11px] sm:text-xs mt-1 tracking-tight">Bestill</span>
        </button>

        {/* 3. DRIVER (Hovedvisning / Kart) */}
        <button
          id="driver-nav-driver"
          onClick={() => onSelectTab('driver')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative ${
            activeTab === 'driver'
              ? 'bg-emerald-500/15 text-emerald-400 font-black shadow-inner border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="relative">
            <Navigation className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'driver' ? 'text-emerald-400' : 'text-slate-400'}`} />
            {isOnline && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B0F19] animate-pulse" />
            )}
            {hasActiveTrip && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#0B0F19] animate-ping" />
            )}
          </div>
          <span className="text-[11px] sm:text-xs mt-1 tracking-tight font-semibold">Driver</span>
        </button>

        {/* 4. KONTO */}
        <button
          id="driver-nav-konto"
          onClick={() => onSelectTab('account')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
            activeTab === 'account'
              ? 'bg-white/10 text-[#E5B83B] font-bold shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="relative">
            <User className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'account' ? 'text-[#E5B83B]' : 'text-slate-400'}`} />
          </div>
          <span className="text-[11px] sm:text-xs mt-1 tracking-tight">Konto</span>
        </button>
      </div>
    </nav>
  );
};
