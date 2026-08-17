import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LeafletMap } from '../components/LeafletMap';
import { verifyStripeSession, VerificationResult } from '../services/stripeClient';
import { useTrips } from '../context/TripContext';
import { Trip } from '../types';
import { db } from '../services/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import {
  CheckCircle2,
  Loader2,
  Car,
  MapPin,
  Navigation,
  Clock,
  User,
  Phone,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Receipt,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Crown
} from 'lucide-react';

export const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trips } = useTrips();

  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id') || '';
  const tripIdParam = searchParams.get('trip_id') || '';

  const [verifying, setVerifying] = useState<boolean>(true);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Initial Verification via backend Stripe API
  useEffect(() => {
    if (!sessionId) {
      setErrorMsg('Mangler Stripe Checkout sesjons-ID i adresselinjen.');
      setVerifying(false);
      return;
    }

    let isMounted = true;
    verifyStripeSession(sessionId, tripIdParam || undefined)
      .then(async (res) => {
        if (!isMounted) return;
        setVerification(res);
        setVerifying(false);

        const targetTripId = res.tripId || tripIdParam;
        if (targetTripId) {
          // Check locally in TripContext first
          const localMatch = trips.find((t) => t.id === targetTripId || t.tripId === targetTripId);
          if (localMatch) {
            setTrip(localMatch);
          } else {
            try {
              const snap = await getDoc(doc(db, 'trips', targetTripId));
              if (snap.exists()) {
                setTrip(snap.data() as Trip);
              }
            } catch (e) {
              console.warn('Could not fetch trip directly from Firestore:', e);
            }
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Payment verification failed:', err);
        setErrorMsg('Kunne ikke verifisere betalingen mot betalingsserveren.');
        setVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, tripIdParam]);

  // 2. Real-time listener on the trip document in Firestore
  const targetId = trip?.id || tripIdParam || verification?.tripId;
  useEffect(() => {
    if (!targetId) return;

    const unsub = onSnapshot(
      doc(db, 'trips', targetId),
      (snap) => {
        if (snap.exists()) {
          setTrip(snap.data() as Trip);
        }
      },
      (err) => console.log('Live trip track note on success page:', err.message)
    );

    return () => unsub();
  }, [targetId]);

  return (
    <div className="min-h-screen bg-[#070A10] text-[#F5F2ED] flex flex-col selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl w-full mx-auto space-y-8">
        {verifying ? (
          <div className="bg-[#0E131F] border border-white/10 rounded-3xl p-10 text-center space-y-4 shadow-2xl backdrop-blur-xl">
            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-white">Verifiserer betaling med Stripe...</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Vi sjekker betalingsstatusen med Stripe og oppdaterer din bestilling i sanntid.
            </p>
          </div>
        ) : errorMsg ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Verifisering Feilet</h2>
            <p className="text-xs text-rose-300 max-w-md mx-auto">{errorMsg}</p>
            <div className="pt-4 flex justify-center gap-4">
              <Link
                to="/bestill"
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Tilbake til Bestilling
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* SUCCESS BANNER */}
            <div className="bg-gradient-to-br from-[#0F1420] via-[#141C2B] to-[#0A0D14] border-2 border-[#D4AF37] rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-slate-950 flex items-center justify-center shadow-2xl shadow-[#D4AF37]/30 shrink-0">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-3 py-1 bg-[#34D186]/20 border border-[#34D186]/40 text-[#34D186] text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Stripe Betaling Bekreftet
                    </span>
                    {trip?.id && (
                      <span className="px-3 py-1 bg-white/10 border border-white/15 text-slate-300 text-[10px] font-mono font-bold rounded-full">
                        Tur-ID: {trip.id}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    Takk for din bestilling!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                    Betalingen er autorisert og registrert. Nærmeste ledige Aron VIP-sjåfør er nå varslet og klargjør turen din.
                  </p>
                </div>
              </div>

              {/* PAYMENT RECEIPT SUMMARY */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Beløp Betalt</span>
                  <span className="text-base font-black font-mono text-[#D4AF37]">
                    {verification?.amountTotal || trip?.estimatedPrice || trip?.finalPrice || '—'} NOK
                  </span>
                </div>

                <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Betalingsmåte</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Stripe Kort
                  </span>
                </div>

                <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="text-xs font-black text-[#34D186] uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Betalt & Bekreftet
                  </span>
                </div>

                <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Sjåførstatus</span>
                  <span className="text-xs font-bold text-white truncate">
                    {trip?.driverName ? `Tildelt ${trip.driverName}` : 'Søker etter sjåfør...'}
                  </span>
                </div>
              </div>
            </div>

            {/* ROUTE & PASSENGER DETAILS */}
            {trip && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0E131F]/90 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-xl">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Rutedetaljer
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-3 p-3 bg-black/30 rounded-2xl border border-white/5">
                      <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Henteadresse</span>
                        <span className="text-white font-medium">{trip.pickup?.address}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-black/30 rounded-2xl border border-white/5">
                      <Navigation className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 rotate-45" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Destinasjon</span>
                        <span className="text-white font-medium">{trip.destination?.address}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400">
                      <div>
                        Distanse: <strong className="text-white">{trip.distanceKm} km</strong>
                      </div>
                      <div>
                        Est. reisetid: <strong className="text-white">{trip.durationMinutes} min</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0E131F]/90 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Kjøretøy & Passasjer
                    </h3>

                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-slate-400">Klasse:</span>
                        <span className="font-bold text-white">
                          {trip.vehicleCategory === 'airport_vip'
                            ? 'Aron Airport VIP'
                            : trip.vehicleCategory === 'comfort_eco'
                            ? 'Aron Comfort Electric'
                            : 'Aron Black VIP Executive'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-slate-400">Passasjer:</span>
                        <span className="font-medium text-white">{trip.customerName}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-slate-400">Telefon:</span>
                        <span className="font-mono text-white">{trip.customerPhone}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Kvittering sendt til:</span>
                        <span className="font-mono text-white">{trip.customerEmail}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/konto"
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#C5A028] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg text-center flex items-center justify-center gap-1.5"
                    >
                      Følg Turen på Min Side
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/bestill"
                      className="py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center"
                    >
                      Ny Bestilling
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
