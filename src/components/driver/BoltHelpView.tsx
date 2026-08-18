import React, { useState } from 'react';
import { 
  Search, 
  ChevronRight, 
  HelpCircle, 
  ShieldCheck, 
  FileText, 
  User, 
  Car, 
  MessageSquare, 
  Phone, 
  ExternalLink,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface BoltHelpViewProps {
  onOpenPreferences: () => void;
}

export const BoltHelpView: React.FC<BoltHelpViewProps> = ({
  onOpenPreferences,
}) => {
  const [search, setSearch] = useState('');

  const articles = [
    { title: 'Inkluderende turer (Inclusive rides)', desc: 'Hvordan håndtere førerhunder og rullestoler', icon: Sparkles },
    { title: 'Respekt for mangfold', desc: 'Aron Taxi retningslinjer for trygge turer', icon: ShieldCheck },
    { title: 'Informasjonssikkerhet', desc: 'Beskyttelse av passasjerdata og personvern', icon: BookOpen },
    { title: 'Ukentlig utbetaling & skatt', desc: 'Alt du trenger å vite om oppgjørsrutiner', icon: FileText },
  ];

  return (
    <div className="flex-1 bg-[#10141E] text-white min-h-screen flex flex-col pb-24">
      
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 bg-[#10141E]/95 backdrop-blur-md border-b border-white/10 px-5 py-4">
        <h1 className="text-xl font-black text-white tracking-tight">Hjelp & Støtte (Help)</h1>
      </div>

      <div className="p-4 sm:p-5 max-w-lg mx-auto w-full space-y-5">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Hvordan kan vi hjelpe deg?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#171E2D] border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-md"
          />
        </div>

        {/* Guidance Centre */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Veiledningssenter (Guidance Centre)
          </h2>

          <div className="bg-[#171E2D] border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5 shadow-md">
            {articles
              .filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()))
              .map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => toast.info(`Åpner: ${item.title}`)}
                    className="p-4 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{item.title}</div>
                        <div className="text-xs text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Driver Portal Actions */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Sjåførportal (Driver Portal)
          </h2>

          <div className="bg-[#171E2D] border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5 shadow-md">
            <div
              onClick={() => toast.info('Dokumentkontroll: Alle sjåførdokumenter er gyldige.')}
              className="p-4 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Oppdater sjåførdokumenter</div>
                  <div className="text-xs text-slate-400">Kjøreseddel, drosjeløyve og forsikring</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
            </div>

            <div
              onClick={onOpenPreferences}
              className="p-4 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Administrer kjøretøy</div>
                  <div className="text-xs text-slate-400">Bytt bil eller oppdater bilinformasjon</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
            </div>
          </div>
        </div>

        {/* Contact Support Button */}
        <div className="pt-2">
          <a
            href="tel:+4722000000"
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            Ring Døgnåpen Sjåførsupport
          </a>
        </div>

      </div>
    </div>
  );
};
