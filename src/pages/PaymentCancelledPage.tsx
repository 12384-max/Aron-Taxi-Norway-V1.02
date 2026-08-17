import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useTrips } from '../context/TripContext';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Trip } from '../types';
import {
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Phone,
  HelpCircle
} from 'lucide-react';

export const PaymentCancelledPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trips } = useTrips();

  const searchParams = new URLSearchParams(location.search);
  const tripIdParam = searchParams.get('trip_id') || '';

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!tripIdParam) {
      setLoading(false);
      return;
    }

    // Check TripContext or fetch from Firestore
    const localMatch = trips.find((t) => t.id === tripIdParam || t.tripId === tripIdParam);
    if (localMatch) {
      setTrip(localMatch);
      setLoading(false);
    } else {
      getDoc(doc(db, 'trips', tripIdParam))
        .then((snap) => {
          if (snap.exists()) {
            setTrip(snap.data() as Trip);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    // Mark trip paymentStatus as cancelled/pending_payment if needed
    try {
      updateDoc(doc(db, 'trips', tripIdParam), {
        paymentStatus: 'cancelled',
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    } catch (e) {}
  }, [tripIdParam, trips]);

  const handleRetryPayment = () => {
    if (trip) {
      navigate('/bestill', {
        state: {
          existingTripId: trip.id,
          fromAddress: trip.pickup?.address,
          toAddress: trip.destination?.address,
          fromPoint: trip.pickup,
          toPoint: trip.destination,
          customerName: trip.customerName,
          customerEmail: trip.customerEmail,
          customerPhone: trip.customerPhone,
          selectedTier: trip.vehicleCategory,
          couponCode: trip.couponCode,
        },
      });
    } else {
      navigate('/bestill');
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-[#F5F2ED] flex flex-col selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-2xl w-full mx-auto space-y-8">
        <div className="bg-gradient-to-br from-[#0F1420] via-[#141C2B] to-[#0A0D14] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-center">
          
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-xl">
            <XCircle className="w-10 h-10 stroke-[2]" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold uppercase rounded-full tracking-wider">
              Stripe Betaling Avbrutt
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Betalingen ble ikke fullført
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed max-w-md mx-auto">
              Stripe Checkout-økten ble avbrutt eller lukket. <strong>Ingen penger er trukket</strong> fra ditt betalingskort, og taxibestillingen er <strong>ikke bekreftet</strong>.
            </p>
          </div>

          {trip && (
            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Tur-referanse:</span>
                <span className="font-mono font-bold text-white">{trip.id}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Rute:</span>
                <span className="font-medium text-white truncate max-w-[240px]">
                  {trip.pickup?.address} → {trip.destination?.address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Beløp:</span>
                <span className="font-mono font-bold text-[#D4AF37]">
                  {trip.estimatedPrice} NOK
                </span>
              </div>
            </div>
          )}

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-300 text-left space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              Hva skjer nå?
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>Turen blir stående som ubetalt og vil ikke bli tildelt noen sjåfør.</li>
              <li>Du kan når som helst prøve betalingen på nytt med samme eller et annet kort.</li>
              <li>Du kan også velge å betale direkte i bilen med kontant eller kortterminal.</li>
            </ul>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetryPayment}
              className="flex-1 py-3.5 px-6 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#C5A028] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Prøv Betaling på Nytt
            </button>
            <Link
              to="/bestill"
              className="py-3.5 px-6 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-all text-center flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til Bestilling
            </Link>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
            Trenger du hjelp? Ring Aron Taxi kundeservice på <strong>+47 96 99 09 01</strong>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
