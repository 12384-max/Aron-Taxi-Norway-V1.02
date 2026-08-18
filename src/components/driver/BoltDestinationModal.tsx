import React, { useState } from 'react';
import { X, Navigation, Award, Home, Star, MapPin, Search, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BoltDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetDestination: (address: string) => void;
  activeDestination?: string;
}

export const BoltDestinationModal: React.FC<BoltDestinationModalProps> = ({
  isOpen,
  onClose,
  onSetDestination,
  activeDestination,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDest, setSelectedDest] = useState(activeDestination || '');

  if (!isOpen) return null;

  const quickDestinations = [
    { label: 'Hjem', address: 'Majorstuen, Oslo', icon: Home },
    { label: 'Oslo S / Sentrum', address: 'Jernbanetorget 1, 0154 Oslo', icon: Star },
    { label: 'Oslo Lufthavn (OSL)', address: 'Edvard Munchs veg, Gardermoen', icon: Star },
    { label: 'Fornebu / IT Fornebu', address: 'Snarøyveien 30, Fornebu', icon: Star },
    { label: 'Tveita Senter', address: 'Tvetenveien 150, 0671 Oslo', icon: Star },
  ];

  const handleApply = (address: string) => {
    setSelectedDest(address);
    onSetDestination(address);
    toast.success(`Destinasjonsmodus satt: Turer mot ${address}`);
    onClose();
  };

  const handleClear = () => {
    setSelectedDest('');
    onSetDestination('');
    toast.info('Destinasjonsmodus slått av');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#151B28] text-white rounded-3xl p-5 shadow-2xl border border-white/10 z-10 space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Destinasjonsmodus</h3>
              <p className="text-xs text-slate-400">Trips towards destination</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tier badge & remaining count */}
        <div className="p-3 rounded-2xl bg-[#1D2536] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-semibold text-slate-200">Silver-nivå</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
            4 turer igjen i dag
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Søk eller angi adresse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1D2536] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Quick addresses list */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Favoritter & populære destinasjoner
          </span>

          {quickDestinations
            .filter((d) => !searchQuery || d.label.toLowerCase().includes(searchQuery.toLowerCase()) || d.address.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedDest === item.address;
              return (
                <div
                  key={idx}
                  onClick={() => handleApply(item.address)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-[#1D2536] hover:bg-[#253046] border-white/5 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-black/30 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[220px]">{item.address}</div>
                    </div>
                  </div>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <MapPin className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              );
            })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {activeDestination && (
            <button
              onClick={handleClear}
              className="flex-1 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition-colors"
            >
              Slå av
            </button>
          )}
          {searchQuery && (
            <button
              onClick={() => handleApply(searchQuery)}
              className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors"
            >
              Sett som destinasjon
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
