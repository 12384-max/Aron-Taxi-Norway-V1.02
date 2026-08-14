import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LeafletMap } from '../components/LeafletMap';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import { Trip } from '../types';
import { User, Car, Clock, MapPin, CheckCircle, Receipt, ArrowLeft, Printer, ShieldCheck } from 'lucide-react';

export const CustomerAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: paramTripId } = useParams<{ id?: string }>();
  const { user, guestId, logout } = useAuth();
  const { trips } = useTrips();

  const [activeTab, setActiveTab] = useState<'trips' | 'receipt' | 'profile'>('trips');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

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

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* CUSTOMER HEADER INFO */}
        <div className="bg-[#121722]/90 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#D4AF37]/15 border-2 border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xl">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[#F5F2ED]">
                Velkommen, {user?.name || 'Gjestekunde'}
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                {user?.email || 'Gjestebestilling uden passord'} · {user?.phone || '+47 900 00 000'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/bestill"
              className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-md shadow-[#D4AF37]/20"
            >
              Bestill ny taxi
            </Link>
            <button
              onClick={() => logout()}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-full border border-white/10 transition-all"
            >
              Logg ut
            </button>
          </div>
        </div>

        {/* ONGOING ACTIVE TRIP BANNER */}
        {activeTrip && (
          <div className="bg-gradient-to-r from-[#121722] via-[#1a2130] to-[#121722] border-2 border-[#D4AF37] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-[#D4AF37] text-slate-950 text-[10px] font-extrabold uppercase tracking-widest rounded-full mb-2">
                  PÅGÅENDE TUR · {activeTrip.id}
                </span>
                <h2 className="font-display text-2xl font-bold text-[#F5F2ED]">
                  Status: <span className="text-[#D4AF37] uppercase">{activeTrip.status.replace('_', ' ')}</span>
                </h2>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Fastpris</span>
                <span className="text-2xl font-bold text-[#D4AF37] font-display">{activeTrip.estimatedPrice} NOK</span>
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
              <div className="p-4 bg-[#0D121D] rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <span className="font-bold text-[#F5F2ED] block">{activeTrip.driverName}</span>
                    <span className="text-slate-400">{activeTrip.vehicleModel} ({activeTrip.vehicleLicensePlate})</span>
                  </div>
                </div>
                <a
                  href={`tel:${activeTrip.driverPhone}`}
                  className="px-3 py-1.5 bg-[#D4AF37] text-slate-950 font-bold rounded-full text-xs"
                >
                  Ring sjåfør
                </a>
              </div>
            )}
          </div>
        )}

        {/* TABS SELECTION */}
        <div className="flex border-b border-white/10 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('trips')}
            className={`py-3 px-6 border-b-2 transition-all ${
              activeTab === 'trips'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Mine Turer ({customerTrips.length})
          </button>
          {selectedTrip && (
            <button
              onClick={() => setActiveTab('receipt')}
              className={`py-3 px-6 border-b-2 transition-all ${
                activeTab === 'receipt'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Kvittering #{selectedTrip.id}
            </button>
          )}
        </div>

        {/* TRIPS LIST TAB */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            {customerTrips.length === 0 ? (
              <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-12 text-center space-y-4 backdrop-blur-xl">
                <Car className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="font-display text-xl font-bold text-slate-200">
                  Ingen aktive eller tidligere turer registrert.
                </h3>
                <p className="text-xs text-slate-400 font-light max-w-md mx-auto">
                  Når du bestiller din første taxi hos Aron Taxi Norway, vil turen din og kvitteringen vises her.
                </p>
                <Link
                  to="/bestill"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] text-slate-950 font-bold uppercase text-xs rounded-full shadow-md"
                >
                  Bestill din første tur nå
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-[#121722]/90 border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-xl transition-all"
                  >
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-white/10">
                      <div>
                        <span className="font-mono font-bold text-[#D4AF37]">{trip.id}</span>
                        <span className="text-slate-400 block text-[10px]">{new Date(trip.createdAt).toLocaleString('no-NO')}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
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
                        <span className="truncate"><b>Fra:</b> {trip.pickup.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate"><b>Til:</b> {trip.destination.address}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                      <span className="font-bold text-[#F5F2ED] text-sm">{trip.estimatedPrice} NOK</span>
                      <button
                        onClick={() => openReceipt(trip)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-lg border border-white/10 transition-all flex items-center gap-1.5"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Se Kvittering
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECEIPT VIEW TAB */}
        {activeTab === 'receipt' && selectedTrip && (
          <div className="max-w-2xl mx-auto bg-[#121722]/90 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest block">OFFISIELL KVITTERING</span>
                <h2 className="font-display text-2xl font-bold text-[#F5F2ED]">Aron Taxi Norway</h2>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl border border-white/10 flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                Skriv ut
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Tur-ID:</span>
                <span className="font-mono font-bold text-[#F5F2ED]">{selectedTrip.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dato & Tid:</span>
                <span className="font-mono text-[#F5F2ED]">{new Date(selectedTrip.createdAt).toLocaleString('no-NO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kunde:</span>
                <span className="text-[#F5F2ED]">{selectedTrip.customerName} ({selectedTrip.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sjåfør:</span>
                <span className="text-[#F5F2ED]">{selectedTrip.driverName || 'Aron Taxi Sjåfør'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kjøretøy:</span>
                <span className="text-[#F5F2ED]">{selectedTrip.vehicleModel || 'Tesla Model Y Juniper'} ({selectedTrip.vehicleLicensePlate || 'EK 88201'})</span>
              </div>
            </div>

            <div className="p-4 bg-[#0D121D] rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Fra:</span>
                <span className="text-slate-200 font-medium">{selectedTrip.pickup.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Til:</span>
                <span className="text-slate-200 font-medium">{selectedTrip.destination.address}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-slate-400">Avstand / Kjøretid:</span>
                <span className="text-slate-200 font-mono">{selectedTrip.distanceKm} km ({selectedTrip.durationMinutes} min)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Fastpris / Brutto:</span>
                <span className="font-mono text-slate-200">{selectedTrip.estimatedPrice} NOK</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>MVA (12% personstransport):</span>
                <span>{Math.round(selectedTrip.estimatedPrice * 0.12)} NOK</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Betalingsmåte:</span>
                <span className="uppercase font-bold">{selectedTrip.paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/10 font-bold text-sm text-[#D4AF37]">
                <span>TOTALT BETALT:</span>
                <span>{selectedTrip.estimatedPrice} NOK</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('trips')}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-200 font-bold uppercase text-xs rounded-full border border-white/10"
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
