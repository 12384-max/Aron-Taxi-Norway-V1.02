import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MapPin, CreditCard, Navigation, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto space-y-16">
        
        {/* HERO TITLE */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
            DEN KORTE VEIEN
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal text-[#F5F2ED] leading-tight">
            Alt du trenger. <br />
            <span className="italic font-semibold text-[#D4AF37]">Ingenting mer.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            Vi i Aron Taxi Norway har bygget en ren og forutsigbar taxitjeneste for Oslo. Bestill enkelt på sekunder uten krav om registrering.
          </p>
        </div>

        {/* 3 STEPS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl backdrop-blur-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-[#D4AF37]">01</span>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#F5F2ED]">
              Fortell oss hvor
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Skriv inn henteadresse og destinasjon i søkefeltet. Vårt system geokoder adressen og beregner faktisk kjørerute via OSRM over OpenStreetMap.
            </p>
          </div>

          <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl backdrop-blur-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-[#D4AF37]">02</span>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#F5F2ED]">
              Se pris først
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Du får opp en eksakt fastpris før du bekrefter. Ingen overraskelser, ingen skjulte gebyrer – kun ærlig takst beregnet ut fra faktiske veikilometer.
            </p>
          </div>

          <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl backdrop-blur-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-[#D4AF37]">03</span>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
                <Navigation className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#F5F2ED]">
              Følg med hele veien
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Få bekreftelse på sjåfør, bilmodell og kjennemerke. Følg bilen live på kartet i sanntid når den nærmer seg henteadressen.
            </p>
          </div>

        </div>

        {/* FAQ SECTION */}
        <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-8 sm:p-12 space-y-8 backdrop-blur-xl">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-display text-2xl font-bold text-[#F5F2ED]">
              Ofte stilte spørsmål
            </h2>
            <p className="text-xs text-slate-400 font-light">
              Alt du lurer på før din neste tur med Aron Taxi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-[#0D121D] rounded-xl border border-white/10 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                Må jeg opprette en konto for å bestille?
              </h4>
              <p className="text-slate-400 font-light leading-relaxed">
                Nei. Du kan enkelt bestille som gjest. Vi ber kun om navn, telefonnummer og e-post slik at sjåføren kan kontakte deg ved ankomst.
              </p>
            </div>

            <div className="p-4 bg-[#0D121D] rounded-xl border border-white/10 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                Hvordan beregnes prisen?
              </h4>
              <p className="text-slate-400 font-light leading-relaxed">
                Prisen beregnes ut fra reell kjøreavstand (18 NOK/km dagtid / 20 NOK/km kveldstid) pluss startgebyr. Ingen luftlinjeberegning benyttes.
              </p>
            </div>

            <div className="p-4 bg-[#0D121D] rounded-xl border border-white/10 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                Hvilke biler benytter dere?
              </h4>
              <p className="text-slate-400 font-light leading-relaxed">
                Aron Taxi disponerer kun nyere, fullelektriske premiumkjøretøy – spesifikt Tesla Model Y Juniper og Mercedes EQE.
              </p>
            </div>

            <div className="p-4 bg-[#0D121D] rounded-xl border border-white/10 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                Kan jeg forhåndsbestille til Gardermoen?
              </h4>
              <p className="text-slate-400 font-light leading-relaxed">
                Ja, du kan forhåndsbestille tur uansett klokkeslett med garantert oppmøte.
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link
              to="/bestill"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-extrabold uppercase text-xs tracking-wider rounded-full shadow-lg shadow-[#D4AF37]/20 transition-all"
            >
              Klar til å bestille?
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};
