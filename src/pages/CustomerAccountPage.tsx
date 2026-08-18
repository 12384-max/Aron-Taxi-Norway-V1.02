import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LeafletMap } from '../components/LeafletMap';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import { Trip, Coupon, Driver } from '../types';
import { getStoredCoupons, validateAndCalculateDiscount } from '../services/couponService';
import {
  User,
  Car,
  Clock,
  MapPin,
  CheckCircle,
  Receipt,
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
  FileText,
  Star,
  MessageSquare,
  Share2,
  Navigation,
  ExternalLink,
  DollarSign,
  Heart,
  Plus,
  Compass,
  AlertTriangle,
  Trash2
} from 'lucide-react';

export const CustomerAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, guestId, logout } = useAuth();
  const { trips, drivers, vehicles, addTipAndRatingToTrip, cancelTrip, deleteTrip } = useTrips();

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

  const [activeTab, setActiveTab] = useState<'active' | 'trips' | 'favorites' | 'discounts' | 'receipt' | 'vip'>('active');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemInput, setRedeemInput] = useState<string>('');
  
  // Rating & Tip modal states for completed trip
  const [ratingTrip, setRatingTrip] = useState<Trip | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>(['Presis', 'Svært profesjonell']);

  // Quick SMS to driver modal
  const [showDriverChatModal, setShowDriverChatModal] = useState(false);

  // Favorite locations state
  const [savedFavorites, setSavedFavorites] = useState<{ id: string; name: string; address: string; icon: string }[]>(() => {
    const saved = localStorage.getItem('aron_customer_favorites');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'fav1', name: 'Hjem', address: 'Karl Johans gate 1, 0154 Oslo', icon: 'home' },
      { id: 'fav2', name: 'Jobb', address: 'Aker Brygge, 0250 Oslo', icon: 'work' },
      { id: 'fav3', name: 'Gardermoen Lufthavn (OSL)', address: 'Edvard Munchs veg, 2060 Gardermoen', icon: 'airport' }
    ];
  });

  const [newFavName, setNewFavName] = useState('');
  const [newFavAddress, setNewFavAddress] = useState('');
  const [showAddFav, setShowAddFav] = useState(false);

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

  const handleRebookTrip = (trip: Trip) => {
    navigate('/bestill', {
      state: {
        fromAddress: trip.pickup?.address,
        toAddress: trip.destination?.address
      }
    });
  };

  const handleShareTrip = (trip: Trip) => {
    const shareUrl = `${window.location.origin}/bestill?track_trip=${trip.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: 'Min Aron Taxi VIP Tur',
          text: `Følg min taxi-tur i sanntid fra ${trip.pickup?.address} til ${trip.destination?.address}:`,
          url: shareUrl
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Live sporingslenke kopiert til utklippstavlen!');
    }
  };

  const handleSaveNewFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFavName.trim() || !newFavAddress.trim()) return;

    const updated = [
      ...savedFavorites,
      {
        id: `fav_${Date.now()}`,
        name: newFavName.trim(),
        address: newFavAddress.trim(),
        icon: 'pin'
      }
    ];
    setSavedFavorites(updated);
    localStorage.setItem('aron_customer_favorites', JSON.stringify(updated));
    setNewFavName('');
    setNewFavAddress('');
    setShowAddFav(false);
    toast.success('Favorittadresse lagret!');
  };

  const handleDeleteFavorite = (id: string) => {
    const updated = savedFavorites.filter((f) => f.id !== id);
    setSavedFavorites(updated);
    localStorage.setItem('aron_customer_favorites', JSON.stringify(updated));
    toast.info('Favorittadresse fjernet.');
  };

  const handleSendDriverSms = (messageText: string) => {
    if (!assignedDriver?.phone && !activeTrip?.driverPhone) {
      toast.error('Sjåfør har ikke oppgitt telefonnummer.');
      return;
    }
    const phone = (assignedDriver?.phone || activeTrip?.driverPhone || '').replace(/\s+/g, '');
    window.open(`sms:${phone}?body=${encodeURIComponent(messageText)}`, '_blank');
    setShowDriverChatModal(false);
    toast.success('Melding åpnet!');
  };

  const handleSubmitRatingAndTip = async () => {
    if (!ratingTrip) return;
    await addTipAndRatingToTrip(ratingTrip.id, tipAmount, ratingStars, selectedCompliments.join(', '));
    toast.success(`Takk for vurderingen (${ratingStars} ★)${tipAmount > 0 ? ` og ${tipAmount} kr i tips!` : '!'}`);
    setRatingTrip(null);
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-[#F5F2ED] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-6xl w-full mx-auto space-y-6">
        
        {/* CUSTOMER PROFILE BANNER */}
        <div className="bg-[#0E131F]/90 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/25 to-black border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-black text-xl sm:text-2xl shadow-xl shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'VIP'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  {user?.name || 'Aron Taxi VIP Kunde'}
                </h1>
                <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  VIP Gull Medlem
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user?.email || 'Gjestekonto'} {user?.phone ? `· ${user.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              to="/bestill"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#C5A028] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              Bestill VIP Taxi
            </Link>
            <button
              onClick={() => logout()}
              className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-all cursor-pointer"
            >
              Logg ut
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0E131F] border border-white/10 rounded-xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Aktiv Tur {activeTrip ? '🟢' : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`py-2 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'trips'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Mine Turer ({pastTrips.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-2 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Favorittadresser</span>
          </button>

          <button
            onClick={() => setActiveTab('discounts')}
            className={`py-2 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'discounts'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Rabattkoder ({coupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vip')}
            className={`py-2 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'vip'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>VIP Fordeler</span>
          </button>
        </div>

        {/* TAB 1: ACTIVE TRIP COCKPIT & LIVE DRIVER TRACKING */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeTrip ? (
              <div className="bg-[#0E131F] border-2 border-[#D4AF37] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl shadow-[#D4AF37]/15 space-y-5">
                
                {/* Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-sm font-black uppercase text-[#D4AF37] tracking-wider">
                      {activeTrip.status === 'driver_assigned' || activeTrip.status === 'driver_arriving'
                        ? 'Sjåfør er på vei til deg'
                        : activeTrip.status === 'driver_arrived'
                        ? 'Sjåføren har ankommet henteadressen!'
                        : activeTrip.status === 'trip_started' || activeTrip.status === 'active'
                        ? 'Tur pågår · Live Taksameter'
                        : 'Søker etter nærmeste VIP-sjåfør i Oslo...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCancelActiveTrip(activeTrip.id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Kanseller tur
                    </button>
                    <button
                      onClick={() => handleShareTrip(activeTrip)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Del Tur</span>
                    </button>
                  </div>
                </div>

                {/* Status Pipeline Step Indicator */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] sm:text-xs font-bold">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    1. Bestilt
                  </div>
                  <div className={`p-2 rounded-lg ${
                    activeTrip.status === 'driver_assigned' || activeTrip.status === 'driver_arriving' || activeTrip.status === 'driver_arrived' || activeTrip.status === 'trip_started' || activeTrip.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-slate-500'
                  }`}>
                    2. Sjåfør på vei
                  </div>
                  <div className={`p-2 rounded-lg ${
                    activeTrip.status === 'driver_arrived' || activeTrip.status === 'trip_started' || activeTrip.status === 'active'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-white/5 text-slate-500'
                  }`}>
                    3. Ankommet
                  </div>
                  <div className={`p-2 rounded-lg ${
                    activeTrip.status === 'trip_started' || activeTrip.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-slate-500'
                  }`}>
                    4. Underveis
                  </div>
                </div>

                {/* ASSIGNED DRIVER & VEHICLE CARD */}
                {assignedDriver && (
                  <div className="bg-gradient-to-r from-black/60 to-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/25 to-black border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-black text-xl shadow-lg">
                        {assignedDriver.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white">{assignedDriver.name}</h3>
                          <span className="flex items-center gap-0.5 text-amber-400 text-xs font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {assignedDriver.rating?.toFixed(1) || '4.9'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {assignedVehicle?.model || assignedDriver.vehicleName || 'Mercedes-Benz E-Klasse VIP'} ·{' '}
                          <strong className="text-[#D4AF37] font-mono">{assignedVehicle?.licensePlate || assignedDriver.vehiclePlate || 'EL 98450'}</strong>
                        </p>
                        <p className="text-[11px] text-slate-400">Verifisert drosjeløyve: {assignedDriver.permitNumber || 'OS 10597'}</p>
                      </div>
                    </div>

                    {/* Driver Interaction Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {assignedDriver.phone && (
                        <a
                          href={`tel:${assignedDriver.phone}`}
                          className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Ring Sjåfør</span>
                        </a>
                      )}
                      <button
                        onClick={() => setShowDriverChatModal(true)}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Hurtigmelding</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Route Information */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Henteadresse</span>
                      <span className="text-xs sm:text-sm font-medium text-white">{activeTrip.pickup?.address}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Navigation className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Leveringsadresse</span>
                      <span className="text-xs sm:text-sm font-medium text-white">{activeTrip.destination?.address}</span>
                    </div>
                  </div>
                </div>

                {/* Price & ETA */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Fastpris / Taksameter</span>
                    <span className="text-xl sm:text-2xl font-black text-[#D4AF37]">{activeTrip.estimatedPrice} kr</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Est. reisetid</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-200">
                      {activeTrip.distanceKm} km · {activeTrip.durationMinutes} min
                    </span>
                  </div>
                </div>

                {/* Live Map */}
                <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                  <LeafletMap
                    interactive={true}
                    pickup={{
                      address: activeTrip.pickup.address,
                      lat: activeTrip.pickup.lat,
                      lng: activeTrip.pickup.lng
                    }}
                    destination={{
                      address: activeTrip.destination.address,
                      lat: activeTrip.destination.lat,
                      lng: activeTrip.destination.lng
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-[#0E131F] border border-white/10 rounded-3xl p-8 sm:p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#D4AF37]">
                  <Car className="w-8 h-8" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Ingen aktiv tur akkurat nå</h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Klar for neste reise? Bestill en VIP-taxi i Oslo med fastpris og hentegaranti.
                </p>
                <Link
                  to="/bestill"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#C5A028] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-[#D4AF37]/20 transition-all cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  Bestill Ny Tur Nå
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRIP HISTORY & REBOOK */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#D4AF37]" />
              <span>Fullførte Turer ({pastTrips.length})</span>
            </h2>

            {pastTrips.length === 0 ? (
              <div className="bg-[#0E131F] border border-white/10 rounded-2xl p-8 text-center text-xs text-slate-400">
                Ingen tidligere turer registrert.
              </div>
            ) : (
              pastTrips.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#0E131F] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/20 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                        Fullført
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {t.completedAt ? new Date(t.completedAt).toLocaleDateString('no-NO') : 'Nylig'}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-white">
                      {t.pickup?.address} ➔ {t.destination?.address}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Sjåfør: {t.driverName || 'Aron Sjåfør'} · {t.vehicleModel || 'VIP Taxi'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-[#D4AF37]">{t.finalPrice || t.estimatedPrice} kr</div>
                      <div className="text-[10px] text-slate-400">{t.paymentMethod?.toUpperCase() || 'KORT'}</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openReceipt(t)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold transition-all cursor-pointer"
                        title="Se kvittering"
                      >
                        <Receipt className="w-4 h-4 text-[#D4AF37]" />
                      </button>
                      <button
                        onClick={() => setRatingTrip(t)}
                        className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                        title="Gi vurdering / tips"
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </button>
                      <button
                        onClick={() => handleDeletePastTrip(t.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 text-xs font-bold transition-all cursor-pointer"
                        title="Slett fra historikk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRebookTrip(t)}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Bestill igjen
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: FAVORITE PLACES */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Mine Favorittadresser</span>
              </h2>
              <button
                onClick={() => setShowAddFav(!showAddFav)}
                className="px-3.5 py-1.5 bg-[#D4AF37] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Legg til adresse</span>
              </button>
            </div>

            {showAddFav && (
              <form onSubmit={handleSaveNewFavorite} className="bg-[#0E131F] border border-[#D4AF37]/50 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Ny favorittadresse</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Navn (f.eks. Hytte, Tannlege, Hotell)"
                    value={newFavName}
                    onChange={(e) => setNewFavName(e.target.value)}
                    className="p-2.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Full adresse i Oslo-regionen"
                    value={newFavAddress}
                    onChange={(e) => setNewFavAddress(e.target.value)}
                    className="p-2.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFav(false)}
                    className="px-3 py-1.5 bg-white/5 text-slate-300 rounded-lg text-xs"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#D4AF37] text-slate-950 font-bold rounded-lg text-xs"
                  >
                    Lagre
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {savedFavorites.map((fav) => (
                <div
                  key={fav.id}
                  className="bg-[#0E131F] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-white/20 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#D4AF37]">{fav.name}</span>
                      <button
                        onClick={() => handleDeleteFavorite(fav.id)}
                        className="text-slate-500 hover:text-rose-400 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{fav.address}</p>
                  </div>

                  <button
                    onClick={() => navigate('/bestill', { state: { toAddress: fav.address } })}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-3 h-3 text-[#D4AF37]" />
                    <span>Bestill tur hit</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: COUPONS */}
        {activeTab === 'discounts' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Aktive Rabattkoder & Kampanjer</span>
            </h2>

            <form onSubmit={handleRedeemCode} className="flex gap-2">
              <input
                type="text"
                placeholder="Skriv inn rabattkode..."
                value={redeemInput}
                onChange={(e) => setRedeemInput(e.target.value)}
                className="flex-1 p-3 bg-[#0E131F] border border-white/15 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-[#D4AF37] text-slate-950 font-black text-xs uppercase rounded-xl"
              >
                Løs inn
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coupons.map((c) => (
                <div
                  key={c.code}
                  className="bg-[#0E131F] border border-[#D4AF37]/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#D4AF37] font-mono">{c.code}</span>
                      <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-[10px] font-black">
                        {c.discountType === 'percentage' ? `${c.discountValue}% AVSLAG` : `${c.discountValue} KR AVSLAG`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{c.description}</p>
                  </div>

                  <button
                    onClick={() => handleUseCouponInBooking(c.code)}
                    className="px-3.5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-slate-950 font-black text-xs rounded-xl shrink-0"
                  >
                    Bruk
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: VIP BENEFITS */}
        {activeTab === 'vip' && (
          <div className="bg-[#0E131F] border border-white/10 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-black flex items-center justify-center text-slate-950 font-black text-xl">
                <Crown className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Aron VIP Executive Club</h2>
                <p className="text-xs text-slate-400">Eksklusive medlemsfordeler for faste reisende i Oslo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-[#D4AF37]">⚡ Prioritert Henting</span>
                <p className="text-xs text-slate-300">Dine bestillinger tildeles automatisk høyeste prioritet i flåten.</p>
              </div>
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-emerald-400">🛫 Fastpris Flyplass</span>
                <p className="text-xs text-slate-300">Garantert fastpris til Gardermoen (OSL) og Torp uten skjulte gebyrer.</p>
              </div>
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-amber-400">🧾 Månedsfaktura</span>
                <p className="text-xs text-slate-300">Samle alle reiser på én månedlig EHF/PDF-faktura for din bedrift.</p>
              </div>
            </div>
          </div>
        )}

        {/* RECEIPT VIEW MODAL / TAB */}
        {activeTab === 'receipt' && selectedTrip && (
          <div className="bg-[#0E131F] border border-white/10 rounded-3xl p-6 space-y-6 max-w-2xl mx-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Digital MVA-Kvittering</h2>
                <p className="text-xs text-slate-400 font-mono">Kvittering #{selectedTrip.id.slice(-8)}</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Skriv ut</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Dato:</span>
                <span className="font-bold text-white">
                  {selectedTrip.completedAt ? new Date(selectedTrip.completedAt).toLocaleString('no-NO') : 'Nylig'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Henteadresse:</span>
                <span className="font-bold text-white text-right max-w-xs">{selectedTrip.pickup?.address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Leveringsadresse:</span>
                <span className="font-bold text-white text-right max-w-xs">{selectedTrip.destination?.address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Sjåfør / Løyve:</span>
                <span className="font-bold text-white">{selectedTrip.driverName || 'Aron Sjåfør'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Netto (eks. MVA 12%):</span>
                <span className="font-bold text-white">
                  {Math.round((selectedTrip.finalPrice || selectedTrip.estimatedPrice) / 1.12)} kr
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">MVA (12% persontransport):</span>
                <span className="font-bold text-white">
                  {Math.round((selectedTrip.finalPrice || selectedTrip.estimatedPrice) - (selectedTrip.finalPrice || selectedTrip.estimatedPrice) / 1.12)} kr
                </span>
              </div>
              <div className="flex justify-between py-2 text-base font-black text-[#D4AF37]">
                <span>Totalsum:</span>
                <span>{selectedTrip.finalPrice || selectedTrip.estimatedPrice} kr</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('trips')}
              className="w-full py-3 bg-white/5 text-slate-300 text-xs font-bold rounded-xl"
            >
              Lukk Kvittering
            </button>
          </div>
        )}

      </main>

      {/* QUICK DRIVER CHAT MODAL */}
      {showDriverChatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131F] border border-white/15 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Send hurtigmelding til sjåfør</h3>
              <button onClick={() => setShowDriverChatModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSendDriverSms('Hei! Jeg står utenfor hovedinngangen nå.')}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 border border-white/10"
              >
                «Jeg står utenfor hovedinngangen nå»
              </button>
              <button
                onClick={() => handleSendDriverSms('Hei! Jeg har med meg 2 kofferter.')}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 border border-white/10"
              >
                «Jeg har med meg 2 kofferter»
              </button>
              <button
                onClick={() => handleSendDriverSms('Hei! Toget/flyet mitt er forsinket 5 minutter.')}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 border border-white/10"
              >
                «Toget/flyet mitt er forsinket 5 minutter»
              </button>
              <button
                onClick={() => handleSendDriverSms('Hei! Takk, jeg kommer ut nå!')}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 border border-white/10"
              >
                «Takk, jeg kommer ut nå!»
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATING & TIP MODAL */}
      {ratingTrip && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131F] border border-[#D4AF37]/50 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Hvordan var turen din?</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sjåfør: {ratingTrip.driverName || 'Aron Sjåfør'}</p>
            </div>

            {/* 5 Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRatingStars(s)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      s <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Tip Selection */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Legg til drikkepenger (valgfritt)
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 20, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTipAmount(amount)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      tipAmount === amount
                        ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] font-black'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {amount === 0 ? 'Ingen' : `${amount} kr`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setRatingTrip(null)}
                className="py-3 rounded-xl bg-white/5 text-slate-300 text-xs font-bold"
              >
                Lukk
              </button>
              <button
                onClick={handleSubmitRatingAndTip}
                className="py-3 rounded-xl bg-[#D4AF37] text-slate-950 font-black text-xs uppercase"
              >
                Send Vurdering
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
