import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LeafletMap } from '../components/LeafletMap';
import { searchAddresses, getRouteAndDistance, calculateTripPrice, GeocodeResult, RouteResult } from '../services/osrm';
import { useTrips } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { Trip, LocationPoint } from '../types';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  MapPin,
  Navigation,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Luggage,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Car,
  Star,
  DollarSign,
  HeartHandshake,
  AlertTriangle,
  AlertCircle,
  Info,
  Check
} from 'lucide-react';

export const OrderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { createTrip, pricing, addTipAndRatingToTrip, trips, drivers } = useTrips();
  const { user, loginAsGuest } = useAuth();

  const stateLocation = location.state || {};

  // Form State
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  const [fromQuery, setFromQuery] = useState(stateLocation.from || 'Karl Johans gate 1, Oslo');
  const [toQuery, setToQuery] = useState(stateLocation.to || 'Oslo Lufthavn Gardermoen');
  
  const [fromSuggestions, setFromSuggestions] = useState<GeocodeResult[]>([]);
  const [toSuggestions, setToSuggestions] = useState<GeocodeResult[]>([]);

  const [fromPoint, setFromPoint] = useState<LocationPoint>({
    address: stateLocation.from || 'Karl Johans gate 1, Oslo',
    lat: stateLocation.fromLat || 59.9127,
    lng: stateLocation.fromLng || 10.7461
  });

  const [toPoint, setToPoint] = useState<LocationPoint>({
    address: stateLocation.to || 'Oslo Lufthavn Gardermoen',
    lat: stateLocation.toLat || 60.1976,
    lng: stateLocation.toLng || 11.1004
  });

  const [viaStops, setViaStops] = useState<string>('');
  const [passengers, setPassengers] = useState<number>(1);
  const [luggage, setLuggage] = useState<number>(1);
  const [isPreorder, setIsPreorder] = useState<boolean>(false);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'vipps' | 'card' | 'apple_pay' | 'cash' | 'invoice'>('card');

  // Route & Calculations State
  const [calculating, setCalculating] = useState<boolean>(false);
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [priceDetails, setPriceDetails] = useState<any>(null);

  // Booking Result State & Live Sync
  const [bookedTrip, setBookedTrip] = useState<Trip | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Calculate live available drivers in Oslo (Online AND not currently on an active trip)
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

  // Active live trip synchronized from context or local state
  const activeBookedTrip = bookedTrip
    ? (trips.find((t) => t.id === bookedTrip.id || t.tripId === bookedTrip.id) || bookedTrip)
    : null;

  // Rating and Tip State
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  // Live Firestore trip sync when booked
  useEffect(() => {
    if (!bookedTrip?.id) return;

    const unsub = onSnapshot(
      doc(db, 'trips', bookedTrip.id),
      (snap) => {
        if (snap.exists()) {
          const updatedData = snap.data() as Trip;
          setBookedTrip(updatedData);
        }
      },
      (err) => console.log('Live trip track error note:', err.message)
    );

    return () => unsub();
  }, [bookedTrip?.id]);

  // Recalculate OSRM route whenever fromPoint or toPoint changes
  useEffect(() => {
    let active = true;
    const computeRoute = async () => {
      setCalculating(true);
      const res = await getRouteAndDistance(fromPoint.lat, fromPoint.lng, toPoint.lat, toPoint.lng);
      if (!active) return;
      
      setRouteData(res);
      const isAirport = toQuery.toLowerCase().includes('gardermoen') || fromQuery.toLowerCase().includes('gardermoen');
      const pricingCalc = calculateTripPrice(res.distanceKm, res.durationMinutes, isAirport, pricing);
      setPriceDetails(pricingCalc);
      setCalculating(false);
    };

    computeRoute();
    return () => { active = false; };
  }, [fromPoint, toPoint, pricing]);

  const handleFromSelect = (item: GeocodeResult) => {
    setFromQuery(item.address);
    setFromPoint({ address: item.address, lat: item.lat, lng: item.lng });
    setFromSuggestions([]);
  };

  const handleToSelect = (item: GeocodeResult) => {
    setToQuery(item.address);
    setToPoint({ address: item.address, lat: item.lat, lng: item.lng });
    setToSuggestions([]);
  };

  const handleFromSearch = async (val: string) => {
    setFromQuery(val);
    if (val.length >= 3) {
      const res = await searchAddresses(val);
      setFromSuggestions(res);
    } else {
      setFromSuggestions([]);
    }
  };

  const handleToSearch = async (val: string) => {
    setToQuery(val);
    if (val.length >= 3) {
      const res = await searchAddresses(val);
      setToSuggestions(res);
    } else {
      setToSuggestions([]);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceDetails || !routeData) return;

    // Check driver availability for direct bookings
    if (!isPreorder && !isDriverAvailable) {
      toast.error('Bestilling ikke mulig: Ingen sjåfør er ledig akkurat nå.', {
        description: 'Du kan bare bestille direkte når en sjåfør er på vakt og ledig. Velg forhåndsbestilling for et senere tidspunkt, eller prøv igjen når en bil er ledig.'
      });
      return;
    }

    setSubmitting(true);

    // Save guest profile if not logged in
    if (!user) {
      loginAsGuest(customerName || 'Gjestekunde', customerPhone, customerEmail);
    }

    const created = await createTrip({
      customerName: customerName || 'Gjestekunde',
      customerPhone: customerPhone || '+47 900 00 000',
      customerEmail: customerEmail || 'gjest@arontaxi.no',
      pickup: fromPoint,
      destination: toPoint,
      viaStops: viaStops ? [viaStops] : [],
      passengers,
      luggage,
      isPreorder,
      scheduledTime: isPreorder ? scheduledTime : '',
      notes: notes || '',
      distanceKm: routeData.distanceKm,
      durationMinutes: routeData.durationMinutes,
      routeGeometry: routeData.geometry || '',
      estimatedPrice: priceDetails.totalPrice,
      ratePerKm: priceDetails.ratePerKm,
      startFee: priceDetails.startFee,
      airportFee: priceDetails.airportFee,
      commissionAron: priceDetails.commissionAron,
      driverPayout: priceDetails.driverPayout,
      paymentMethod,
      paymentStatus: 'pending'
    });

    setBookedTrip(created);
    setSubmitting(false);
  };

  const handleSendRatingAndTip = async () => {
    if (!activeBookedTrip) return;
    const finalTip = customTip ? parseFloat(customTip) || 0 : selectedTip;
    await addTipAndRatingToTrip(activeBookedTrip.id, selectedRating, finalTip, reviewComment);
    setRatingSubmitted(true);
    toast.success('Takk for din vurdering og tips!');
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        
        {/* IF BOOKING CONFIRMED - LIVE TRACKING */}
        {activeBookedTrip ? (
          <div className="max-w-3xl mx-auto bg-[#121722]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
            
            {/* TOP HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#D4AF37]/15 border border-[#D4AF37]/40 rounded-full flex items-center justify-center text-[#D4AF37]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase block">
                    LIVE TAXISPORING
                  </span>
                  <h1 className="font-display text-2xl font-bold text-[#F5F2ED]">
                    {activeBookedTrip.status === 'searching_driver' && 'Søker ledig sjåfør...'}
                    {activeBookedTrip.status === 'pending' && 'Søker ledig sjåfør...'}
                    {activeBookedTrip.status === 'requested' && 'Søker ledig sjåfør...'}
                    {activeBookedTrip.status === 'driver_assigned' && 'Sjåfør er på vei!'}
                    {activeBookedTrip.status === 'driver_arrived' && 'Sjåføren har ankommet!'}
                    {activeBookedTrip.status === 'trip_started' && 'Tur pågår...'}
                    {activeBookedTrip.status === 'completed' && 'Turen er fullført!'}
                  </h1>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-mono">Tur-ID: {activeBookedTrip.id}</span>
                <span className="text-sm font-extrabold text-[#D4AF37]">{activeBookedTrip.estimatedPrice} NOK</span>
              </div>
            </div>

            {/* LIVE MAP TRACKER WITH MOVING DRIVER LOCATION */}
            <div className="space-y-2 text-left">
              <LeafletMap
                pickup={activeBookedTrip.pickup}
                destination={activeBookedTrip.destination}
                driverLocation={activeBookedTrip.driverLocation}
                routeGeometry={activeBookedTrip.routeGeometry}
                centerLat={activeBookedTrip.driverLocation?.lat || activeBookedTrip.pickup.lat}
                centerLng={activeBookedTrip.driverLocation?.lng || activeBookedTrip.pickup.lng}
                zoom={14}
              />
            </div>

            {/* ASSIGNED DRIVER & VEHICLE CARD */}
            {activeBookedTrip.driverName && (
              <div className="bg-[#0D121D] p-5 rounded-2xl border border-[#D4AF37]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-[#D4AF37]">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F2ED]">{activeBookedTrip.driverName}</h3>
                    <p className="text-xs text-slate-300">{activeBookedTrip.vehicleModel || 'Tesla Model Y'}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#D4AF37] font-mono">
                      <span>Bilnr: {activeBookedTrip.vehicleLicensePlate || 'EP 17891'}</span>
                      <span>·</span>
                      <span>Løyve: {activeBookedTrip.permitNumber || 'OS 10597'}</span>
                    </div>
                  </div>
                </div>

                {activeBookedTrip.driverPhone && (
                  <a
                    href={`tel:${activeBookedTrip.driverPhone}`}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Ring Sjåfør
                  </a>
                )}
              </div>
            )}

            {/* POST-TRIP RATING & TIPPING SECTION (WHEN COMPLETED) */}
            {activeBookedTrip.status === 'completed' && !ratingSubmitted && (
              <div className="bg-[#0D121D] p-6 rounded-3xl border border-[#D4AF37] space-y-5 animate-slide-up text-center">
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto text-[#D4AF37]">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#F5F2ED]">
                    Hvordan var turen din?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gi sjåføren en vurdering og eventuelle drikkepenger
                  </p>
                </div>

                {/* 5-STAR RATING SELECTOR */}
                <div className="flex justify-center items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className="p-1.5 transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= selectedRating
                            ? 'text-[#D4AF37] fill-[#D4AF37]'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* TIP PILLS */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Gi Drikkepenger (100% til sjåføren)
                  </label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[0, 20, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setSelectedTip(amount);
                          setCustomTip('');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          selectedTip === amount && !customTip
                            ? 'bg-[#D4AF37] text-slate-950 shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        {amount === 0 ? 'Ingen tips' : `+${amount} NOK`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSendRatingAndTip}
                  className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] text-slate-950 font-extrabold uppercase text-xs rounded-full shadow-lg"
                >
                  Send Vurdering & Fullfør
                </button>
              </div>
            )}

            {ratingSubmitted && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-xs text-emerald-300 font-semibold">
                Tusen takk! Din vurdering og tips er registrert hos sjåføren.
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => navigate('/konto')}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-200 font-bold uppercase text-xs rounded-full border border-white/10 transition-all"
              >
                Gå til Mine Turer
              </button>
              <button
                onClick={() => setBookedTrip(null)}
                className="flex-1 py-3 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] text-slate-950 font-extrabold uppercase text-xs rounded-full shadow-lg"
              >
                Bestill Ny Tur
              </button>
            </div>

          </div>
        ) : (
          /* MAIN FORM LAYOUT */
          <div className="space-y-8">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
                ARON TAXI NORWAY
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F2ED]">
                Bestill din taxi
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
                Ingen innlogging er påkrevd. Fyll inn henteadresse og destinasjon for å se fastpris og avstand.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT FORM (7 COLS) */}
              <form onSubmit={handleBookingSubmit} className="lg:col-span-7 bg-[#121722]/90 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
                
                {/* DRIVER AVAILABILITY LIVE STATUS CARD */}
                {isDriverAvailable ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="font-bold text-emerald-300">
                            {availableDrivers.length} sjåfør{availableDrivers.length > 1 ? 'er' : ''} ledig i Oslo nå
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">Klar for direkte henting og rask ankomst.</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40 hidden sm:inline-block">
                      Aktiv Sentral
                    </span>
                  </div>
                ) : (
                  <div className="bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-rose-200">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-rose-100 text-sm flex items-center gap-2">
                          Ingen ledige sjåfører akkurat nå
                        </h4>
                        <span className="text-[10px] uppercase font-bold bg-rose-500/25 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40">
                          Direkte tur utilgjengelig
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        Alle våre sjåfører er for øyeblikket opptatt med andre oppdrag eller utenfor vakt. Du kan bare bestille direkte når en sjåfør er pålogget og ledig.
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPreorder(true)}
                          className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#E5C158] text-slate-950 font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Bytt til Forhåndsbestilling
                        </button>
                        <span className="text-[10px] text-slate-400">
                          (Reserver bil for senere tidspunkt)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CONTACT INFO (GUEST OR LOGGED IN) */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold tracking-wider text-[#D4AF37] uppercase flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Kontaktinformasjon
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Navn</label>
                      <input
                        type="text"
                        required
                        placeholder="Ola Nordmann"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Telefon</label>
                      <input
                        type="tel"
                        required
                        placeholder="+47 900 00 000"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">E-post</label>
                      <input
                        type="email"
                        required
                        placeholder="ola@epost.no"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                {/* LOCATIONS */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-xs font-bold tracking-wider text-[#D4AF37] uppercase flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Hente- og Leveringssted
                  </h3>

                  {/* FROM */}
                  <div className="relative">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">FRA (HENTESTED)</label>
                    <div className="relative flex items-center">
                      <MapPin className="w-4 h-4 text-[#D4AF37] absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={fromQuery}
                        onChange={(e) => handleFromSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    {fromSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#131926] border border-white/10 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                        {fromSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleFromSelect(item)}
                            className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-white/10 border-b border-white/5 last:border-0 truncate"
                          >
                            {item.address}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TO */}
                  <div className="relative">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">TIL (DESTINASJON)</label>
                    <div className="relative flex items-center">
                      <Navigation className="w-4 h-4 text-emerald-400 absolute left-3 pointer-events-none rotate-45" />
                      <input
                        type="text"
                        required
                        value={toQuery}
                        onChange={(e) => handleToSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    {toSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#131926] border border-white/10 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                        {toSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleToSelect(item)}
                            className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-white/10 border-b border-white/5 last:border-0 truncate"
                          >
                            {item.address}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* OPTIONAL STOPS */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Eventuelle stopp underveis (Valgfritt)</label>
                    <input
                      type="text"
                      placeholder="Eks. Stopp innom Majorstuen T-bane"
                      value={viaStops}
                      onChange={(e) => setViaStops(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* TRIP OPTIONS */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-xs font-bold tracking-wider text-[#D4AF37] uppercase flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Detaljer & Tidspunkt
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Passasjerer</label>
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37]"
                      >
                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Passasjer{n > 1 ? 'er' : ''}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Bagasje</label>
                      <select
                        value={luggage}
                        onChange={(e) => setLuggage(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37]"
                      >
                        {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Koffert{n !== 1 ? 'er' : ''}</option>)}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase">Bestill for</label>
                        {!isDriverAvailable && (
                          <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Direkte tur utilgjengelig
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPreorder(false)}
                          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                            !isPreorder
                              ? isDriverAvailable
                                ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-md'
                                : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                              : 'bg-[#0D121D] text-slate-300 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          NÅ DIREKTE {isDriverAvailable ? '(Ledig bil)' : '(Ingen bil)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPreorder(true)}
                          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                            isPreorder
                              ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-md'
                              : 'bg-[#0D121D] text-slate-300 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          FORHÅNDSBESTILLING
                        </button>
                      </div>
                    </div>
                  </div>

                  {isPreorder && (
                    <div className="pt-2 bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-2">
                      <label className="block text-[11px] font-bold text-[#D4AF37] uppercase">Dato og tidspunkt for henting *</label>
                      <input
                        type="datetime-local"
                        required={isPreorder}
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37]"
                      />
                      <p className="text-[10px] text-slate-400">
                        Vi reserverer og tildeler en ledig bil til det valgte tidspunktet.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Kommentar til sjåfør (Valgfritt)</label>
                    <textarea
                      rows={2}
                      placeholder="F.eks. spesielle behov, ekstra stor koffert eller møtested ved utgangen"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* PAYMENT METHOD */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                    Betalingsmåte
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'card', name: 'Bankkort' },
                      { id: 'vipps', name: 'Vipps' },
                      { id: 'apple_pay', name: 'Apple Pay' },
                      { id: 'cash', name: 'Kontant' }
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`py-2.5 px-3 rounded-xl border text-center font-bold uppercase transition-all ${
                          paymentMethod === pm.id
                            ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]'
                            : 'bg-[#0D121D] text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {pm.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SUBMIT BUTTON WITH DRIVER AVAILABILITY CHECK */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || calculating || (!isPreorder && !isDriverAvailable)}
                    className={`w-full py-4 rounded-full font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      !isPreorder && !isDriverAvailable
                        ? 'bg-[#151c28] text-slate-400 border border-white/10 cursor-not-allowed opacity-85'
                        : 'bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 shadow-xl shadow-[#D4AF37]/20 cursor-pointer'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sender bestilling...
                      </>
                    ) : !isPreorder && !isDriverAvailable ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        Ingen sjåfør ledig – Kan ikke bestille direkte nå
                      </>
                    ) : isPreorder ? (
                      <>
                        Bekreft forhåndsbestilling ({priceDetails ? `${priceDetails.totalPrice} NOK` : 'Beregner...'})
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Bekreft og bestill taxi nå ({priceDetails ? `${priceDetails.totalPrice} NOK` : 'Beregner...'})
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {!isPreorder && !isDriverAvailable && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center text-xs text-rose-300">
                      Direkte bestilling er midlertidig stengt fordi ingen sjåfør er ledig. Klikk på <b>«FORHÅNDSBESTILLING»</b> ovenfor for å bestille for senere, eller vent til en bil logger på.
                    </div>
                  )}
                </div>

              </form>

              {/* RIGHT SIDE MAP & PRICING BREAKDOWN (5 COLS) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* LEAFLET MAP PREVIEW */}
                <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-4 shadow-xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="font-bold text-slate-200 uppercase tracking-wider">Kartvisning over Ruten</span>
                    <span>OSRM Veiberegning</span>
                  </div>
                  
                  <LeafletMap
                    pickup={fromPoint}
                    destination={toPoint}
                    routeGeometry={routeData?.geometry}
                  />
                </div>

                {/* PRICING BREAKDOWN CARD */}
                <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-xs font-bold tracking-wider text-[#D4AF37] uppercase">
                    Prisberegning & Avstand
                  </h3>

                  {calculating ? (
                    <div className="flex items-center gap-3 text-xs text-slate-400 py-6 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                      <span>Beregner rute via OSRM...</span>
                    </div>
                  ) : priceDetails && routeData ? (
                    <div className="space-y-3 text-xs">
                      
                      <div className="flex justify-between items-center py-1.5 border-b border-white/10 text-slate-300">
                        <span>Faktisk kjøreavstand:</span>
                        <span className="font-mono font-bold text-[#F5F2ED]">{routeData.distanceKm} km</span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-white/10 text-slate-300">
                        <span>Estimert kjøretid:</span>
                        <span className="font-mono font-bold text-[#F5F2ED]">{routeData.durationMinutes} min</span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-white/10 text-slate-300">
                        <span>Kilometersats ({priceDetails.isNight ? 'Kveld 20 NOK/km' : 'Dag 18 NOK/km'}):</span>
                        <span className="font-mono text-[#F5F2ED]">{priceDetails.distanceCost} NOK</span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-white/10 text-slate-300">
                        <span>Startpris / Oppstartsgebyr:</span>
                        <span className="font-mono text-[#F5F2ED]">{priceDetails.startFee} NOK</span>
                      </div>

                      {priceDetails.airportFee > 0 && (
                        <div className="flex justify-between items-center py-1.5 border-b border-white/10 text-slate-300">
                          <span>Flyplasstillegg:</span>
                          <span className="font-mono text-[#F5F2ED]">{priceDetails.airportFee} NOK</span>
                        </div>
                      )}

                      <div className="pt-3 flex justify-between items-center border-t border-white/10">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400 font-bold">Fastpris før avreise</span>
                          <span className="text-xl font-bold font-display text-[#D4AF37]">{priceDetails.totalPrice} NOK</span>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                          Inkl. 12% MVA
                        </span>
                      </div>

                    </div>
                  ) : null}

                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};
