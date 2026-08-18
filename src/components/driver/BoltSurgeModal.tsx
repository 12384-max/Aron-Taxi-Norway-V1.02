import React, { useState } from 'react';
import { X, Flame, Map, Check, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface BoltSurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: (enabled: boolean) => void;
}

export const BoltSurgeModal: React.FC<BoltSurgeModalProps> = ({
  isOpen,
  onClose,
  showHeatmap,
  onToggleHeatmap,
}) => {
  if (!isOpen) return null;

  const surgeZones = [
    { area: 'Oslo Sentrum (Karl Johan / Jernbanetorget)', multiplier: '1.6x', level: 'Svært høy etterspørsel', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    { area: 'Oslo Lufthavn (OSL Gardermoen)', multiplier: '1.8x', level: 'Høy etterspørsel (Flyankomster)', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
    { area: 'Grünerløkka & Vulkan', multiplier: '1.4x', level: 'Kveldsrush & uteliv', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
    { area: 'Majorstuen & Frogner', multiplier: '1.3x', level: 'Moderat etterspørsel', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#151B28] text-white rounded-3xl p-5 shadow-2xl border border-white/10 z-10 space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Kartvisning & Surge</h3>
              <p className="text-xs text-slate-400">Map view & Heatmap</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Heatmap Type selection */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Kartlag</span>
          
          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => {
                onToggleHeatmap(true);
                toast.success('Surge-varmekart aktivert!');
              }}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 cursor-pointer transition-colors ${
                showHeatmap
                  ? 'bg-amber-500/15 border-amber-500 text-white'
                  : 'bg-[#1D2536] hover:bg-[#253046] border-white/5 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Flame className="w-5 h-5 text-amber-400" />
                {showHeatmap && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <div>
                <div className="text-xs font-bold">Surge-varmekart</div>
                <div className="text-[10px] text-slate-400">Viser områder med høy etterspørsel</div>
              </div>
            </div>

            <div
              onClick={() => {
                onToggleHeatmap(false);
                toast.info('Standard kart valgt');
              }}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 cursor-pointer transition-colors ${
                !showHeatmap
                  ? 'bg-emerald-500/15 border-emerald-500 text-white'
                  : 'bg-[#1D2536] hover:bg-[#253046] border-white/5 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Map className="w-5 h-5 text-emerald-400" />
                {!showHeatmap && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <div>
                <div className="text-xs font-bold">Standard kart</div>
                <div className="text-[10px] text-slate-400">Rent kart uten etterspørselslag</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Surge Zones */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Aktive Surge-soner i Oslo
            </span>
            <span className="text-[11px] text-amber-400 font-mono font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" /> Live
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {surgeZones.map((zone, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#1D2536] border border-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{zone.area}</div>
                  <div className="text-[10px] text-slate-400">{zone.level}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono border ${zone.color}`}>
                  {zone.multiplier}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-colors"
        >
          Fullfør
        </button>

      </div>
    </div>
  );
};
