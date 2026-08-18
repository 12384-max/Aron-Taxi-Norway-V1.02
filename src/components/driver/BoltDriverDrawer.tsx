import React from 'react';
import { 
  X, 
  ChevronRight, 
  Wallet, 
  History, 
  Tag, 
  Calendar, 
  Settings, 
  Car, 
  LogOut, 
  ShieldCheck, 
  ExternalLink,
  Award,
  Star,
  UserCheck
} from 'lucide-react';
import { Driver, Vehicle } from '../../types';

interface BoltDriverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: Driver;
  currentVehicle?: Vehicle;
  vehicle?: Vehicle;
  onOpenSafety?: () => void;
  onOpenEarnings?: () => void;
  onOpenScheduled?: () => void;
  onOpenCampaigns?: () => void;
  onOpenPreferences?: () => void;
  onSelectNav?: (tab: 'home' | 'earn_more' | 'rides' | 'help' | 'earnings_detail' | 'campaigns' | 'scheduled' | 'preferences' | 'vehicle') => void;
  onLogout?: () => void;
}

export const BoltDriverDrawer: React.FC<BoltDriverDrawerProps> = ({
  isOpen,
  onClose,
  driver,
  currentVehicle,
  vehicle,
  onOpenSafety,
  onOpenEarnings,
  onOpenScheduled,
  onOpenCampaigns,
  onOpenPreferences,
  onSelectNav,
  onLogout,
}) => {
  if (!isOpen) return null;
  const activeVehicle = currentVehicle || vehicle;

  const handleNav = (action: 'earnings_detail' | 'rides' | 'campaigns' | 'scheduled' | 'preferences' | 'vehicle') => {
    onClose();
    if (action === 'earnings_detail' && onOpenEarnings) {
      onOpenEarnings();
      return;
    }
    if (action === 'campaigns' && onOpenCampaigns) {
      onOpenCampaigns();
      return;
    }
    if (action === 'scheduled' && onOpenScheduled) {
      onOpenScheduled();
      return;
    }
    if (action === 'preferences' && onOpenPreferences) {
      onOpenPreferences();
      return;
    }
    if (onSelectNav) {
      onSelectNav(action);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-[320px] bg-[#121722] text-white h-full flex flex-col z-10 shadow-2xl border-r border-white/10 animate-in slide-in-from-left duration-200">
        
        {/* Header / Profile section */}
        <div className="p-5 border-b border-white/10 bg-[#0E131E]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-[#1A2232] flex items-center justify-center text-emerald-400 font-bold text-xl uppercase">
                    {driver?.name?.charAt(0) || 'A'}
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0E131E]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white leading-tight">
                  {driver?.name || 'Aron Sjåfør'}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-200 text-[11px] font-semibold border border-slate-600">
                    <Award className="w-3 h-3 text-slate-300" />
                    Silver
                    <ChevronRight className="w-2.5 h-2.5 opacity-60" />
                  </span>
                  <span className="flex items-center gap-0.5 text-amber-400 text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {driver?.rating?.toFixed(2) || '4.82'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2 stat cards side by side */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <div className="bg-[#1A2232] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-white">99%</div>
              <div className="text-[11px] text-slate-400 font-medium">Driver score</div>
            </div>
            <div className="bg-[#1A2232] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-white">54%</div>
              <div className="text-[11px] text-slate-400 font-medium">Acceptance rate</div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <button
            onClick={() => handleNav('earnings_detail')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Inntjening (Earnings)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          <button
            onClick={() => handleNav('rides')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Turhistorikk (Trip history)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          <button
            onClick={() => handleNav('campaigns')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Kampanjer (Campaigns)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              3 aktive
            </span>
          </button>

          <button
            onClick={() => handleNav('scheduled')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Forhåndsbestillinger (Scheduled)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          <button
            onClick={() => handleNav('vehicle')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-sm block">Kjøretøy</span>
                <span className="text-[11px] text-slate-400 font-mono">{activeVehicle?.model || 'Tesla Model Y'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          <button
            onClick={() => handleNav('preferences')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Innstillinger & Preferanser</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>
        </div>

        {/* Footer links */}
        <div className="p-4 border-t border-white/10 bg-[#0E131E] space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <a 
              href="/for-sjaforer" 
              className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Sjåførportal (Portal)
            </a>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500 text-[11px]">v2.6.0 (Bolt Engine)</span>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logg ut
          </button>
        </div>

      </div>
    </div>
  );
};
