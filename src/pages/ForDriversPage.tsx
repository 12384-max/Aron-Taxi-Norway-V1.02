import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Phone, Mail, LogIn, Percent, DollarSign, Clock, MapPin, Receipt, ShieldCheck } from 'lucide-react';

export const ForDriversPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto space-y-16">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold tracking-widest uppercase backdrop-blur-md">
            ARON TAXI NORWAY · SJÅFØRER
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-normal text-[#F5F2ED] leading-tight">
            Vil du bli <span className="italic font-semibold text-[#D4AF37]">sjåfør?</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed">
            Ta kontakt med Aron Taxi Norway dersom du ønsker å kjøre for oss. Vi tilbyr et moderne, rettferdig og profesjonelt taxisystem i Oslo.
          </p>

          {/* CONTACT & REGISTRATION BUTTONS */}
          <div className="pt-4 flex flex-wrap justify-center items-center gap-4">
            <Link
              to="/bli-sjafor"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-black uppercase text-xs tracking-wider rounded-full shadow-xl shadow-[#D4AF37]/30 transition-all hover:scale-105"
            >
              <ShieldCheck className="w-4 h-4" />
              SØK OM Å BLI SJÅFØR NÅ
            </Link>
            <a
              href="tel:+4796990901"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase text-xs tracking-wider rounded-full transition-all"
            >
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              RING OSS (+47 96 99 09 01)
            </a>
            <Link
              to="/driver/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#121722] hover:bg-[#182030] border border-[#D4AF37]/40 text-[#D4AF37] font-bold uppercase text-xs tracking-wider rounded-full transition-all"
            >
              <LogIn className="w-4 h-4" />
              Sjåfør Logg inn
            </Link>
          </div>
        </div>

        {/* ADVANTAGES & FEATURES (6 CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl backdrop-blur-xl hover:border-[#D4AF37]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-[#F5F2ED]">
              Fleksibelt Arbeid
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Bestem din egen arbeidstid. Logg inn på sjåførapplikasjonen og gå ONLINE når du ønsker å motta turer i Oslo.
            </p>
          </div>

          <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl backdrop-blur-xl hover:border-[#D4AF37]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-[#F5F2ED]">
              Live Turforespørsler
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Motta sanntids popup-forespørsler direkte på mobilen med hentested, destinasjon, avstand, estimert kjøretid og pris.
            </p>
          </div>

          <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl backdrop-blur-xl hover:border-[#D4AF37]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
              <Percent className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-[#F5F2ED]">
              85% Sjåførandel
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Aron Taxi tar kun 15% provisjon. Du beholder 85% av bruttoprisen uten skjulte administrasjonsgebyrer.
            </p>
          </div>

          <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl backdrop-blur-xl hover:border-[#D4AF37]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-[#F5F2ED]">
              100% Tips Til Deg
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Drikkepenger som gis av fornøyde passasjerer tilfaller 100% deg som sjåfør uten noe provisjonstrekk.
            </p>
          </div>

          <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl backdrop-blur-xl hover:border-[#D4AF37]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-[#F5F2ED]">
              Fakturaer & Historikk
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Full oversikt over fullførte turer, dagsomsetning, ukesomsetning, månedsinntekt og automatiske spesifiserte kvitteringer.
            </p>
          </div>

          <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl backdrop-blur-xl hover:border-[#D4AF37]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-[#F5F2ED]">
              Trygge Kunder
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Vi kobler deg sammen med kvalitetskunder, forhåndsbestillinger og flyplasstransporter med presise adresser og ruter.
            </p>
          </div>

        </div>

        {/* ONBOARDING INFO */}
        <div className="bg-[#121722]/90 border border-[#D4AF37]/30 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-2xl backdrop-blur-xl">
          <ShieldCheck className="w-12 h-12 text-[#D4AF37] mx-auto" />
          <h2 className="font-display text-2xl font-bold text-[#F5F2ED]">
            Søk digitalt · Godkjennes av administrasjonen
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
            Fyll inn all nødvendig informasjon om førerkort, drosjeløyve, kjøreseddel og biloppsett. Når du har sendt inn søknaden, vil Aron Taxi ledelse gjennomgå opplysningene og aktivere sjåførkontoen din.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              to="/bli-sjafor"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-black uppercase text-xs tracking-wider rounded-full transition-all shadow-md shadow-[#D4AF37]/20"
            >
              <ShieldCheck className="w-4 h-4" />
              Gå til Søknadsskjema
            </Link>
            <a
              href="tel:+4796990901"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase text-xs tracking-wider rounded-full transition-all"
            >
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              Ring +47 96 99 09 01
            </a>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};
