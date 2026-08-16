import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { OFFICIAL_ASSETS } from '../constants/assets';
import { searchAddresses, GeocodeResult } from '../services/osrm';
import { useTrips } from '../context/TripContext';
import { MapPin, Navigation, ArrowRight, Shield, Clock, Plane, Calendar, CreditCard, Sparkles, Car, AlertCircle } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { drivers, trips } = useTrips();

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  
  const [fromSuggestions, setFromSuggestions] = useState<GeocodeResult[]>([]);
  const [toSuggestions, setToSuggestions] = useState<GeocodeResult[]>([]);

  const [selectedFrom, setSelectedFrom] = useState<GeocodeResult | null>(null);
  const [selectedTo, setSelectedTo] = useState<GeocodeResult | null>(null);

  // Calculate live available drivers
  const busyDriverIds = new Set(
    trips
      .filter((t) =>
        ['accepted', 'driver_assigned', 'driver_arriving', 'driver_arrived', 'trip_started', 'active'].includes(t.status)
      )
      .map((t) => t.driverId || t.assignedDriverId)
      .filter(Boolean)
  );

  const availableDrivers = drivers.filter(
    (d) => d.isOnline && !busyDriverIds.has(d.id)
  );
  const isDriverAvailable = availableDrivers.length > 0;

  const handleFromSearch = async (val: string) => {
    setFromQuery(val);
    setSelectedFrom(null);
    if (val.length >= 3) {
      const res = await searchAddresses(val);
      setFromSuggestions(res);
    } else {
      setFromSuggestions([]);
    }
  };

  const handleToSearch = async (val: string) => {
    setToQuery(val);
    setSelectedTo(null);
    if (val.length >= 3) {
      const res = await searchAddresses(val);
      setToSuggestions(res);
    } else {
      setToSuggestions([]);
    }
  };

  const handleFindCar = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to /bestill with state or parameters
    navigate('/bestill', {
      state: {
        from: selectedFrom ? selectedFrom.address : fromQuery,
        fromLat: selectedFrom?.lat,
        fromLng: selectedFrom?.lng,
        to: selectedTo ? selectedTo.address : toQuery,
        toLat: selectedTo?.lat,
        toLng: selectedTo?.lng
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col selection:bg-[#D4AF37] selection:text-black relative overflow-hidden">
      <Header />

      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background dark gradient overlay with subtle luxury texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D14] via-[#0E121B] to-[#0A0D14] opacity-95 z-0" />
        
        {/* Sleek ambient glow effects */}
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-[#D4AF37]/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-[#1E2638]/50 blur-[160px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* HERO LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* SUBTITLE BADGE */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-[#D4AF37]/30 text-xs font-semibold tracking-widest uppercase backdrop-blur-md">
              {isDriverAvailable ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400 font-bold">
                    {availableDrivers.length} {availableDrivers.length === 1 ? 'bil' : 'biler'} ledig i Oslo nå
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-[#D4AF37]">ARON TAXI NORWAY</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-400 font-bold">
                    Ingen biler ledig nå (Forhåndsbestilling åpen)
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-[#D4AF37]">ARON TAXI</span>
                </>
              )}
            </div>

            {/* MAIN HEADLINE */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.1] tracking-tight text-[#F5F2ED]">
              På vei, <br />
              <span className="italic text-[#D4AF37] font-semibold">med ro.</span>
            </h1>

            {/* DESCRIPTION */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-light leading-relaxed">
              En ordentlig taxi for byen du kjenner. Bestill enkelt på sekunder, følg turen din i sanntid, og vit nøyaktig hvem som kommer.
            </p>

            {/* FEATURE CHIPS */}
            <div className="pt-2 flex flex-wrap gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Plane className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Flyplasstransport</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Forhåndsbestilling</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Fastpris før avreise</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Estimert ankomsttid (ETA)</span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-6">
              <Link
                to="/bestill"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] text-slate-950 hover:brightness-110 font-bold text-sm tracking-wider uppercase rounded-full shadow-xl shadow-[#D4AF37]/20 transition-all hover:scale-[1.02]"
              >
                Bestill en taxi
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/driver/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-[#D4AF37] transition-colors"
              >
                Jeg kjører med Aron &rarr;
              </Link>
            </div>
          </div>

          {/* HERO RIGHT COLUMN - SLEEK BOOKING CARD */}
          <div className="lg:col-span-5">
            <div className="bg-[#121722]/90 backdrop-blur-xl text-[#F5F2ED] rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="block text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
                    BESTILL TUR
                  </span>
                  <h3 className="font-display text-2xl font-bold text-[#F5F2ED]">
                    Hvor skal du?
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Navigation className="w-5 h-5 fill-[#D4AF37] text-slate-950" />
                </div>
              </div>

              <form onSubmit={handleFindCar} className="space-y-4">
                
                {/* FROM FIELD */}
                <div className="relative">
                  <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                    FRA
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-[#D4AF37] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Hentested, adresse eller sted"
                      value={fromQuery}
                      onChange={(e) => handleFromSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0D121D] border border-white/10 rounded-xl text-sm font-medium text-[#F5F2ED] placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      required
                    />
                  </div>

                  {fromSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#131926] border border-white/10 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                      {fromSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFromQuery(item.address.split(',')[0]);
                            setSelectedFrom(item);
                            setFromSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-white/10 border-b border-white/5 last:border-0 truncate"
                        >
                          {item.address}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* TO FIELD */}
                <div className="relative">
                  <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                    TIL
                  </label>
                  <div className="relative flex items-center">
                    <Navigation className="w-4 h-4 text-[#D4AF37] absolute left-3.5 pointer-events-none rotate-45" />
                    <input
                      type="text"
                      placeholder="Hvor skal vi kjøre deg?"
                      value={toQuery}
                      onChange={(e) => handleToSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0D121D] border border-white/10 rounded-xl text-sm font-medium text-[#F5F2ED] placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      required
                    />
                  </div>

                  {toSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#131926] border border-white/10 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                      {toSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setToQuery(item.address.split(',')[0]);
                            setSelectedTo(item);
                            setToSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-white/10 border-b border-white/5 last:border-0 truncate"
                        >
                          {item.address}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-extrabold text-sm uppercase tracking-wider rounded-full transition-all shadow-lg shadow-[#D4AF37]/20 mt-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Finn en bil
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* FOOTER NOTE IN CARD */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isDriverAvailable ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                  {isDriverAvailable ? (
                    <span className="text-emerald-300 font-semibold">{availableDrivers.length} bil{availableDrivers.length > 1 ? 'er' : ''} ledig nå</span>
                  ) : (
                    <span className="text-rose-300 font-semibold">Forhåndsbestilling åpen</span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Ingen innlogging kreves
                </span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* "ALT DU TRENGER. INGENTING MER." SECTION */}
      <section className="bg-[#0D111A] text-[#F5F2ED] py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* TITLE COLUMN */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
                DEN KORTE VEIEN
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-normal leading-tight text-[#F5F2ED]">
                Alt du trenger. <br />
                <span className="italic font-bold text-[#D4AF37]">Ingenting mer.</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-light">
                Vi har fjernet alt unødvendig styr. Du får en klassisk, profesjonell og pålitelig reise i Oslo – uten skjulte gebyrer eller ubehagelige overraskelser.
              </p>
            </div>

            {/* 3 STEPS GRID */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* STEP 1 */}
              <div className="p-6 bg-[#121722]/80 backdrop-blur-md rounded-2xl border border-white/10 space-y-3 hover:border-[#D4AF37]/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">01</span>
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#F5F2ED]">
                  Fortell oss hvor
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Skriv inn hente- og leveringssted. Vi finner den virkelige kjøreruten via vei.
                </p>
              </div>

              {/* STEP 2 */}
              <div className="p-6 bg-[#121722]/80 backdrop-blur-md rounded-2xl border border-white/10 space-y-3 hover:border-[#D4AF37]/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">02</span>
                  <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#F5F2ED]">
                  Se pris først
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Et tydelig estimat basert på faktisk kjøreavstand, tid og valgt bilmodell.
                </p>
              </div>

              {/* STEP 3 */}
              <div className="p-6 bg-[#121722]/80 backdrop-blur-md rounded-2xl border border-white/10 space-y-3 hover:border-[#D4AF37]/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">03</span>
                  <Navigation className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#F5F2ED]">
                  Følg med hele veien
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Møt din sjåfør og følg turen på kartet fra døren til destinasjonen.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* FLEET PREVIEW SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0D14] border-t border-white/10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
              VÅR EXCLUSIVE BILPARK
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-[#F5F2ED]">
              Klassisk luksus. Zero utslipp.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-light">
              Vi benytter kun toppmoderne, stilrene premium elektriske biler – vasket og preparert for din komfort.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* CARD 1: TESLA MODEL Y JUNIPER */}
            <div className="bg-[#121722]/90 rounded-2xl border border-white/10 overflow-hidden group hover:border-[#D4AF37]/50 transition-all shadow-xl">
              <div className="h-64 overflow-hidden relative bg-black/40">
                <img
                  src={OFFICIAL_ASSETS.teslaCars[0]}
                  alt="Tesla Model Y Juniper"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/30">
                  100% ELEKTRISK · EXECUTIVE SUV
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-[#F5F2ED]">
                    Tesla Model Y Juniper
                  </h3>
                  <span className="text-xs text-[#D4AF37] font-semibold">Oslo Taxi</span>
                </div>
                <p className="text-xs text-slate-400 font-light">
                  Den nye Tesla Model Y Juniper med panoramatak, god plass til kofferter, stillegående fremdrift og suveren komfort.
                </p>
                <Link
                  to="/biler"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline"
                >
                  Se detaljer og spesifikasjoner &rarr;
                </Link>
              </div>
            </div>

            {/* CARD 2: MERCEDES-BENZ EQE SEDAN */}
            <div className="bg-[#121722]/90 rounded-2xl border border-white/10 overflow-hidden group hover:border-[#D4AF37]/50 transition-all shadow-xl">
              <div className="h-64 overflow-hidden relative bg-black/40">
                <img
                  src={OFFICIAL_ASSETS.mercedesCars[0]}
                  alt="Mercedes-Benz EQE Sedan"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/30">
                  100% ELEKTRISK · EXECUTIVE LUXURY
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-[#F5F2ED]">
                    Mercedes-Benz EQE Sedan
                  </h3>
                  <span className="text-xs text-[#D4AF37] font-semibold">Oslo Taxi</span>
                </div>
                <p className="text-xs text-slate-400 font-light">
                  Luksuriøs tysk el-sedan med Airmatic adaptiv luftfjæring, MBUX Widescreen, enestående støydemping og VIP-komfort.
                </p>
                <Link
                  to="/biler"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline"
                >
                  Se detaljer og spesifikasjoner &rarr;
                </Link>
              </div>
            </div>

          </div>

          <div className="text-center">
            <Link
              to="/biler"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/50 text-[#F5F2ED] text-xs font-bold tracking-wider uppercase rounded-full transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              Utforsk hele bilparken
            </Link>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};
