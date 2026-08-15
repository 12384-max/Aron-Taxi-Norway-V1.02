import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LeafletMap } from '../components/LeafletMap';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import { Trip, Coupon } from '../types';
import { getStoredCoupons, validateAndCalculateDiscount } from '../services/couponService';
import {
  User,
  Car,
  Clock,
  MapPin,
  CheckCircle,
  Receipt,
  ArrowLeft,
  Printer,
  ShieldCheck,
  Tag,
  Percent,
  Gift,
  Crown,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Building2,
  Phone,
  Mail,
  Shield,
  FileText
} from 'lucide-react';

export const CustomerAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: paramTripId } = useParams<{ id?: string }>();
  const { user, guestId, logout } = useAuth();
  const { trips } = useTrips();

  const [activeTab, setActiveTab] = useState<'trips' | 'discounts' | 'receipt' | 'profile'>('trips');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemInput, setRedeemInput] = useState<string>('');

  const coupons: Coupon[] = getStoredCoupons();

  // Filter trips for current customer or guest
  const customerTrips = trips.filter(
    (t) =>
      (user?.uid && t.customerId === user.uid) ||
      (guestId && t.guestId === guestId) ||
      (user?.email && t.customerEmail === user.email) ||
      t.customerPhone === user?.phone
  );

  const activeTrip = customerTrips.find(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  );

  const pastTrips = customerTrips.filter((t) => t.status === 'completed' || t.status === 'cancelled');

  const openReceipt = (trip: Trip) => {
    setSelectedTrip(trip);
    setActiveTab('receipt');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kopierte rabattkode «${code}»!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleUseCouponInBooking = (code: string) => {
    navigate('/bestill', { state: { couponCode: code } });
  };

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemInput.trim()) return;

    const res = validateAndCalculateDiscount(redeemInput.trim(), 500);
    if (res.valid) {
      toast.success(`Rabattkode «${redeemInput.trim().toUpperCase()}» er gyldig!`, {
        description: res.discountDescription
      });
      handleUseCouponInBooking(redeemInput.trim().toUpperCase());
    } else {
      toast.error(res.errorMessage || 'Ugyldig rabattkode.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* CUSTOMER HEADER INFO */}
        <div className="bg-[#0E131F]/90 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/25 to-black border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-black text-2xl shadow-xl">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'VIP'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-white">
                  {user?.name || 'Aron Taxi VIP Kunde'}
                </h1>
                <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase rounded-full tracking-widest flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  VIP Medlem
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user?.email || 'Gjestekonto'} · {user?.phone || '+47 900 00 000'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/bestill"
              className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#C5A028] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              Bestill VIP Taxi
            </Link>
            <button
              onClick={() => logout()}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-all cursor-pointer"
            >
              Logg ut
            </button>
          </div>
        </div>

        {/* ONGOING ACTIVE TRIP BANNER */}
        {activeTrip && (
          <div className="bg-gradient-to-r from-[#0F1420] via-[#161e2e] to-[#0F1420] border-2 border-[#D4AF37] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-[#D4AF37] text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-full mb-2">
                  PÅGÅENDE TUR · {activeTrip.id}
                </span>
                <h2 className="font-display text-2xl font-bold text-white">
                  Status: <span className="text-[#D4AF37] uppercase">{activeTrip.status.replace('_', ' ')}</span>
                </h2>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Fastpris</span>
                <span className="text-2xl font-black text-[#D4AF37] font-display">{activeTrip.estimatedPrice} NOK</span>
              </div>
            </div>

            {/* LIVE MAP TRACKER */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Sanntids kart og sporing
              </label>
              <LeafletMap
                pickup={activeTrip.pickup}
                destination={activeTrip.destination}
                driverLocation={activeTrip.driverLocation}
                routeGeometry={activeTrip.routeGeometry}
              />
            </div>

            {/* DRIVER INFO IF ASSIGNED */}
            {activeTrip.driverName && (
              <div className="p-4 bg-[#090D16] rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <span className="font-bold text-white block">{activeTrip.driverName}</span>
                    <span className="text-slate-400">{activeTrip.vehicleModel} ({activeTrip.vehicleLicensePlate})</span>
                  </div>
                </div>
                <a
                  href={`tel:${activeTrip.driverPhone}`}
                  className="px-4 py-2 bg-[#D4AF37] text-slate-950 font-black rounded-xl text-xs uppercase"
                >
                  Ring sjåfør
                </a>
              </div>
            )}
          </div>
        )}

        {/* TABS SELECTION */}
        <div className="flex flex-wrap border-b border-white/10 text-xs font-black uppercase tracking-wider gap-2">
          <button
            onClick={() => setActiveTab('trips')}
            className={`py-3 px-6 border-b-2 transition-all cursor-pointer ${
              activeTab === 'trips'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Mine Turer ({customerTrips.length})
          </button>

          <button
            onClick={() => setActiveTab('discounts')}
            className={`py-3 px-6 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'discounts'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Tag className="w-4 h-4 text-[#D4AF37]" />
            Mine Rabatter & VIP Fordeler ({coupons.length})
          </button>

          {selectedTrip && (
            <button
              onClick={() => setActiveTab('receipt')}
              className={`py-3 px-6 border-b-2 transition-all cursor-pointer ${
                activeTab === 'receipt'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Offisiell Kvittering #{selectedTrip.id}
            </button>
          )}
        </div>

        {/* 1. TRIPS LIST TAB */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            {customerTrips.length === 0 ? (
              <div className="bg-[#0E131F]/90 border border-white/10 rounded-3xl p-12 text-center space-y-4 backdrop-blur-xl">
                <Car className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="font-display text-xl font-bold text-slate-200">
                  Ingen aktive eller tidligere turer registrert.
                </h3>
                <p className="text-xs text-slate-400 font-light max-w-md mx-auto">
                  Når du bestiller en tur hos Aron Taxi Norway, vil bestillingen, live sporing og offisiell kvittering lagres automatisk her.
                </p>
                <Link
                  to="/bestill"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#C5A028] text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg cursor-pointer hover:brightness-110"
                >
                  Bestill din første VIP-tur nå
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-[#0E131F]/90 border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl transition-all"
                  >
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-white/10">
                      <div>
                        <span className="font-mono font-bold text-[#D4AF37]">{trip.id}</span>
                        <span className="text-slate-400 block text-[10px]">{new Date(trip.createdAt).toLocaleString('no-NO')}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        trip.status === 'completed'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                      }`}>
                        {trip.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span className="truncate"><b>Fra:</b> {trip.pickup?.address || 'Henteadresse'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate"><b>Til:</b> {trip.destination?.address || 'Destinasjonsadresse'}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                      <div>
                        <span className="font-mono font-black text-white text-base">{trip.estimatedPrice} NOK</span>
                        {trip.couponCode && (
                          <span className="text-[10px] text-emerald-400 block font-bold">Kupong: {trip.couponCode}</span>
                        )}
                      </div>
                      <button
                        onClick={() => openReceipt(trip)}
                        className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Offisiell Kvittering
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. DISCOUNTS & VIP REWARDS TAB */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            
            {/* VIP MEMBERSHIP PASS CARD */}
            <div className="bg-gradient-to-r from-[#121826] via-[#1A2234] to-[#0D121D] border-2 border-[#D4AF37] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-[#D4AF37] text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full">
                    DIGITALT MEDLEMSKORT
                  </span>
                  <h2 className="font-display text-2xl font-black text-white">
                    Aron Black VIP Pass
                  </h2>
                  <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                    Som registrert VIP-kunde hos Aron Taxi får du faste rabatter, prioritert bilutsendelse i rushtid, og garantert privatsjåfør i dress.
                  </p>
                </div>

                <div className="bg-[#0A0D14]/80 p-5 rounded-2xl border border-[#D4AF37]/40 text-center space-y-1 min-w-[200px] shadow-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Ditt VIP-nivå</span>
                  <span className="text-xl font-black text-[#D4AF37] font-display flex items-center justify-center gap-1.5">
                    <Crown className="w-5 h-5" />
                    PLATINUM VIP
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono block">Fast 20% Rabatt Tilgjengelig</span>
                </div>
              </div>
            </div>

            {/* REDEEM PROMO CODE INPUT */}
            <div className="bg-[#0E131F]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Aktiver Gavekort eller Ny Rabattkode
              </h3>
              <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Skriv inn rabattkode (f.eks. ARONVIP eller VELKOMMEN2026)"
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 bg-[#070A10] border border-white/10 rounded-xl text-xs text-white uppercase font-mono focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#C5A028] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-lg"
                >
                  Aktiver & Bruk i Bestilling
                </button>
              </form>
            </div>

            {/* ACTIVE COUPONS GRID */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Tilgjengelige Rabatter for deg ({coupons.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="bg-[#0E131F]/90 border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-lg font-black text-[#D4AF37] tracking-wider block">
                          {coupon.code}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                          Aktiv
                        </span>
                      </div>

                      <div className="text-xs text-white font-bold mb-1">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% Rabatt på hele turen`
                          : `${coupon.discountValue} NOK Fast Avslag`}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed font-light mb-3">
                        {coupon.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Minstebeløp: {coupon.minTripAmount || 150} NOK</span>
                        <span>Utløper: {coupon.expiryDate}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(coupon.code)}
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                        >
                          {copiedCode === coupon.code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Kopiert
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              Kopier
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUseCouponInBooking(coupon.code)}
                          className="flex-1 py-2 bg-[#D4AF37] hover:brightness-110 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
                        >
                          Bruk Kode
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 3. OFFICIAL RECEIPT VIEW TAB */}
        {activeTab === 'receipt' && selectedTrip && (
          <div className="max-w-2xl mx-auto bg-[#0E131F]/95 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-xl">
            
            {/* COMPANY HEADER */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest block">
                  OFFISIELL DROSJEKVITTERING
                </span>
                <h2 className="font-display text-2xl font-black text-white">Aron Taxi Norway AS</h2>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Org.nr: 931 482 109 MVA · Tlf: +47 96 99 09 01
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl border border-white/10 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                Skriv ut / PDF
              </button>
            </div>

            {/* TRIP & CUSTOMER SPECS */}
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Tur-ID:</span>
                <span className="font-mono font-bold text-white text-sm">{selectedTrip.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Dato & Tid:</span>
                <span className="font-mono text-white">{new Date(selectedTrip.createdAt).toLocaleString('no-NO')}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Passasjer:</span>
                <span className="text-white font-medium">{selectedTrip.customerName}</span>
                <span className="block text-slate-400 text-[11px] font-mono">{selectedTrip.customerPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Sjåfør & Bil:</span>
                <span className="text-white font-medium">{selectedTrip.driverName || 'Aron Privatsjåfør'}</span>
                <span className="block text-[#D4AF37] text-[11px] font-mono">
                  {selectedTrip.vehicleModel || 'Tesla Model Y'} ({selectedTrip.vehicleLicensePlate || 'EK 88201'})
                </span>
              </div>
            </div>

            {/* ROUTE SUMMARY */}
            <div className="p-4 bg-[#070A10] rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 font-bold">Henteadresse:</span>
                <span className="text-slate-200 text-right font-medium">{selectedTrip.pickup?.address || '–'}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 font-bold">Destinasjon:</span>
                <span className="text-slate-200 text-right font-medium">{selectedTrip.destination?.address || '–'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 font-mono text-[11px] text-slate-400">
                <span>Avstand: {selectedTrip.distanceKm} km</span>
                <span>Kjøretid: {selectedTrip.durationMinutes} min</span>
              </div>
            </div>

            {/* PRICING & MVA BREAKDOWN */}
            <div className="pt-4 border-t border-white/10 space-y-2 text-xs">
              {selectedTrip.originalPrice && selectedTrip.originalPrice !== selectedTrip.estimatedPrice && (
                <div className="flex justify-between text-slate-400">
                  <span>Ordinær fastpris:</span>
                  <span className="font-mono">{selectedTrip.originalPrice} NOK</span>
                </div>
              )}

              {selectedTrip.couponCode && selectedTrip.discountAmount && (
                <div className="flex justify-between text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  <span>Rabattkode ({selectedTrip.couponCode}):</span>
                  <span className="font-mono font-bold">-{selectedTrip.discountAmount} NOK</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Nettobeløp (ekskl. MVA):</span>
                <span className="font-mono">{Math.round(selectedTrip.estimatedPrice / 1.12)} NOK</span>
              </div>

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>MVA (12% personstransport):</span>
                <span className="font-mono">{Math.round(selectedTrip.estimatedPrice - (selectedTrip.estimatedPrice / 1.12))} NOK</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Betalingsmåte:</span>
                <span className="uppercase font-bold text-white">{selectedTrip.paymentMethod}</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-white/10 font-black text-base text-[#D4AF37]">
                <span>TOTALT BETALT:</span>
                <span className="font-mono text-xl">{selectedTrip.estimatedPrice} NOK</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('trips')}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-200 font-black uppercase text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
            >
              &larr; Tilbake til mine turer
            </button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};
