import React from 'react';
import { LeafletMap } from '../LeafletMap';
import { Trip, Driver, Vehicle, UserProfile } from '../../types';
import {
  Car,
  DollarSign,
  Users,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Radio,
  Calendar,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Compass
} from 'lucide-react';

interface AdminOverviewTabProps {
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: UserProfile[];
  assignDriverToTrip: (tripId: string, driverId: string) => void;
  updateTripStatus: (tripId: string, status: any) => void;
  dateRange: 'day' | 'week' | 'month' | 'total';
  setDateRange: (range: 'day' | 'week' | 'month' | 'total') => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  trips,
  drivers,
  vehicles,
  customers,
  assignDriverToTrip,
  updateTripStatus,
  dateRange,
  setDateRange
}) => {
  const activeOnlineDrivers = drivers.filter((d) => d.isOnline).length;
  const completedTrips = trips.filter((t) => t.status === 'completed');
  const pendingTrips = trips.filter((t) => ['requested', 'searching_driver', 'pending'].includes(t.status));
  const activeTrips = trips.filter((t) => ['driver_assigned', 'driver_arriving', 'driver_arrived', 'trip_started', 'accepted', 'active'].includes(t.status));
  const cancelledTrips = trips.filter((t) => t.status === 'cancelled' || t.status === 'rejected');
  const preorderTrips = trips.filter((t) => t.isPreorder);
  const instantTrips = trips.filter((t) => !t.isPreorder);

  const totalGrossRevenue = trips.reduce((sum, t) => sum + (t.finalPrice || t.estimatedPrice || 0), 0);
  const totalAronCommission = trips.reduce((sum, t) => sum + (t.commissionAron || Math.round((t.finalPrice || t.estimatedPrice || 0) * 0.15)), 0);
  const totalDriverPayouts = totalGrossRevenue - totalAronCommission;

  // Active Users percentages
  const driverActivePercent = Math.min(100, Math.round((activeOnlineDrivers / Math.max(drivers.length, 1)) * 100));
  const riderActivePercent = Math.min(100, Math.round((Math.max(activeTrips.length, 1) / Math.max(customers.length, 1)) * 100) || 68);

  // Status breakdown for Donut Chart
  const statusCounts = {
    requested: pendingTrips.length,
    active: activeTrips.length,
    completed: completedTrips.length,
    cancelled: cancelledTrips.length
  };
  const totalStatusTrips = Math.max(trips.length, 1);

  // Cash flow mock data for weekly bar chart
  const weekDays = [
    { day: 'Man', gross: Math.round(totalGrossRevenue * 0.12), payout: Math.round(totalGrossRevenue * 0.12 * 0.85) },
    { day: 'Tir', gross: Math.round(totalGrossRevenue * 0.14), payout: Math.round(totalGrossRevenue * 0.14 * 0.85) },
    { day: 'Ons', gross: Math.round(totalGrossRevenue * 0.15), payout: Math.round(totalGrossRevenue * 0.15 * 0.85) },
    { day: 'Tor', gross: Math.round(totalGrossRevenue * 0.18), payout: Math.round(totalGrossRevenue * 0.18 * 0.85) },
    { day: 'Fre', gross: Math.round(totalGrossRevenue * 0.22), payout: Math.round(totalGrossRevenue * 0.22 * 0.85) },
    { day: 'Lør', gross: Math.round(totalGrossRevenue * 0.26), payout: Math.round(totalGrossRevenue * 0.26 * 0.85) },
    { day: 'Søn', gross: Math.round(totalGrossRevenue * 0.19), payout: Math.round(totalGrossRevenue * 0.19 * 0.85) }
  ];
  const maxGross = Math.max(...weekDays.map(w => w.gross), 1000);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP TIME FILTER CONTROLS (INFINITE CAB STYLE) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Oversikt & Sanntidsmålinger</h3>
            <p className="text-[11px] text-slate-400">Live telemetri fra Aron Taxi Oslo-nettverket</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0D121D] p-1 rounded-xl border border-white/10 text-xs">
          {(['day', 'week', 'month', 'total'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all uppercase cursor-pointer ${
                dateRange === r
                  ? 'bg-[#D4AF37] text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'day' ? 'I Dag' : r === 'week' ? 'Uke' : r === 'month' ? 'Måned' : 'Totalt'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. INFINITE CAB KPI SECTION: STATISTICS BOX & TRIPSHEET BOX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* A: STATISTICS BOX */}
        <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D186] animate-pulse" />
              <h3 className="font-display text-base font-black text-white uppercase tracking-wider">
                Statistikk & Nøkkeltall
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/20">
              Live Fleet
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Active Drivers - Yellow Box */}
            <div className="bg-gradient-to-br from-[#D4AF37] to-[#B89020] text-slate-950 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex justify-between items-center text-slate-900">
                <span className="text-[10px] font-black uppercase tracking-wider">Aktive Sjåfører</span>
                <Car className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-2xl font-black">{activeOnlineDrivers} / {drivers.length}</div>
              <div className="text-[10px] font-bold text-slate-900/80">Sjåfører pålogget i Oslo</div>
            </div>

            {/* Total Wallet / Driver Payouts - Dark Box */}
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Sjåføroppgjør (85%)</span>
                <DollarSign className="w-4 h-4 text-[#34D186]" />
              </div>
              <div className="text-2xl font-black text-[#34D186] font-mono">{totalDriverPayouts} kr</div>
              <div className="text-[10px] text-slate-500 font-medium">Utbetaling til sjåfører</div>
            </div>

            {/* Total Riders - Dark Box */}
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Passasjerer</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{customers.length}</div>
              <div className="text-[10px] text-slate-500 font-medium">Kunder og bedrifter</div>
            </div>

            {/* Total Revenue - Yellow Box */}
            <div className="bg-gradient-to-br from-[#D4AF37] to-[#B89020] text-slate-950 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex justify-between items-center text-slate-900">
                <span className="text-[10px] font-black uppercase tracking-wider">Totalomsetning</span>
                <TrendingUp className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-2xl font-black font-mono">{totalGrossRevenue} kr</div>
              <div className="text-[10px] font-bold text-slate-900/80">Inkl. MVA & provisjoner</div>
            </div>
          </div>
        </div>

        {/* B: TRIPSHEET BOX */}
        <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <h3 className="font-display text-base font-black text-white uppercase tracking-wider">
                Turavvikling & Oppdrag
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full">
              {trips.length} Totale Oppdrag
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Instant Trips - Yellow Box */}
            <div className="bg-gradient-to-br from-[#D4AF37] to-[#B89020] text-slate-950 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex justify-between items-center text-slate-900">
                <span className="text-[10px] font-black uppercase tracking-wider">Direkteturer</span>
                <Zap className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-2xl font-black">{instantTrips.length}</div>
              <div className="text-[10px] font-bold text-slate-900/80">Bestillinger direkte i app</div>
            </div>

            {/* Future / Preorder Trips - Dark Box */}
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Forhåndsbestillinger</span>
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono">{preorderTrips.length}</div>
              <div className="text-[10px] text-slate-500 font-medium">Planlagte turer / Flyplass</div>
            </div>

            {/* Rejected / Cancelled Trips - Dark Box */}
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Avbrutte Turer</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono">{cancelledTrips.length}</div>
              <div className="text-[10px] text-slate-500 font-medium">Kansellert eller avvist</div>
            </div>

            {/* Completed Trips - Yellow Box */}
            <div className="bg-gradient-to-br from-[#D4AF37] to-[#B89020] text-slate-950 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex justify-between items-center text-slate-900">
                <span className="text-[10px] font-black uppercase tracking-wider">Fullførte Turer</span>
                <CheckCircle2 className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-2xl font-black">{completedTrips.length}</div>
              <div className="text-[10px] font-bold text-slate-900/80">Vellykkede leveranser</div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. ACTIVE USERS GAUGES, TRIP STATUS DONUT & CASH FLOW CHART */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* WIDGET 1: ACTIVE USERS CIRCULAR GAUGES */}
        <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider">
              Aktivitetsgrad
            </h3>
            <span className="text-[10px] text-[#34D186] font-bold">Sanntid</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            {/* Rider Gauge */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#D4AF37]"
                    strokeDasharray={`${riderActivePercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute font-mono font-black text-base text-white">
                  {riderActivePercent}%
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Kunder Aktive</span>
                <span className="text-[10px] text-slate-500">{customers.length} registrerte</span>
              </div>
            </div>

            {/* Driver Gauge */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#34D186]"
                    strokeDasharray={`${driverActivePercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute font-mono font-black text-base text-white">
                  {driverActivePercent}%
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Sjåfører På Vakt</span>
                <span className="text-[10px] text-slate-500">{activeOnlineDrivers} på vakt</span>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 2: TRIP STATUS DONUT / PIE CHART */}
        <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider">
              Turstatus Fordeling
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">{trips.length} totalt</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-300 font-medium">Ventende / Søker</span>
              </div>
              <span className="font-mono font-bold text-white">{statusCounts.requested} ({Math.round((statusCounts.requested / totalStatusTrips) * 100)}%)</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-300 font-medium">Pågående / Aktiv</span>
              </div>
              <span className="font-mono font-bold text-white">{statusCounts.active} ({Math.round((statusCounts.active / totalStatusTrips) * 100)}%)</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#34D186]" />
                <span className="text-slate-300 font-medium">Fullført</span>
              </div>
              <span className="font-mono font-bold text-[#34D186]">{statusCounts.completed} ({Math.round((statusCounts.completed / totalStatusTrips) * 100)}%)</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-300 font-medium">Kansellert</span>
              </div>
              <span className="font-mono font-bold text-rose-400">{statusCounts.cancelled} ({Math.round((statusCounts.cancelled / totalStatusTrips) * 100)}%)</span>
            </div>
          </div>
        </div>

        {/* WIDGET 3: TRIPS CASH FLOW (WEEKLY REVENUE GRAPH) */}
        <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <div>
              <h3 className="font-display text-sm font-black text-white uppercase tracking-wider">
                Kontantstrøm / Cash Flow
              </h3>
              <p className="text-[10px] text-slate-400">Ukentlig bruttoomsetning</p>
            </div>
            <span className="text-xs font-black text-[#D4AF37] font-mono">{totalGrossRevenue} kr</span>
          </div>

          <div className="flex items-end justify-between gap-1.5 h-36 pt-4 px-1">
            {weekDays.map((w, idx) => {
              const heightPercent = Math.max(15, Math.min(100, Math.round((w.gross / maxGross) * 100)));
              return (
                <div key={`weekday-bar-${w.day}-${idx}`} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="w-full bg-slate-800 rounded-t-lg relative flex items-end overflow-hidden h-28">
                    <div
                      className="w-full bg-gradient-to-t from-[#D4AF37] to-[#F5D77F] group-hover:brightness-125 transition-all rounded-t-lg"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{w.day}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. DRIVER AREA / LIVE FLEET MAP & DISPATCH QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEAFLET MAP (7 COLS) */}
        <div className="lg:col-span-7 bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#D4AF37]" />
              Driver Area / Flåtekart i Sanntid
            </h2>
            <span className="text-[11px] text-[#34D186] font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#34D186] animate-pulse" />
              {activeOnlineDrivers} aktive biler på kartet
            </span>
          </div>

          <LeafletMap
            driverLocation={drivers.find((d) => d.isOnline)?.currentLocation || { lat: 59.9139, lng: 10.7522 }}
            className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden border border-white/10"
            zoom={12}
          />

          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 bg-[#0B0F19] p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D186]" />
              <span>Grønn bil: På vakt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <span>Gull A: Hentested</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Rød B: Destinasjon</span>
            </div>
          </div>
        </div>

        {/* LIVE DISPATCH QUEUE (5 COLS) */}
        <div className="lg:col-span-5 bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#34D186] animate-pulse" />
                Aktiv Dispatch Kø ({trips.filter((t) => !['completed', 'cancelled', 'rejected'].includes(t.status)).length})
              </h3>
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">
                Sanntid
              </span>
            </div>

            <div className="space-y-3 mt-4 max-h-96 overflow-y-auto pr-1">
              {trips.filter((t) => !['completed', 'cancelled', 'rejected'].includes(t.status)).length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-[#0B0F19] rounded-2xl border border-white/5 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#34D186] mx-auto opacity-70" />
                  <p className="font-bold text-slate-300">Ingen ventende oppdrag akkurat nå</p>
                  <p className="text-[11px] text-slate-500">Alle turer er betjent av sjåførene.</p>
                </div>
              ) : (
                trips
                  .filter((t) => !['completed', 'cancelled', 'rejected'].includes(t.status))
                  .map((trip, tripIdx) => {
                    const uniqueTripKey = trip.id ? `dispatch-trip-${trip.id}-${tripIdx}` : `dispatch-idx-${tripIdx}`;
                    return (
                      <div key={uniqueTripKey} className="p-4 bg-[#0B0F19] rounded-2xl border border-white/10 space-y-2.5 hover:border-[#D4AF37]/40 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-xs font-bold text-[#D4AF37]">{trip.id || `TRIP-${tripIdx}`}</span>
                            <p className="text-xs font-semibold text-white mt-0.5">{trip.customerName}</p>
                            <span className="text-[10px] text-slate-400">{trip.customerPhone}</span>
                          </div>
                          <span className="px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black rounded-full uppercase">
                            {trip.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <p className="truncate"><b className="text-slate-300">Fra:</b> {trip.pickup?.address || 'Hentested'}</p>
                          <p className="truncate"><b className="text-slate-300">Til:</b> {trip.destination?.address || 'Destinasjon'}</p>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                          <span className="font-bold text-white font-mono">{trip.estimatedPrice || 0} NOK</span>
                          
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <span className="text-[10px] text-slate-500">Tildel:</span>
                            {drivers.map((d, dIdx) => (
                              <button
                                key={`assign-${trip.id || tripIdx}-${d.id || dIdx}`}
                                onClick={() => assignDriverToTrip(trip.id, d.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  trip.driverId === d.id
                                    ? 'bg-[#34D186] text-slate-950 font-black shadow-md'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                }`}
                              >
                                {d.name ? d.name.split(' ')[0] : `Sjåfør ${dIdx + 1}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <div className="p-3 bg-[#0B0F19] rounded-2xl border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Provisjonssats: <b>15% Aron / 85% Sjåfør</b></span>
            <span className="text-[#34D186] font-bold">Auto-dispatch aktiv</span>
          </div>
        </div>

      </div>

    </div>
  );
};
