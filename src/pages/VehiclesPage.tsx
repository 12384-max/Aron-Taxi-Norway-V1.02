import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { INITIAL_VEHICLES, OFFICIAL_ASSETS } from '../constants/assets';
import { Vehicle } from '../types';
import { 
  Zap, ShieldCheck, Users, Compass, Check, X, ArrowRight, Eye, 
  Car, Award, BatteryCharging, Gauge, Sparkles, Folder, 
  CheckCircle2, Info, ChevronRight
} from 'lucide-react';

export const VehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [activeFolderTab, setActiveFolderTab] = useState<'all' | 'tesla' | 'mercedes' | 'permits'>('all');

  const openGallery = (v: Vehicle, imgUrl: string) => {
    setActiveVehicle(v);
    setSelectedImage(imgUrl);
  };

  const handleBookCar = (modelName: string) => {
    navigate('/bestill', {
      state: {
        preferredCar: modelName
      }
    });
  };

  const teslaVehicle = INITIAL_VEHICLES.find(v => v.id === 'v1') || INITIAL_VEHICLES[0];
  const mercedesVehicle = INITIAL_VEHICLES.find(v => v.id === 'v2') || INITIAL_VEHICLES[1];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto space-y-12">
        
        {/* HERO TITLE & FOLDER HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold tracking-widest uppercase backdrop-blur-md">
            <Folder className="w-3.5 h-3.5" />
            ARON TAXI NORWAY · OFFISIELL BILPARK-MAPPE · OSLO
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal text-[#F5F2ED] leading-tight">
            Vår eksklusive <br />
            <span className="italic font-semibold text-[#D4AF37]">Flåtemappe</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            Velkommen til Aron Taxi Norways offisielle kjøretøyarkiv. Alle våre biler er 100% elektriske, utstyrt med offisielle Oslo-drosjeløyver, luksuriøst interiør og maksimal sikkerhet.
          </p>
        </div>

        {/* FOLDER NAVIGATION TABS */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-[#121722]/80 backdrop-blur-md border border-white/10 rounded-2xl max-w-3xl mx-auto">
          <button
            onClick={() => setActiveFolderTab('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeFolderTab === 'all'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Folder className="w-4 h-4" />
            Alle Kjøretøy ({INITIAL_VEHICLES.length})
          </button>
          
          <button
            onClick={() => setActiveFolderTab('tesla')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeFolderTab === 'tesla'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            Tesla Model Y Juniper (EP 17891)
          </button>

          <button
            onClick={() => setActiveFolderTab('mercedes')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeFolderTab === 'mercedes'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            Mercedes EQE 350 (EF 79664)
          </button>

          <button
            onClick={() => setActiveFolderTab('permits')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeFolderTab === 'permits'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4 text-blue-400" />
            Løyver & Sertifisering
          </button>
        </div>

        {/* OVERVIEW STATS BANNER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="p-4 bg-[#121722]/80 border border-white/10 rounded-2xl text-center space-y-1 backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drivlinje</span>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">100% Elektrisk</p>
            <span className="text-[10px] text-slate-500">Zero CO2-utslipp</span>
          </div>
          <div className="p-4 bg-[#121722]/80 border border-white/10 rounded-2xl text-center space-y-1 backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dekningsområde</span>
            <p className="text-lg sm:text-xl font-bold text-[#F5F2ED]">Hele Oslo</p>
            <span className="text-[10px] text-slate-500">Inkl. Gardermoen OSL</span>
          </div>
          <div className="p-4 bg-[#121722]/80 border border-white/10 rounded-2xl text-center space-y-1 backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Offisielle Løyver</span>
            <p className="text-lg sm:text-xl font-bold text-[#D4AF37]">Godkjent Drosje</p>
            <span className="text-[10px] text-slate-500">OS 10597 / OS 13937</span>
          </div>
          <div className="p-4 bg-[#121722]/80 border border-white/10 rounded-2xl text-center space-y-1 backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Komfortklasse</span>
            <p className="text-lg sm:text-xl font-bold text-[#F5F2ED]">Executive Lux</p>
            <span className="text-[10px] text-slate-500">Skinn & Støydemping</span>
          </div>
        </div>

        {/* VEHICLES CARDS LIST / FOLDER CONTENT */}
        <div className="space-y-12">
          
          {/* TESLA CARD (shown if tab is 'all' or 'tesla') */}
          {(activeFolderTab === 'all' || activeFolderTab === 'tesla') && (
            <div className="bg-[#121722]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 hover:border-[#D4AF37]/30 transition-all">
              
              {/* PHOTO GALLERY (7 COLS) */}
              <div className="lg:col-span-7 space-y-4">
                <div
                  className="relative h-72 sm:h-96 rounded-2xl overflow-hidden cursor-pointer group border border-white/10"
                  onClick={() => openGallery(teslaVehicle, teslaVehicle.imageUrls[0])}
                >
                  <img
                    src={teslaVehicle.imageUrls[0]}
                    alt={teslaVehicle.model}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-4 py-2 bg-black/80 text-[#D4AF37] text-xs font-bold rounded-full flex items-center gap-2 border border-[#D4AF37]/40 backdrop-blur-md">
                      <Eye className="w-4 h-4" />
                      Se bildegalleri i fullskjerm
                    </span>
                  </div>
                  <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-black/85 backdrop-blur-md text-[#D4AF37] text-xs font-mono font-bold rounded-xl border border-[#D4AF37]/30">
                    Kjennemerke: {teslaVehicle.licensePlate}
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-950/90 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-800 backdrop-blur-md">
                    100% Elektrisk SUV
                  </div>
                </div>

                {/* THUMBNAILS ROW */}
                <div className="grid grid-cols-3 gap-3">
                  {teslaVehicle.imageUrls.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => openGallery(teslaVehicle, img)}
                      className="h-24 sm:h-28 rounded-xl overflow-hidden border border-white/10 hover:border-[#D4AF37] cursor-pointer transition-all hover:scale-105 relative group"
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
                      {teslaVehicle.year} ÅRSMODELL · {teslaVehicle.color.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-mono font-semibold rounded-full">
                      Løyve: {teslaVehicle.permitNumber}
                    </span>
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F2ED]">
                    {teslaVehicle.model}
                  </h2>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Stille, kraftfull og romslig elektrisk SUV med heldekkende panorama glasstak, luksuriøse skinnseter og god plass til 4 passasjerer og store kofferter.
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
                      <span className="block text-[10px] text-slate-400 uppercase">Seter</span>
                      <span className="font-bold text-[#F5F2ED]">{teslaVehicle.seats} Seter</span>
                    </div>
                    <div className="p-2.5 bg-[#0D121D] rounded-xl border border-white/5">
                      <BatteryCharging className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase">Lading</span>
                      <span className="font-bold text-[#F5F2ED]">250 kW</span>
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
                    Bestill tur med Tesla Model Y
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* MERCEDES CARD (shown if tab is 'all' or 'mercedes') */}
          {(activeFolderTab === 'all' || activeFolderTab === 'mercedes') && (
            <div className="bg-[#121722]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 hover:border-[#D4AF37]/30 transition-all">
              
              {/* PHOTO GALLERY (7 COLS) */}
              <div className="lg:col-span-7 space-y-4">
                <div
                  className="relative h-72 sm:h-96 rounded-2xl overflow-hidden cursor-pointer group border border-white/10"
                  onClick={() => openGallery(mercedesVehicle, mercedesVehicle.imageUrls[0])}
                >
                  <img
                    src={mercedesVehicle.imageUrls[0]}
                    alt={mercedesVehicle.model}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-4 py-2 bg-black/80 text-[#D4AF37] text-xs font-bold rounded-full flex items-center gap-2 border border-[#D4AF37]/40 backdrop-blur-md">
                      <Eye className="w-4 h-4" />
                      Se bildegalleri i fullskjerm
                    </span>
                  </div>
                  <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-black/85 backdrop-blur-md text-[#D4AF37] text-xs font-mono font-bold rounded-xl border border-[#D4AF37]/30">
                    Kjennemerke: {mercedesVehicle.licensePlate}
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 bg-amber-950/90 text-amber-400 text-[10px] font-bold rounded-full border border-amber-800 backdrop-blur-md">
                    Executive Luxury Sedan
                  </div>
                </div>

                {/* THUMBNAILS ROW */}
                <div className="grid grid-cols-3 gap-3">
                  {mercedesVehicle.imageUrls.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => openGallery(mercedesVehicle, img)}
                      className="h-24 sm:h-28 rounded-xl overflow-hidden border border-white/10 hover:border-[#D4AF37] cursor-pointer transition-all hover:scale-105 relative group"
                    >
                      <img src={img} alt={`Mercedes EQE ${idx + 1}`} className="w-full h-full object-cover" />
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
                      {mercedesVehicle.year} ÅRSMODELL · {mercedesVehicle.color.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-mono font-semibold rounded-full">
                      Løyve: {mercedesVehicle.permitNumber}
                    </span>
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F2ED]">
                    {mercedesVehicle.model}
                  </h2>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Tysk luksussedan i toppklasse med Airmatic adaptiv luftfjæring, Burmester 3D Surround lydsystem, akustikkglass og markedets ypperste sittekomfort.
                  </p>

                  {/* SPECS GRID */}
                  <div className="grid grid-cols-3 gap-2 text-center py-3 border-y border-white/10 text-xs">
                    <div className="p-2.5 bg-[#0D121D] rounded-xl border border-white/5">
                      <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase">Rekkevidde</span>
                      <span className="font-bold text-[#F5F2ED]">{mercedesVehicle.rangeKm} km</span>
                    </div>
                    <div className="p-2.5 bg-[#0D121D] rounded-xl border border-white/5">
                      <Users className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase">Seter</span>
                      <span className="font-bold text-[#F5F2ED]">{mercedesVehicle.seats} Seter</span>
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
                      {mercedesVehicle.features.map((feat, i) => (
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
                    onClick={() => handleBookCar(mercedesVehicle.model)}
                    className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-extrabold uppercase text-xs tracking-wider rounded-full transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Bestill tur med Mercedes EQE
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* PERMITS & CERTIFICATES TAB CONTENT */}
          {activeFolderTab === 'permits' && (
            <div className="bg-[#121722]/90 border border-white/10 rounded-3xl p-8 sm:p-12 space-y-8 backdrop-blur-xl">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F2ED]">
                  Offisielle Drosjeløyver & Dokumentasjon
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-light">
                  Aron Taxi Norway oppfyller alle lovpålagte krav fra Samferdselsdepartementet og Statens vegvesen for profesjonell persontransport i Oslo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0D121D] p-6 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs font-bold text-[#D4AF37] uppercase">LØYVENUMMER</span>
                    <span className="font-mono text-sm font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">OS 10597</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p><b className="text-slate-400">Tilknyttet bil:</b> Tesla Model Y Juniper (EP 17891)</p>
                    <p><b className="text-slate-400">Fylke / Kommune:</b> Oslo</p>
                    <p><b className="text-slate-400">Status:</b> <span className="text-emerald-400 font-bold">Gyldig & Registrert</span></p>
                    <p><b className="text-slate-400">Forsikring:</b> Full kasko inkl. yrkesskade og passasjeransvar</p>
                  </div>
                </div>

                <div className="bg-[#0D121D] p-6 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs font-bold text-[#D4AF37] uppercase">LØYVENUMMER</span>
                    <span className="font-mono text-sm font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">OS 13937</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p><b className="text-slate-400">Tilknyttet bil:</b> Mercedes EQE 350 (EF 79664)</p>
                    <p><b className="text-slate-400">Fylke / Kommune:</b> Oslo</p>
                    <p><b className="text-slate-400">Status:</b> <span className="text-emerald-400 font-bold">Gyldig & Registrert</span></p>
                    <p><b className="text-slate-400">Forsikring:</b> Full kasko inkl. yrkesskade og passasjeransvar</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {selectedImage && activeVehicle && (
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
                alt={activeVehicle.model}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-2 text-xs">
              <div>
                <span className="font-display font-bold text-[#F5F2ED] text-base block">{activeVehicle.model}</span>
                <span className="text-slate-400 font-mono">Kjennemerke: {activeVehicle.licensePlate} · Løyve: {activeVehicle.permitNumber}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {activeVehicle.imageUrls.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`w-12 h-10 rounded-lg overflow-hidden border transition-all ${
                      selectedImage === img ? 'border-[#D4AF37] scale-105' : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
