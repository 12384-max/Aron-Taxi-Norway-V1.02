import React, { useState } from 'react';
import { Vehicle, Driver } from '../../types';
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  FileText,
  BatteryCharging,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface DriverVehiclesViewProps {
  currentDriver?: Driver;
  vehicles: Vehicle[];
  onSelectVehicle: (driverId: string, vehicleId: string) => Promise<void>;
  onClose?: () => void;
}

export const DriverVehiclesView: React.FC<DriverVehiclesViewProps> = ({
  currentDriver,
  vehicles,
  onSelectVehicle,
  onClose
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    currentDriver?.vehicleId || vehicles[0]?.id || ''
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklist, setChecklist] = useState({
    lights: true,
    tires: true,
    taximeter: true,
    interiorClean: true,
    documentsOk: true,
  });

  const handleActivateVehicle = async (vehicleId: string) => {
    if (!currentDriver) return;
    setIsUpdating(true);
    try {
      await onSelectVehicle(currentDriver.id, vehicleId);
      setSelectedVehicleId(vehicleId);
      toast.success('Kjøretøy oppdatert! Bilen er nå tilknyttet din sjåførprofil.');
    } catch (err: any) {
      toast.error(err?.message || 'Kunne ikke bytte bil.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  return (
    <div className="w-full h-full overflow-y-auto pb-24 pt-4 px-4 sm:px-6 max-w-4xl mx-auto space-y-6 text-white font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E5B83B]/10 text-[#E5B83B] border border-[#E5B83B]/30">
              <Car className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Biler & Kjøretøystatus
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Administrer ditt aktive drosjekjøretøy, løyvetilknytning og teknisk status for Aron Taxi Norway.
          </p>
        </div>

        <button
          onClick={() => setShowChecklist(!showChecklist)}
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-2 self-start sm:self-auto cursor-pointer transition-all"
        >
          <Shield className="w-4 h-4 text-[#E5B83B]" />
          <span>{showChecklist ? 'Skjul sjekkliste' : 'Daglig bilkontroll'}</span>
        </button>
      </div>

      {/* DAILY VEHICLE CHECKLIST (Optional Collapsible) */}
      {showChecklist && (
        <div className="bg-[#121724] border border-[#E5B83B]/30 rounded-3xl p-5 shadow-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#E5B83B] flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Daglig før-tur kontroll (Krav iht. Drosjeforskriften)
            </h3>
            <span className="text-[10px] text-slate-400">Dato: {new Date().toLocaleDateString('no-NO')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5">
              <input
                type="checkbox"
                checked={checklist.lights}
                onChange={() => handleToggleChecklist('lights')}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
              />
              <span>Utvendige lys, bremser & blinklys OK</span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5">
              <input
                type="checkbox"
                checked={checklist.tires}
                onChange={() => handleToggleChecklist('tires')}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
              />
              <span>Dekkmønster & dekktrykk kontrollert</span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5">
              <input
                type="checkbox"
                checked={checklist.taximeter}
                onChange={() => handleToggleChecklist('taximeter')}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
              />
              <span>Taklykt & taksameter/app i drift</span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5">
              <input
                type="checkbox"
                checked={checklist.interiorClean}
                onChange={() => handleToggleChecklist('interiorClean')}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
              />
              <span>Kupé ren, desinfisert & røykfri</span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 sm:col-span-2">
              <input
                type="checkbox"
                checked={checklist.documentsOk}
                onChange={() => handleToggleChecklist('documentsOk')}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
              />
              <span>Vognkort, løyvedokument & skademeldingsskjema til stede i bil</span>
            </label>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={() => {
                toast.success('Daglig bilkontroll godkjent og loggført!');
                setShowChecklist(false);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
            >
              Godkjenn sjekkliste
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE CAR HIGHLIGHT CARD */}
      {activeVehicle && (
        <div className="bg-gradient-to-br from-[#151D2C] to-[#0E131E] border-2 border-[#E5B83B] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Car className="w-36 h-36" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  AKTIV BIL I DRIFT
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Løyve: <strong className="text-slate-200">{activeVehicle.permitNumber || 'OS 10597'}</strong>
                </span>
              </div>

              <div className="px-3 py-1 bg-black/40 border border-white/10 rounded-xl font-mono text-sm font-black text-[#E5B83B] tracking-wider">
                {activeVehicle.licensePlate}
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{activeVehicle.model}</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeVehicle.category === 'vip_black'
                  ? 'Aron VIP Executive • Svart Luksus'
                  : 'Aron Flyplass VIP Express'}
              </p>
            </div>

            {/* SPECS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 bg-black/30 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold">
                  <Users className="w-3.5 h-3.5 text-[#E5B83B]" />
                  <span>Kapasitet</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {activeVehicle.capacity || 4} passasjerer
                </div>
              </div>

              <div className="p-3 bg-black/30 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold">
                  <Briefcase className="w-3.5 h-3.5 text-[#E5B83B]" />
                  <span>Bagasje</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {activeVehicle.luggageCapacity || 3} store kolli
                </div>
              </div>

              <div className="p-3 bg-black/30 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Drivlinje</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  100% Elektrisk (EV)
                </div>
              </div>

              <div className="p-3 bg-black/30 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Status</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 mt-1 capitalize">
                  {activeVehicle.status === 'active' ? 'Operativ' : activeVehicle.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLEET LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
            Tilgjengelige Biler i Flåten ({vehicles.length})
          </h3>
          <span className="text-xs text-slate-400">Trykk for å bytte aktiv bil</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {vehicles.map((v) => {
            const isCurrent = (currentDriver?.vehicleId === v.id) || (selectedVehicleId === v.id);

            return (
              <div
                key={v.id}
                className={`p-4 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-[#151D2C] border-emerald-500/80 shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-500/20'
                    : 'bg-[#101522] border-white/10 hover:border-white/20 hover:bg-[#131A2A]'
                }`}
                onClick={() => !isCurrent && handleActivateVehicle(v.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-black/50 border border-white/10 rounded-xl font-mono text-xs font-black text-[#E5B83B]">
                      {v.licensePlate}
                    </span>

                    {isCurrent ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Valgt
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Løyve #{v.permitNumber || 'OS 10597'}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{v.model}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {v.category === 'vip_black' ? 'Luksus Sedann / SUV' : 'VIP Flyplasstransport'} • {v.capacity || 4} seter
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-3">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Tilgjengelig for oppdrag</span>
                  </div>

                  {!isCurrent && (
                    <button
                      disabled={isUpdating}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateVehicle(v.id);
                      }}
                      className="px-3 py-1.5 bg-[#E5B83B] hover:bg-[#d4a832] text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Velg denne
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
