import React, { useState } from 'react';
import { X, Check, Car, Sliders, Zap, Shield, ChevronRight } from 'lucide-react';
import { Driver, Vehicle } from '../../types';
import { toast } from 'sonner';

interface BoltPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: Driver;
  vehicles: Vehicle[];
  currentVehicle?: Vehicle;
  onSelectVehicle: (vehicleId: string) => void;
}

export const BoltPreferencesModal: React.FC<BoltPreferencesModalProps> = ({
  isOpen,
  onClose,
  driver,
  vehicles,
  currentVehicle,
  onSelectVehicle,
}) => {
  const [autoAccept, setAutoAccept] = useState(true);
  const [pickupDistance, setPickupDistance] = useState<number>(5);
  const [categories, setCategories] = useState({
    bolt: true,
    comfort: true,
    premium: true,
    airport_vip: true,
  });
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  if (!isOpen) return null;

  const toggleCategory = (key: keyof typeof categories) => {
    setCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    toast.success('Preferanser oppdatert!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#151B28] text-white rounded-3xl p-5 shadow-2xl border border-white/10 z-10 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Sjåførpreferanser</h3>
              <p className="text-xs text-slate-400">Driver Preferences</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Selection */}
        <div className="bg-[#1D2536] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktivt Kjøretøy</span>
            <button 
              onClick={() => setShowVehiclePicker(!showVehiclePicker)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              {showVehiclePicker ? 'Lukk' : 'Bytt bil'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-slate-300">
              <Car className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{currentVehicle?.model || 'Tesla Model Y 2025'}</div>
              <div className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                {currentVehicle?.licensePlate || 'EL 98450'}
              </div>
            </div>
          </div>

          {showVehiclePicker && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    onSelectVehicle(v.id);
                    setShowVehiclePicker(false);
                    toast.success(`Kjøretøy endret til ${v.model}`);
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    currentVehicle?.id === v.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-black/30 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{v.model}</div>
                    <div className="text-[11px] font-mono text-slate-400">{v.licensePlate}</div>
                  </div>
                  {currentVehicle?.id === v.id && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories (Checklist) */}
        <div className="bg-[#1D2536] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategorier</div>
          
          <div className="space-y-2">
            {[
              { key: 'bolt', name: 'Aron / Bolt Standard', desc: 'Standard turer i Oslo' },
              { key: 'comfort', name: 'Comfort Electric', desc: 'Premium elbil (Tesla / Polestar / Mercedes EQ)' },
              { key: 'premium', name: 'Aron VIP Black', desc: 'Toppsjikte VIP kjøring' },
              { key: 'airport_vip', name: 'Flyplass VIP Transfer', desc: 'Gardermoen faste priser' },
            ].map((item) => {
              const isChecked = categories[item.key as keyof typeof categories];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleCategory(item.key as keyof typeof categories)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 hover:bg-black/40 border border-white/5 cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      isChecked ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-700/50 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Auto-accept toggle */}
        <div className="bg-[#1D2536] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Automatisk godta (Auto-accept)</div>
                <div className="text-[11px] text-slate-400">
                  Godtar turer innenfor dine parametere automatisk
                </div>
              </div>
            </div>
            <button
              onClick={() => setAutoAccept(!autoAccept)}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                autoAccept ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                  autoAccept ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Radius slider */}
        <div className="bg-[#1D2536] border border-white/10 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Maks henteavstand
            </span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {pickupDistance} km
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={pickupDistance}
            onChange={(e) => setPickupDistance(Number(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1 km (Nærområde)</span>
            <span>15 km (Hele Stor-Oslo)</span>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          Lagre preferanser
        </button>

      </div>
    </div>
  );
};
