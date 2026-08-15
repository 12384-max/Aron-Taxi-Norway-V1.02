import React from 'react';
import { SurgeZone } from '../../types';
import {
  Zap,
  TrendingUp,
  MapPin,
  Flame,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface AdminSurgeTabProps {
  surgeZones: SurgeZone[];
  onToggleSurge: (zoneId: string) => void;
  onUpdateMultiplier: (zoneId: string, multiplier: number) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AdminSurgeTab: React.FC<AdminSurgeTabProps> = ({
  surgeZones,
  onToggleSurge,
  onUpdateMultiplier,
  showToast
}) => {
  return (
    <div className="space-y-6">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Surge & Dynamisk Prising (Oslo Hotspots)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aktiver prisfaktorer ved rushtid, arrangementer, togstans eller uvær i Oslo.
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          {surgeZones.filter(z => z.isActive).length} aktive surge-soner
        </span>
      </div>

      {/* 2. ZONES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {surgeZones.map((zone) => (
          <div key={zone.id} className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg hover:border-amber-500/30 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="font-bold text-white text-sm">{zone.name}</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Radius: {zone.radiusKm} km</span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                  zone.isActive
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                    : 'bg-slate-500/15 border border-slate-500/30 text-slate-400'
                }`}
              >
                {zone.isActive ? 'Aktiv Surge' : 'Normalpris'}
              </span>
            </div>

            <div className="bg-[#0B0F19] p-3 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Multiplikator:</span>
                <span className="font-mono font-black text-lg text-amber-400">{zone.multiplier.toFixed(1)}x</span>
              </div>

              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.1"
                value={zone.multiplier}
                onChange={(e) => onUpdateMultiplier(zone.id, parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>1.0x (Normal)</span>
                <span>1.5x</span>
                <span>2.0x</span>
                <span>2.5x (Maks)</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  onToggleSurge(zone.id);
                  showToast(`${zone.name} surge er nå ${!zone.isActive ? 'aktivert' : 'deaktivert'}`);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  zone.isActive
                    ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                }`}
              >
                {zone.isActive ? 'Slå av Surge' : 'Aktiver Surge'}
              </button>

              <span className="text-[10px] text-slate-500 font-mono">
                {zone.lat.toFixed(3)}, {zone.lng.toFixed(3)}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
