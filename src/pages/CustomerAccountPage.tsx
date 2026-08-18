import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LeafletMap } from '../components/LeafletMap';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import { Trip, Driver } from '../types';
import { generateTripPDFReceipt } from '../utils/pdfReceipt';
import {
  User,
  Car,
  Clock,
  MapPin,
  CheckCircle,
  Receipt,
  Printer,
  ShieldCheck,
  Crown,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  Navigation,
  ExternalLink,
  Plus,
  Trash2,
  Download,
  FileText,
  Edit3,
  Save,
  CheckCircle2,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

export const CustomerAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, guestId, logout, updateProfile } = useAuth();
  const { trips, drivers, vehicles, addTipAndRatingToTrip, cancelTrip, deleteTrip, updateCustomer } = useTrips();

  const [activeTab, setActiveTab] = useState<'active' | 'trips' | 'receipt' | 'profile'>('active');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? '');
  const [profileAvatar, setProfileAvatar] = useState(user?.notes ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync state if user loads asynchronously
  React.useEffect(() => {
    if (user) {
      if (user.name) setProfileName(user.name);
      if (user.email) setProfileEmail(user.email);
      if (user.phone) setProfilePhone(user.phone);
      if (user.notes) setProfileAvatar(user.notes);
    }
  }, [user?.name, user?.email, user?.phone, user?.notes]);

  const handleCancelActiveTrip = async (tripId: string) => {
    if (!window.confirm('Er du sikker på at du vil kansellere denne taxibestillingen?')) return;
    try {
      await cancelTrip(tripId, 'Kansellert av kunde');
      toast.success('Bestillingen er kansellert.');
    } catch (err) {
      toast.error('Kunne ikke kansellere bestillingen.');
    }
  };

  const handleDeletePastTrip = async (tripId: string) => {
    if (!window.confirm('Vil du slette denne turen fra din personlige historikk?')) return;
    try {
      await deleteTrip(tripId);
      toast.success('Turen ble slettet fra historikken.');
    } catch (err) {
      toast.error('Kunne ikke slette turen.');
    }
  };

  // Filter trips for current customer or guest
  const customerTrips = trips.filter(
    (t) =>
      (user?.uid && t.customerId === user.uid) ||
      (guestId && t.guestId === guestId) ||
      (user?.email && t.customerEmail === user.email) ||
      t.customerPhone === user?.phone
  );

  const activeTrip = customerTrips.find(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'rejected'
  );

  const pastTrips = customerTrips.filter((t) => t.status === 'completed');

  // Find assigned driver if in active trip
  const assignedDriver: Driver | undefined = activeTrip?.driverId
    ? drivers.find((d) => d.id === activeTrip.driverId)
    : undefined;

  const assignedVehicle = assignedDriver?.vehicleId
    ? vehicles.find((v) => v.id === assignedDriver.vehicleId)
    : undefined;

  const openReceipt = (trip: Trip) => {
    setSelectedTrip(trip);
    setActiveTab('receipt');
  };

  const handleDownloadPDF = (trip: Trip) => {
    try {
      generateTripPDFReceipt(trip);
      toast.success('Offisiell PDF-kvittering lastet ned!');
    } catch (err) {
      toast.error('Kunne ikke generere PDF-kvittering.');
    }
  };

  const handleRebookTrip = (trip: Trip) => {
    navigate('/bestill', {
      state: {
        fromAddress: trip.pickup?.address,
        toAddress: trip.destination?.address
      }
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      if (user?.uid) {
        await updateCustomer(user.uid, {
          name: profileName.trim(),
          email: profileEmail.trim(),
          phone: profilePhone.trim(),
          notes: profileAvatar.trim()
        });
      }
      setIsEditingProfile(false);
      toast.success('Profilopplysninger ble oppdatert!');
    } catch (err) {
      toast.error('Kunne ikke oppdatere profilen.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-[#F5F2ED] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-6xl w-full mx-auto space-y-6">
        
        {/* CUSTOMER PROFILE BANNER */}
        <div className="bg-[#0E131F]/90 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/25 to-black border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-black text-xl sm:text-2xl shadow-xl shrink-0 overflow-hidden">
              {profileAvatar ? (
                <img src={profileAvatar} alt="Profilbilde" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'VIP'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  {profileName || user?.name || 'Aron Taxi VIP Kunde'}
                </h1>
                <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  VIP Medlem
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>{profileEmail || user?.email || 'Registrert'}</span>
                <span>•</span>
                <span>{profilePhone || user?.phone || 'Oslo'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to="/bestill"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 hover:brightness-110 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Bestill Ny VIP Tur
            </Link>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'active'
                ? 'bg-[#D4AF37] text-slate-950 shadow-lg font-black'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Aktiv Tur {activeTrip ? '(1)' : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'trips'
                ? 'bg-[#D4AF37] text-slate-950 shadow-lg font-black'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Turhistorikk ({pastTrips.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'receipt'
                ? 'bg-[#D4AF37] text-slate-950 shadow-lg font-black'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Kvittering & PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'profile'
                ? 'bg-[#D4AF37] text-slate-950 shadow-lg font-black'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Rediger Profil</span>
          </button>
        </div>

        {/* TAB CONTENT 1: AKTIV TUR */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeTrip ? (
              <div className="bg-[#0E131F]/90 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">
                        {activeTrip.status === 'searching_driver' && 'Søker nærmeste VIP-sjåfør...'}
                        {activeTrip.status === 'driver_assigned' && 'Privatsjåfør er på vei til deg'}
                        {activeTrip.status === 'driver_arrived' && 'Sjåføren har ankommet henteadressen!'}
                        {activeTrip.status === 'trip_started' && 'Eksklusiv tur pågår...'}
                        {activeTrip.status === 'pending' && 'Bestilling mottatt'}
                      </h2>
                      <span className="text-xs text-slate-400 font-mono">Tur-ID: #{activeTrip.id.slice(-6)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">Fastpris</span>
                    <span className="text-lg font-black text-[#D4AF37] font-mono">{activeTrip.estimatedPrice} NOK</span>
                  </div>
                </div>

                {/* MAP TRACKING */}
                <div className="rounded-2xl overflow-hidden border border-white/10 h-72">
                  <LeafletMap
                    className="w-full h-full"
                    pickup={activeTrip.pickup}
                    destination={activeTrip.destination}
                    driverLocation={activeTrip.driverLocation}
                    routeGeometry={activeTrip.routeGeometry}
                    zoom={14}
                  />
                </div>

                {/* DRIVER INFO IF ASSIGNED */}
                {assignedDriver && (
                  <div className="bg-[#151B28] rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{assignedDriver.name}</h4>
                        <p className="text-[11px] text-slate-300">{assignedVehicle?.model || 'Tesla Model Y Juniper'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{assignedVehicle?.licensePlate || 'EL 98450'}</p>
                      </div>
                    </div>

                    {assignedDriver.phone && (
                      <a
                        href={`tel:${assignedDriver.phone}`}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Ring Sjåfør
                      </a>
                    )}
                  </div>
                )}

                {/* CANCEL BUTTON */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleCancelActiveTrip(activeTrip.id)}
                    className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer"
                  >
                    Kanseller bestilling
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#0E131F]/90 border border-white/10 rounded-3xl p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                  <Car className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white">Ingen aktiv tur akkurat nå</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Du har ingen pågående drosjereise i Oslo for øyeblikket. Bestill en tur med fastpris og privatsjåfør når du trenger skyss.
                </p>
                <Link
                  to="/bestill"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Bestill Reise
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 2: TURHISTORIKK */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Fullførte turer ({pastTrips.length})</h2>
            </div>

            {pastTrips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastTrips.map((t) => (
                  <div
                    key={t.id}
                    className="bg-[#0E131F]/90 border border-white/10 rounded-2xl p-4 space-y-3 hover:border-[#D4AF37]/40 transition-colors shadow-lg"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString('no-NO')} · {new Date(t.createdAt).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs font-black text-[#D4AF37] font-mono">{t.finalPrice || t.estimatedPrice} NOK</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-slate-300 truncate">{t.pickup?.address}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-slate-300 truncate">{t.destination?.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDownloadPDF(t)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-[#D4AF37] hover:text-slate-950 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Last ned offisiell PDF"
                        >
                          <Download className="w-3 h-3" />
                          PDF
                        </button>
                        <button
                          onClick={() => openReceipt(t)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Se kvittering
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRebookTrip(t)}
                          className="px-3 py-1 bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-slate-950 rounded-lg text-[11px] font-black transition-colors cursor-pointer"
                        >
                          Bestill igjen
                        </button>
                        <button
                          onClick={() => handleDeletePastTrip(t.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Slett fra historikk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0E131F]/90 border border-white/10 rounded-2xl p-8 text-center text-slate-400 text-xs">
                Ingen tidligere turer funnet i din historikk.
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 3: KVITTERING & PDF GENERATOR */}
        {activeTab === 'receipt' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {selectedTrip || pastTrips[0] ? (
              (() => {
                const rTrip = selectedTrip || pastTrips[0];
                return (
                  <div className="bg-[#0E131F]/95 border border-[#D4AF37]/40 rounded-3xl p-6 shadow-2xl space-y-5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase block">ARON TAXI NORWAY</span>
                        <h2 className="text-lg font-bold text-white">Turkvittering #{rTrip.id.slice(-6).toUpperCase()}</h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadPDF(rTrip)}
                          className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C5A028] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          Last ned PDF
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 cursor-pointer"
                          title="Skriv ut"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs bg-black/40 p-4 rounded-2xl border border-white/10">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Kunde</span>
                        <div className="font-semibold text-white mt-0.5">{rTrip.customerName}</div>
                        <div className="text-slate-400 font-mono">{rTrip.customerPhone}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Dato & Tid</span>
                        <div className="font-semibold text-white mt-0.5">{new Date(rTrip.createdAt).toLocaleDateString('no-NO')}</div>
                        <div className="text-slate-400 font-mono">{new Date(rTrip.createdAt).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Hentested</span>
                          <span className="text-white">{rTrip.pickup?.address}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Destinasjon</span>
                          <span className="text-white">{rTrip.destination?.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#151B28] rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Persontransport ({rTrip.distanceKm} km)</span>
                        <span className="font-mono">{Math.round((rTrip.finalPrice || rTrip.estimatedPrice) / 1.12)} NOK</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>MVA (12%)</span>
                        <span className="font-mono">{Math.round((rTrip.finalPrice || rTrip.estimatedPrice) - (rTrip.finalPrice || rTrip.estimatedPrice) / 1.12)} NOK</span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-black text-white">
                        <span>Totalt betalt</span>
                        <span className="text-[#D4AF37] font-mono">{rTrip.finalPrice || rTrip.estimatedPrice} NOK</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-[#0E131F]/90 border border-white/10 rounded-2xl p-8 text-center text-slate-400 text-xs">
                Ingen kvitteringer tilgjengelig ennå.
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 4: REDIGER KONTO & PROFIL */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto bg-[#0E131F]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Konto & Profilopplysninger</h2>
                  <p className="text-xs text-slate-400">Oppdater navn, e-post, telefonnummer og bilde</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Fullt navn</label>
                <input
                  type="text"
                  value={profileName ?? ''}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Ola Nordmann"
                  className="w-full bg-[#151B28] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-[#D4AF37] outline-none"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">E-postadresse (Google / e-post)</label>
                <input
                  type="email"
                  value={profileEmail ?? ''}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="ola@gmail.com"
                  className="w-full bg-[#151B28] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-[#D4AF37] outline-none"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Telefonnummer</label>
                <input
                  type="tel"
                  value={profilePhone ?? ''}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+47 900 00 000"
                  className="w-full bg-[#151B28] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-[#D4AF37] outline-none font-mono"
                  required
                />
              </div>

              {/* Profile Image URL */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Profilbilde URL (valgfritt)</label>
                <input
                  type="url"
                  value={profileAvatar ?? ''}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#151B28] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-[#D4AF37] outline-none font-mono"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Lagrer...' : 'Lagre Oppdateringer'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};
