import React, { useState } from 'react';
import { Trip, Driver } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Percent,
  CheckCircle2,
  DollarSign,
  Car,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';

interface AdminReportsTabProps {
  trips: Trip[];
  drivers: Driver[];
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  trips,
  drivers,
  showToast
}) => {
  const [reportPeriod, setReportPeriod] = useState<'today' | '7days' | 'month' | 'year' | 'all'>('month');

  const totalGross = trips.reduce((sum, t) => sum + (t.finalPrice || t.estimatedPrice || 0), 0);
  const totalNetBeforeMva = Math.round(totalGross / 1.12);
  const totalMva12 = totalGross - totalNetBeforeMva;
  const totalAronCommission = trips.reduce((sum, t) => sum + (t.commissionAron || Math.round((t.finalPrice || t.estimatedPrice || 0) * 0.15)), 0);
  const totalDriverPayouts = totalGross - totalAronCommission;
  const totalTips = trips.reduce((sum, t) => sum + (t.tip || 0), 0);

  // Driver commission ledger
  const driverPerformance = drivers.map((d) => {
    const driverTrips = trips.filter((t) => t.driverId === d.id && t.status === 'completed');
    const gross = driverTrips.reduce((sum, t) => sum + (t.finalPrice || t.estimatedPrice || 0), 0);
    const commission = Math.round(gross * 0.15);
    const payout = gross - commission;
    const tips = driverTrips.reduce((sum, t) => sum + (t.tip || 0), 0);

    return {
      driver: d,
      tripsCount: driverTrips.length,
      grossRevenue: gross,
      aronCommission: commission,
      netPayout: payout,
      tips
    };
  });

  const exportReportCSV = () => {
    const headers = ['Sjåfør', 'E-post', 'Løyvenummer', 'Antall Turer', 'Bruttoomsetning', 'Aron Provisjon (15%)', 'Netto Utbetaling (85%)', 'Tips (100%)'];
    const rows = driverPerformance.map(dp => [
      `"${dp.driver.name}"`,
      `"${dp.driver.email}"`,
      `"${dp.driver.permitNumber || '–'}"`,
      `"${dp.tripsCount}"`,
      `"${dp.grossRevenue}"`,
      `"${dp.aronCommission}"`,
      `"${dp.netPayout}"`,
      `"${dp.tips}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AronTaxi_Regnskapsrapport_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Regnskapsrapport lastet ned som CSV.', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER & PERIOD SWITCHER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
            Regnskap, MVA & Provisjonsoppgjør
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Komplett finansiell oversikt, 12% MVA-oppgave og 85% sjåføroppgjørsbok.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-xl border border-white/10 text-xs">
            {(['today', '7days', 'month', 'year', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setReportPeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase transition-all cursor-pointer ${
                  reportPeriod === p
                    ? 'bg-[#D4AF37] text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'today' ? 'I Dag' : p === '7days' ? '7 Dager' : p === 'month' ? 'Måned' : p === 'year' ? 'År' : 'Alt'}
              </button>
            ))}
          </div>

          <button
            onClick={exportReportCSV}
            className="px-3.5 py-2 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Eksporter
          </button>
        </div>
      </div>

      {/* 2. REVENUE & TAX BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Bruttoomsetning</span>
          <div className="text-2xl font-black text-white font-mono">{totalGross.toLocaleString('no-NO')} kr</div>
          <span className="text-[11px] text-slate-500 font-medium">Inkludert 12% MVA</span>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-blue-400">MVA Grunnlag (12%)</span>
          <div className="text-2xl font-black text-blue-400 font-mono">{totalMva12.toLocaleString('no-NO')} kr</div>
          <span className="text-[11px] text-slate-500 font-medium">Beregnet avgift persontransport</span>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-[#D4AF37]">Aron Taxi Provisjon (15%)</span>
          <div className="text-2xl font-black text-[#D4AF37] font-mono">{totalAronCommission.toLocaleString('no-NO')} kr</div>
          <span className="text-[11px] text-slate-500 font-medium">Plattforminntekt Aron AS</span>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-[#34D186]">Sjåføroppgjør (85% + Tips)</span>
          <div className="text-2xl font-black text-[#34D186] font-mono">{(totalDriverPayouts + totalTips).toLocaleString('no-NO')} kr</div>
          <span className="text-[11px] text-slate-500 font-medium">Utbetales til sjåfører</span>
        </div>
      </div>

      {/* 3. DRIVER PAYOUT LEDGER TABLE */}
      <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <div>
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-[#34D186]" />
              Sjåføroppgjørsbok & Provisjonsfordeling
            </h3>
            <p className="text-xs text-slate-400">Fordeling av 85% sjåførhonorar og 15% plattformgebyr per sjåfør</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#34D186] bg-[#34D186]/10 px-3 py-1 rounded-full border border-[#34D186]/20">
            {drivers.length} registrerte sjåfører
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="p-3.5">Sjåfør</th>
                <th className="p-3.5">Løyve / Bil</th>
                <th className="p-3.5 text-center">Fullførte Turer</th>
                <th className="p-3.5 text-right">Brutto Kjørt</th>
                <th className="p-3.5 text-right">Aron Provisjon (15%)</th>
                <th className="p-3.5 text-right">Tips (100%)</th>
                <th className="p-3.5 text-right">Netto Utbetaling (85%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {driverPerformance.map((dp) => (
                <tr key={dp.driver.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-white">{dp.driver.name}</div>
                    <div className="text-[10px] text-slate-400">{dp.driver.email}</div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-400">
                    <div>{dp.driver.licensePlate || '–'}</div>
                    <div className="text-[10px] text-slate-500">Løyve: {dp.driver.permitNumber || '–'}</div>
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold text-white">
                    {dp.tripsCount}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-white">
                    {dp.grossRevenue.toLocaleString('no-NO')} kr
                  </td>
                  <td className="p-3.5 text-right font-mono text-[#D4AF37]">
                    -{dp.aronCommission.toLocaleString('no-NO')} kr
                  </td>
                  <td className="p-3.5 text-right font-mono text-emerald-400 font-bold">
                    +{dp.tips.toLocaleString('no-NO')} kr
                  </td>
                  <td className="p-3.5 text-right font-mono text-base font-black text-[#34D186]">
                    {(dp.netPayout + dp.tips).toLocaleString('no-NO')} kr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
