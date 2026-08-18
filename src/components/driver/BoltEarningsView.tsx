import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, TrendingUp, Clock, CheckCircle2, DollarSign, Calendar, Info, HelpCircle } from 'lucide-react';
import { Trip } from '../../types';

interface BoltEarningsViewProps {
  onBack: () => void;
  completedTrips: Trip[];
}

export const BoltEarningsView: React.FC<BoltEarningsViewProps> = ({
  onBack,
  completedTrips,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Calculate stats
  const totalGross = completedTrips.reduce((acc, t) => acc + (t.finalPrice || t.estimatedPrice || 0), 0);
  const netEarnings = Math.round(totalGross * 0.85); // 85% driver share
  const targetAmount = 25000;
  const remainingTarget = Math.max(0, targetAmount - netEarnings);
  const progressPercent = Math.min(100, Math.round((netEarnings / targetAmount) * 100));

  const days = [
    { label: 'Mon', hours: 4.5, active: false },
    { label: 'Tue', hours: 6.2, active: false },
    { label: 'Wed', hours: 7.0, active: false },
    { label: 'Thu', hours: 5.5, active: false },
    { label: 'Fri', hours: 8.0, active: false },
    { label: 'Sat', hours: 9.5, active: false },
    { label: 'Sun', hours: 0, active: true },
  ];

  return (
    <div className="flex-1 bg-[#10141E] text-white min-h-screen flex flex-col pb-20">
      
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 bg-[#10141E]/95 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-white">Ukesoversikt Inntekt</h1>
        <div className="w-8" />
      </div>

      <div className="p-4 sm:p-6 max-w-lg mx-auto w-full space-y-5">
        
        {/* Radial Circular Progress Card */}
        <div className="bg-[#171E2D] border border-white/10 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            {/* SVG circle track */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-emerald-500 transition-all duration-700 ease-out"
                strokeWidth="7"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Denne uken</span>
              <div className="text-3xl font-black text-white mt-0.5 tracking-tight">
                kr {netEarnings.toLocaleString('no-NO')}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                {completedTrips.length > 0 ? `${completedTrips.length} fullførte turer` : 'Fullfør turer for å se opptjening her'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
          >
            {showBreakdown ? 'Skjul detaljert fordeling' : 'Vis fordeling (Breakdown)'}
            <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${showBreakdown ? 'rotate-90' : ''}`} />
          </button>

          {showBreakdown && (
            <div className="pt-4 border-t border-white/10 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Brutto innkjørt:</span>
                <span className="font-bold text-white">kr {totalGross.toLocaleString('no-NO')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Aron/Bolt provisjon (15%):</span>
                <span className="font-bold text-rose-400">- kr {Math.round(totalGross * 0.15).toLocaleString('no-NO')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tips fra kunder (100%):</span>
                <span className="font-bold text-emerald-400">+ kr 0</span>
              </div>
              <div className="flex justify-between text-slate-200 font-bold pt-2 border-t border-white/5">
                <span>Netto utbetaling:</span>
                <span className="text-emerald-400 text-sm">kr {netEarnings.toLocaleString('no-NO')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section: Insights */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Innsikt & Mål</h3>

          {/* Weekly target */}
          <div className="bg-[#171E2D] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Ukesmål</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">kr 25 000</span>
            </div>

            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>{progressPercent}% fullført</span>
              <span className="text-emerald-400 font-semibold">
                kr {remainingTarget.toLocaleString('no-NO')} igjen til målet
              </span>
            </div>
          </div>
        </div>

        {/* Section: Activity */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Aktivitet</h3>

          {/* Hours bar chart */}
          <div className="bg-[#171E2D] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Kjørte timer</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">40.7 t denne uken</span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2 items-end h-28">
              {days.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      d.active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-700/60'
                    }`}
                    style={{ height: `${Math.max(12, (d.hours / 10) * 100)}%` }}
                  />
                  <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trips card */}
          <div className="bg-[#171E2D] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Fullførte turer</div>
                <div className="text-[11px] text-slate-400">{completedTrips.length} fullført av alle forespørsler</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-white">{completedTrips.length}</div>
              <div className="text-[10px] text-slate-500 font-mono">100% fullføring</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
