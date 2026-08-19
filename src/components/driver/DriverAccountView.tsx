import React, { useState } from 'react';
import { Driver, Vehicle, Trip } from '../../types';
import {
  User,
  Phone,
  Mail,
  Shield,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Volume2,
  VolumeX,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Building,
  DollarSign,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface DriverAccountViewProps {
  currentDriver?: Driver;
  currentVehicle?: Vehicle;
  completedTrips: Trip[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
}

export const DriverAccountView: React.FC<DriverAccountViewProps> = ({
  currentDriver,
  currentVehicle,
  completedTrips,
  soundEnabled,
  onToggleSound,
  onLogout
}) => {
  const [navApp, setNavApp] = useState<'google' | 'waze' | 'apple'>('google');
  const [bankAccount, setBankAccount] = useState('1205.45.98765');
  const [payoutSchedule, setPayoutSchedule] = useState<'weekly' | 'daily'>('weekly');
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Real calculations based strictly on completed trips in database
  const totalGross = completedTrips.reduce((acc, t) => acc + (t.finalPrice || t.estimatedPrice || 0), 0);
  const totalNet = Math.round(totalGross * 0.85);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrips = completedTrips.filter(t => (t.completedAt || t.createdAt || '').startsWith(todayStr));
  const todayGross = todayTrips.reduce((acc, t) => acc + (t.finalPrice || t.estimatedPrice || 0), 0);
  const todayNet = Math.round(todayGross * 0.85);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingBank(false);
    toast.success('Utbetalingskonto oppdatert!');
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-24 pt-4 px-4 sm:px-6 max-w-4xl mx-auto space-y-6 text-white font-sans">
      
      {/* HEADER / DRIVER PROFILE CARD */}
      <div className="bg-gradient-to-r from-[#151D2C] to-[#0F1420] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E5B83B] to-[#F3D37A] p-0.5 shadow-xl shadow-amber-500/20 shrink-0">
            <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center font-black text-xl text-[#E5B83B]">
              {currentDriver?.name?.slice(0, 2).toUpperCase() || 'AT'}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{currentDriver?.name || 'Aron Sjåfør'}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase">
                Verifisert Drosjesjåfør
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentDriver?.phone || '+47 96 99 09 01'} • {currentDriver?.email || 'driver@arontaxi.no'}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-mono mt-2">
              <span>Løyve: <strong className="text-[#E5B83B]">{currentDriver?.permitNumber || currentVehicle?.permitNumber || 'OS 10597'}</strong></span>
              <span>•</span>
              <span>Kjøretøy: <strong className="text-white">{currentVehicle?.licensePlate || 'EP 17891'}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>Logg ut</span>
        </button>
      </div>

      {/* EARNINGS & PAYOUTS CARD (85% Driver Payout Calculation from Real Database) */}
      <div className="bg-[#121724] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#E5B83B]" />
            <h3 className="font-black text-base text-white">Inntekt & Utbetalinger (Nets Easy / Oppgjør)</h3>
          </div>
          <span className="text-xs text-emerald-400 font-bold">85% Sjåførprovisjon</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-black/40 border border-white/10 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Netto i dag</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">kr {todayNet}</div>
            <span className="text-[11px] text-slate-400 font-mono">{todayTrips.length} turer fullført</span>
          </div>

          <div className="p-4 bg-black/40 border border-white/10 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Akkumulert netto</span>
            <div className="text-2xl font-black text-white font-mono mt-1">kr {totalNet}</div>
            <span className="text-[11px] text-slate-400 font-mono">{completedTrips.length} turer totalt</span>
          </div>

          <div className="p-4 bg-black/40 border border-white/10 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Utbetalingsplan</span>
            <div className="text-base font-bold text-[#E5B83B] mt-1">Ukentlig oppgjør</div>
            <span className="text-[11px] text-slate-400">Automatisk overføring til bank</span>
          </div>
        </div>

        {/* BANK DETAILS */}
        <div className="p-4 bg-[#161C2C] border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Registrert oppgjørskonto (Bankkonto)</span>
            <span className="text-sm font-mono font-bold text-white">{bankAccount}</span>
          </div>

          {isEditingBank ? (
            <form onSubmit={handleSaveBank} className="flex items-center gap-2">
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="bg-black/50 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl"
              >
                Lagre
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsEditingBank(true)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl border border-white/10 text-slate-300"
            >
              Endre konto
            </button>
          )}
        </div>
      </div>

      {/* APP SETTINGS & NAVIGATION PREFERENCE */}
      <div className="bg-[#121724] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Settings className="w-5 h-5 text-[#E5B83B]" />
          <h3 className="font-black text-base text-white">App-innstillinger & Navigasjon</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Sound toggle */}
          <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-slate-300">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Lydvarsler for nye turer</span>
                <span className="text-[10px] text-slate-400">Spill varselsignal når tur tikker inn</span>
              </div>
            </div>

            <button
              onClick={onToggleSound}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                soundEnabled ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/10 text-slate-400'
              }`}
            >
              {soundEnabled ? 'PÅ' : 'AV'}
            </button>
          </div>

          {/* Navigation App */}
          <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-[#E5B83B]">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Foretrukket karttjeneste</span>
                <span className="text-[10px] text-slate-400">Brukes ved GPS-navigasjon</span>
              </div>
            </div>

            <select
              value={navApp}
              onChange={(e) => setNavApp(e.target.value as any)}
              className="bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none"
            >
              <option value="google">Google Maps</option>
              <option value="waze">Waze</option>
              <option value="apple">Apple Maps</option>
            </select>
          </div>
        </div>
      </div>

      {/* OFFICIAL LICENSES & CERTIFICATES */}
      <div className="bg-[#121724] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="font-black text-base text-white">Drosjedokumentasjon & Sertifikater</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-white block">Kjøreseddel for persontransport</span>
                <span className="text-[10px] text-slate-400">Gyldig til 2029 (Politidirektoratet)</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg">Aktiv</span>
          </div>

          <div className="p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-white block">Drosjeløyve #{currentDriver?.permitNumber || 'OS 10597'}</span>
                <span className="text-[10px] text-slate-400">Tildelt av Samferdselsmyndigheten</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg">Godkjent</span>
          </div>

          <div className="p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-white block">Nets Easy Betalingsoppgjør</span>
                <span className="text-[10px] text-slate-400">Test- & Produksjonsmiljø aktivt</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg">Tilkoblet</span>
          </div>

          <div className="p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-white block">Yrkesskade- & Kaskoforsikring</span>
                <span className="text-[10px] text-slate-400">Full dekning for sjåfør og passasjerer</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg">Aktiv</span>
          </div>
        </div>
      </div>

    </div>
  );
};
