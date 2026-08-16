import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { INITIAL_VEHICLES, TESLA_MODEL_Y_IMAGES, MERCEDES_EQE_IMAGES } from '../constants/assets';
import { Vehicle } from '../types';
import { 
  Zap, ShieldCheck, Users, Compass, Check, X, ArrowRight, Eye, 
  Sparkles, CheckCircle2, ChevronRight, Shield
} from 'lucide-react';

export const VehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'tesla' | 'mercedes'>('all');

  const teslaVehicle = INITIAL_VEHICLES.find(v => v.id === 'v1') || INITIAL_VEHICLES[0];
  const eqeVehicle = INITIAL_VEHICLES.find(v => v.id === 'v2') || INITIAL_VEHICLES[1] || INITIAL_VEHICLES[0];

  const openLightbox = (imageUrl: string, title: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageTitle(title);
  };

  const handleBookCar = (modelName: string) => {
    navigate('/bestill', {
      state: {
        preferredCar: modelName
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto space-y-12">
        
        {/* HERO TITLE & FOLDER HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold tracking-widest uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            ARON TAXI NORWAY · VÅR EKSKLUSIVE BILPARK
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal text-[#F5F2ED] leading-tight">
            Våre Luksuriøse <br />
            <span className="italic font-semibold text-[#D4AF37]">Elektriske Drosjer</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            Hos Aron Taxi Norway kjører vi utelukkende med to førsteklasses bilmodeller for din ypperste komfort og sikkerhet i Oslo og omegn.
          </p>
        </div>

        {/* FILTER TABS */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Begge Biler (2)
          </button>
          <button
            onClick={() => setActiveTab('tesla')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tesla'
                ? 'bg-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Tesla Model Y Juniper
          </button>
          <button
            onClick={() => setActiveTab('mercedes')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'mercedes'
                ? 'bg-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Mercedes-Benz EQE Sedan
          </button>
        </div>

        {/* OVERVIEW STATS BANNER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="p-4 bg-[#121722]/80 border border-white/10 rounded-2xl text-center space-y-1 backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Antall Biler</span>
            <p className="text-lg sm:text-xl font-bold text-[#D4AF37]">2 Biler i Flåten</p>
            <span className="text-[10px] text-slate-500">Tesla & Mercedes</span>
          </div>
          <div className="p-4 bg-[#121722]/80 border border-white/10 rounded-2xl text-center space-y-1 backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drivlinje</span>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">100% Elektrisk</p>
            <span className="text-[10px] text-slate-500">Zero CO2-utslipp</span>
          </div>
          <div className="p-4 bg-[#121722]/80 border border-white/10 rounded-2xl text-center space-y-1 backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dekning</span>
            <p className="text-lg sm:text-xl font-bold text-[#F5F2ED]">Oslo & OSL</p>
            <span className="text-[10px] text-slate-500">Inkl. Viken & Gardermoen</span>
          </div>
          <div className="p-4 bg-[#121722]/80 border border-white/10 rounded-2xl text-center space-y-1 backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard</span>
            <p className="text-lg sm:text-xl font-bold text-[#F5F2ED]">Executive VIP</p>
            <span className="text-[10px] text-slate-500">Luksuriøst & Stillegående</span>
          </div>
        </div>

        {/* VEHICLES CARDS LIST */}
        <div className="space-y-12">
          
          {/* VEHICLE 1: TESLA MODEL Y JUNIPER */}
          {(activeTab === 'all' || activeTab === 'tesla') && (
            <div className="bg-[#121722]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 hover:border-[#D4AF37]/30 transition-all">
              
              {/* PHOTO GALLERY (7 COLS) */}
              <div className="lg:col-span-7 space-y-4">
                <div
                  className="relative h-72 sm:h-96 rounded-2xl overflow-hidden cursor-pointer group border border-white/10 bg-black/50"
                  onClick={() => openLightbox(teslaVehicle.imageUrls[0], 'Tesla Model Y Juniper')}
                >
                  <img
                    src={teslaVehicle.imageUrls[0]}
                    alt={teslaVehicle.model}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-4 py-2 bg-black/80 text-[#D4AF37] text-xs font-bold rounded-full flex items-center gap-2 border border-[#D4AF37]/40 backdrop-blur-md">
                      <Eye className="w-4 h-4" />
                      Se bilde i fullskjerm
                    </span>
                  </div>
                  <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-black/85 backdrop-blur-md text-[#D4AF37] text-xs font-bold rounded-xl border border-[#D4AF37]/30">
                    {teslaVehicle.model}
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-950/90 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-800 backdrop-blur-md">
                    100% Elektrisk SUV
                  </div>
                </div>

                {/* THUMBNAILS ROW */}
                <div className="grid grid-cols-2 gap-3">
                  {teslaVehicle.imageUrls.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => openLightbox(img, `Tesla Model Y Juniper bilde ${idx + 1}`)}
                      className="h-24 sm:h-28 rounded-xl overflow-hidden border border-white/10 hover:border-[#D4AF37] cursor-pointer transition-all hover:scale-105 relative group bg-black/40"
                    >
                      <img src={img} alt={`Tesla Model Y ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DETAILS & SPECS (5 COLS) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase">
                      {teslaVehicle.color.toUpperCase()} · EXECUTIVE ELECTRIC
                    </span>
                    <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-semibold rounded-full">
                      Aktiv Flåte
                    </span>
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F2ED]">
                    {teslaVehicle.model}
                  </h2>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Opplev den nye Tesla Model Y Juniper med overlegent panoramatak, god plass til passasjerer og bagasje, stillegående fremdrift og toppmoderne teknologi for en trygg reise i Oslo.
                  </p>

                  {/* SPECS GRID */}
                  <div className="grid grid-cols-3 gap-2 text-center py-3 border-y border-white/10 text-xs">
                    <div className="p-2.5 bg-[#0D121D] rounded-xl border border-white/5">
                      <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase">Rekkevidde</span>
                      <span className="font-bold text-[#F5F2ED]">{teslaVehicle.rangeKm} km</span>
                    </div>
                    <div className="p-2.5 bg-[#0D121D] rounded-xl border border-white/5">
                      <Users className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase">Kapasitet</span>
                      <span className="font-bold text-[#F5F2ED]">{teslaVehicle.seats} Seter</span>
                    </div>
                    <div className="p-2.5 bg-[#0D121D] rounded-xl border border-white/5">
                      <ShieldCheck className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase">Sikkerhet</span>
                      <span className="font-bold text-[#F5F2ED]">5 Stjerner</span>
                    </div>
                  </div>

                  {/* EQUIPMENT LIST */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Kjøretøyets Utstyr & Egenskaper
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-light">
                      {teslaVehicle.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleBookCar(teslaVehicle.model)}
                    className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-extrabold uppercase text-xs tracking-wider rounded-full transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Bestill tur med {teslaVehicle.model}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* VEHICLE 2: MERCEDES-BENZ EQE SEDAN */}
          {(activeTab === 'all' || activeTab === 'mercedes') && (
            <div className="bg-[#121722]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 hover:border-[#D4AF37]/30 transition-all">
              
              {/* PHOTO GALLERY (7 COLS) */}
              <div className="lg:col-span-7 space-y-4">
                <div
                  className="relative h-72 sm:h-96 rounded-2xl overflow-hidden cursor-pointer group border border-white/10 bg-black/50"
                  onClick={() => openLightbox(eqeVehicle.imageUrls[0], 'Mercedes-Benz EQE Sedan')}
                >
                  <img
                    src={eqeVehicle.imageUrls[0]}
                    alt={eqeVehicle.model}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-4 py-2 bg-black/80 text-[#D4AF37] text-xs font-bold rounded-full flex items-center gap-2 border border-[#D4AF37]/40 backdrop-blur-md">
                      <Eye className="w-4 h-4" />
                      Se bilde i fullskjerm
                    </span>
                  </div>
                  <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-black/85 backdrop-blur-md text-[#D4AF37] text-xs font-bold rounded-xl border border-[#D4AF37]/30">
                    {eqeVehicle.model}
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 bg-amber-950/90 text-amber-400 text-[10px] font-bold rounded-full border border-amber-800 backdrop-blur-md">
                    100% Elektrisk Sedan
                  </div>
                </div>

                {/* THUMBNAILS ROW */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {eqeVehicle.imageUrls.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => openLightbox(img, `Mercedes-Benz EQE bilde ${idx + 1}`)}
                      className="h-20 sm:h-24 rounded-xl overflow-hidden border border-white/10 hover:border-[#D4AF37] cursor-pointer transition-all hover:scale-105 relative group bg-black/40"
                    >
                      <img src={img} alt={`Mercedes-Benz EQE ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DETAILS & SPECS (5 COLS) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase">
                      {eqeVehicle.color.toUpperCase()} · EXECUTIVE LUXURY
                    </span>
                    <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-semibold rounded-full">
                      Aktiv Flåte
                    </span>
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F2ED]">
                    {eqeVehicle.model}
                  </h2>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Mercedes-Benz EQE kombinerer banebrytende tysk ingeniørkunst med uovertruffen komfort. Utstyrt med adaptiv luftfjæring, avansert MBUX Widescreen og markedets beste støydemping for en harmonisk taxiopplevelse i Oslo.
                  </p>

                  {/* SPECS GRID */}
                  <div className="grid grid-cols-3 gap-2 text-center py-3 border-y border-white/10 text-xs">
                    <div className="p-2.5 bg-[#0D121D] rounded-xl border border-white/5">
                      <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase">Rekkevidde</span>
                      <span className="font-bold text-[#F5F2ED]">{eqeVehicle.rangeKm} km</span>
                    </div>
                    <div className="p-2.5 bg-[#0D121D] rounded-xl border border-white/5">
                      <Users className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase">Kapasitet</span>
                      <span className="font-bold text-[#F5F2ED]">{eqeVehicle.seats} Seter</span>
                    </div>
                    <div className="p-2.5 bg-[#0D121D] rounded-xl border border-white/5">
                      <Compass className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase">Fjæring</span>
                      <span className="font-bold text-[#F5F2ED]">Airmatic</span>
                    </div>
                  </div>

                  {/* EQUIPMENT LIST */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Kjøretøyets Utstyr & Egenskaper
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-light">
                      {eqeVehicle.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleBookCar(eqeVehicle.model)}
                    className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-extrabold uppercase text-xs tracking-wider rounded-full transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Bestill tur med {eqeVehicle.model}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full bg-[#121722] border border-white/15 rounded-3xl p-4 sm:p-6 overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white z-10 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="h-[65vh] sm:h-[75vh] w-full flex items-center justify-center bg-black/80 rounded-2xl overflow-hidden border border-white/10">
              <img
                src={selectedImage}
                alt={selectedImageTitle || 'Aron Taxi Bil'}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="mt-4 flex justify-between items-center px-2 text-xs">
              <span className="font-display font-bold text-[#F5F2ED] text-base">{selectedImageTitle || 'Aron Taxi Norway'}</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold cursor-pointer"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};


