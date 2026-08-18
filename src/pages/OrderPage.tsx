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
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { validateAndCalculateDiscount, getStoredCoupons } from '../services/couponService';
import {
  createStripeCheckoutSession,
  verifyStripeSession,
  checkStripeStatus,
  StripeConfigStatus
} from '../services/stripeClient';
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
  Check,
  Sparkles,
  Tag,
  Percent,
  VolumeX,
  Thermometer,
  Plane,
  Baby,
  Dog,
  ChevronDown,
  ChevronUp,
  Gift,
  Shield,
  Crown,
  CreditCard,
  Lock,
  ExternalLink,
  Receipt
} from 'lucide-react';

export type VehicleTier = 'vip_black' | 'comfort_eco' | 'airport_vip';

interface TierOption {
  id: VehicleTier;
  name: string;
  subtitle: string;
  description: string;
  multiplier: number;
  seats: number;
  luggageCap: number;
  badge: string;
  popular?: boolean;
  carModel: string;
}

const VEHICLE_TIERS: TierOption[] = [
  {
    id: 'vip_black',
    name: 'Aron Black VIP Executive',
    subtitle: 'Luksusklasse & Privatsjåfør',
    description: 'Mercedes-Benz EQE Sedan / Tesla Model Y Juniper med dresskledd privatsjåfør, stillegående komfort, mineralvann og mobilladere.',
    multiplier: 1.25,
    seats: 4,
    luggageCap: 3,
    badge: 'Mest Populær VIP',
    popular: true,
    carModel: 'Mercedes-Benz EQE / Tesla Model Y'
  },
  {
    id: 'comfort_eco',
    name: 'Aron Comfort Electric',
    subtitle: 'Miljøvennlig & Stillegående',
    description: '100% utslippsfri Tesla Model Y Juniper med god plass til passasjerer og bagasje, rask respons i hele Oslo.',
    multiplier: 1.0,
    seats: 4,
    luggageCap: 2,
    badge: 'Standard Miljøtakst',
    carModel: 'Tesla Model Y Juniper'
  },
  {
    id: 'airport_vip',
    name: 'Aron Airport VIP Express',
    subtitle: 'Gardermoen Meet & Greet',
    description: 'Dedikert flyplasstransport med Mercedes-Benz EQE eller Tesla Model Y Juniper, flysporing og personlig velkomst.',
    multiplier: 1.30,
    seats: 4,
    luggageCap: 4,
    badge: 'Flyplass VIP',
    carModel: 'Mercedes-Benz EQE Sedan'
  }
];

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
  const [paymentMethod, setPaymentMethod] = useState<'vipps' | 'card' | 'apple_pay' | 'cash' | 'invoice' | 'stripe'>('card');

  // Stripe Payment & Verification State
  const [verifyingPayment, setVerifyingPayment] = useState<boolean>(false);
  const [stripeStatus, setStripeStatus] = useState<StripeConfigStatus | null>(null);
  const [paymentBanner, setPaymentBanner] = useState<{
    type: 'success' | 'cancelled' | 'error';
    title: string;
    message: string;
    sessionId?: string;
    paymentIntentId?: string;
    amount?: number;
  } | null>(null);

  // Luxury Vehicle Class Tier
  const [selectedTier, setSelectedTier] = useState<VehicleTier>('vip_black');

  // Luxury Ride Preferences
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [quietRide, setQuietRide] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<'normal' | 'cool' | 'warm'>('normal');
  const [luggageHelp, setLuggageHelp] = useState<boolean>(true);
  const [childSeat, setChildSeat] = useState<boolean>(false);
  const [petFriendly, setPetFriendly] = useState<boolean>(false);
  const [flightNumber, setFlightNumber] = useState<string>('');

  // Discount & Coupon Code State
  const [couponCodeInput, setCouponCodeInput] = useState<string>(stateLocation.couponCode || '');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountDescription: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string>('');

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

  // Check Stripe Configuration on backend
  useEffect(() => {
    checkStripeStatus().then(setStripeStatus).catch(() => {});
  }, []);

  // Handle Return from Stripe Checkout (success_url / cancel_url)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    const paymentStatusParam = params.get('payment_status');
    const tripIdParam = params.get('trip_id');

    if (paymentStatusParam === 'success' && sessionId) {
      setVerifyingPayment(true);
      verifyStripeSession(sessionId, tripIdParam || undefined).then(async (res) => {
        setVerifyingPayment(false);
        if (res.isPaid) {
          setPaymentBanner({
            type: 'success',
            title: 'Stripe Betaling Bekreftet!',
            message: `Takk for din bestilling. Beløpet på ${res.amountTotal || 'avtalt fastpris'} NOK er autorisert og kvittering er sendt til din e-post. Nærmeste ledige sjåfør sendes nå.`,
            sessionId: sessionId,
            paymentIntentId: res.paymentIntentId,
            amount: res.amountTotal
          });
          toast.success('✅ Betaling bekreftet via Stripe Checkout!');
          
          if (tripIdParam) {
            const found = trips.find(t => t.id === tripIdParam || t.tripId === tripIdParam);
            if (found) {
              setBookedTrip({ ...found, paymentStatus: 'paid', stripeSessionId: sessionId, paymentIntentId: res.paymentIntentId });
            } else {
              try {
                const snap = await getDoc(doc(db, 'trips', tripIdParam));
                if (snap.exists()) {
                  setBookedTrip(snap.data() as Trip);
                }
              } catch (e) {}
            }
          }
        } else {
          setPaymentBanner({
            type: 'error',
            title: 'Betalingsstatus Venter',
            message: res.message || 'Betalingen behandles eller venter på endelig godkjenning fra banken.',
            sessionId
          });
        }
      }).catch((err) => {
        setVerifyingPayment(false);
        console.error(err);
      });
    } else if (paymentStatusParam === 'cancelled') {
      setPaymentBanner({
        type: 'cancelled',
        title: 'Stripe Betaling Ble Avbrutt',
        message: 'Betalingsøkten ble avbrutt. Ingen penger er trukket fra kortet ditt. Du kan fullføre bestillingen på nytt nedenfor.'
      });
      toast.error('Stripe-betalingen ble avbrutt.');
    }
  }, [location.search]);

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
      const isAirport =
        toQuery.toLowerCase().includes('gardermoen') ||
        fromQuery.toLowerCase().includes('gardermoen') ||
        toQuery.toLowerCase().includes('torp') ||
        fromQuery.toLowerCase().includes('torp') ||
        toQuery.toLowerCase().includes('flyplass') ||
        fromQuery.toLowerCase().includes('flyplass') ||
        toPoint.address.toLowerCase().includes('gardermoen') ||
        fromPoint.address.toLowerCase().includes('gardermoen') ||
        selectedTier === 'airport_vip';

      const pricingCalc = calculateTripPrice(res.distanceKm, res.durationMinutes, isAirport, pricing);
      setPriceDetails(pricingCalc);
      setCalculating(false);
    };

    computeRoute();
    return () => { active = false; };
  }, [fromPoint, toPoint, pricing, toQuery, fromQuery, selectedTier]);

  // Auto apply coupon if provided via navigation state
  useEffect(() => {
    if (stateLocation.couponCode && priceDetails?.totalPrice) {
      const activeTierObj = VEHICLE_TIERS.find(t => t.id === selectedTier) || VEHICLE_TIERS[0];
      const tierGrossPrice = Math.round(priceDetails.totalPrice * activeTierObj.multiplier);
      const res = validateAndCalculateDiscount(stateLocation.couponCode, tierGrossPrice);
      if (res.valid) {
        setAppliedCoupon({
          code: stateLocation.couponCode.toUpperCase(),
          discountAmount: res.discountAmount,
          discountDescription: res.discountDescription
        });
        toast.success(`Rabattkode ${stateLocation.couponCode.toUpperCase()} aktivert!`);
      }
    }
  }, [stateLocation.couponCode, priceDetails?.totalPrice, selectedTier]);

  const handleApplyCoupon = (codeToApply?: string) => {
    setCouponError('');
    const targetCode = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!targetCode) {
      setCouponError('Vennligst skriv inn en rabattkode.');
      return;
    }

    if (!priceDetails?.totalPrice) {
      setCouponError('Beregner rute... Vennligst prøv igjen om et øyeblikk.');
      return;
    }

    const activeTierObj = VEHICLE_TIERS.find(t => t.id === selectedTier) || VEHICLE_TIERS[0];
    const tierGrossPrice = Math.round(priceDetails.totalPrice * activeTierObj.multiplier);

    const res = validateAndCalculateDiscount(targetCode, tierGrossPrice);
    if (res.valid) {
      setAppliedCoupon({
        code: targetCode,
        discountAmount: res.discountAmount,
        discountDescription: res.discountDescription
      });
      setCouponCodeInput(targetCode);
      toast.success(`Rabattkode «${targetCode}» er aktivert! ${res.discountDescription}`);
    } else {
      setCouponError(res.errorMessage || 'Ugyldig rabattkode.');
      toast.error(res.errorMessage || 'Ugyldig rabattkode.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
    toast.info('Rabattkode fjernet.');
  };

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

  // Pricing calculations with Tier and Coupon
  const currentTierObj = VEHICLE_TIERS.find(t => t.id === selectedTier) || VEHICLE_TIERS[0];
  const baseGrossPrice = priceDetails ? Math.round(priceDetails.totalPrice * currentTierObj.multiplier) : 0;
  const discountAmount = appliedCoupon ? Math.min(baseGrossPrice, appliedCoupon.discountAmount) : 0;
  const finalPayablePrice = Math.max(0, baseGrossPrice - discountAmount);

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

    const isStripeMethod = paymentMethod === 'card' || (paymentMethod as string) === 'stripe';
    const initialPaymentStatus = isStripeMethod ? 'pending_payment' : 'pending';

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
      routeGeometry: routeData.geometry || undefined,
      estimatedPrice: finalPayablePrice,
      originalPrice: baseGrossPrice,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      couponCode: appliedCoupon?.code || undefined,
      vehicleCategory: selectedTier,
      ridePreferences: {
        quietRide,
        temperature,
        luggageHelp,
        childSeat,
        petFriendly
      },
      flightNumber: flightNumber || undefined,
      ratePerKm: priceDetails.ratePerKm,
      startFee: priceDetails.startFee,
      airportFee: priceDetails.airportFee,
      commissionAron: priceDetails.commissionAron,
      driverPayout: priceDetails.driverPayout,
      paymentMethod: isStripeMethod ? 'card' : paymentMethod,
      paymentStatus: initialPaymentStatus
    }, stateLocation.existingTripId);

    if (isStripeMethod) {
      toast.info('Oppretter sikker Stripe Checkout-økt...');
      const sessionRes = await createStripeCheckoutSession({
        tripId: created.id,
        amount: finalPayablePrice,
        pickupAddress: fromPoint.address,
        destinationAddress: toPoint.address,
        customerName: customerName || 'Gjestekunde',
        customerEmail: customerEmail || 'gjest@arontaxi.no',
        customerPhone: customerPhone || '+47 900 00 000',
        vehicleTier: selectedTier,
        distanceKm: routeData.distanceKm,
        durationMinutes: routeData.durationMinutes,
        passengers,
        couponCode: appliedCoupon?.code
      });

      if (sessionRes.success && sessionRes.url) {
        toast.success('Videresender til Stripe Checkout...');
        // Official Stripe Checkout redirect
        window.location.href = sessionRes.url;
        return;
      } else {
        // Handle Stripe configuration or runtime errors gracefully
        console.warn('Stripe checkout error:', sessionRes.message);
        if (sessionRes.error === 'STRIPE_NOT_CONFIGURED') {
          toast.info('Bestillingen er bekreftet og sendt til sjåfør! Du kan betale med kort/Vipps direkte i bilen.');
          setBookedTrip(created);
        } else {
          toast.info('Bestilling bekreftet! Sjåfør er varslet.');
          setBookedTrip(created);
        }
        setSubmitting(false);
      }
    } else {
      setBookedTrip(created);
      toast.success('🎉 Bestillingen er bekreftet! Nærmeste sjåfør varsles nå.');
      setSubmitting(false);
    }
  };

  const handleSendRatingAndTip = async () => {
    if (!activeBookedTrip) return;
    const finalTip = customTip ? parseFloat(customTip) || 0 : selectedTip;
    await addTipAndRatingToTrip(activeBookedTrip.id, selectedRating, finalTip, reviewComment);
    setRatingSubmitted(true);
    toast.success('Takk for din vurdering og tips!');
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* PAYMENT VERIFYING OVERLAY BANNER */}
        {verifyingPayment && (
          <div className="bg-[#0F1420] border border-[#D4AF37]/50 rounded-2xl p-4 flex items-center justify-between shadow-2xl backdrop-blur-xl animate-pulse">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Verifiserer betaling med Stripe...</h4>
                <p className="text-[11px] text-slate-400">Bekrefter autorisasjon og klargjør sjåførutsending.</p>
              </div>
            </div>
            <span className="text-xs font-mono text-[#D4AF37] font-bold">Stripe Checkout</span>
          </div>
        )}

        {/* PAYMENT STATUS BANNER (SUCCESS / CANCELLED / ERROR) */}
        {paymentBanner && !verifyingPayment && (
          <div
            className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xl backdrop-blur-xl ${
              paymentBanner.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                : paymentBanner.type === 'cancelled'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-100'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentBanner.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : paymentBanner.type === 'cancelled'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {paymentBanner.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : paymentBanner.type === 'cancelled' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">{paymentBanner.title}</h3>
                  {paymentBanner.sessionId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 opacity-80">
                      ID: {paymentBanner.sessionId.slice(0, 16)}...
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90 leading-relaxed max-w-2xl">{paymentBanner.message}</p>
                {paymentBanner.paymentIntentId && (
                  <p className="text-[10px] font-mono opacity-75">
                    Stripe Ref (Payment Intent): {paymentBanner.paymentIntentId}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setPaymentBanner(null)}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 self-end sm:self-center"
            >
              Lukk
            </button>
          </div>
        )}
        
        {/* IF BOOKING CONFIRMED - LIVE TRACKING */}
        {activeBookedTrip ? (
          <div className="max-w-3xl mx-auto bg-[#0F1420]/95 border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
            
            {/* TOP HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#D4AF37]/20 border border-[#D4AF37]/50 rounded-2xl flex items-center justify-center text-[#D4AF37]">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    ARON BLACK VIP · LIVE SPORING
                  </span>
                  <h1 className="font-display text-2xl font-bold text-white">
                    {activeBookedTrip.status === 'searching_driver' && 'Søker nærmeste VIP-sjåfør...'}
                    {activeBookedTrip.status === 'pending' && 'Søker ledig sjåfør...'}
                    {activeBookedTrip.status === 'requested' && 'Søker ledig sjåfør...'}
                    {activeBookedTrip.status === 'driver_assigned' && 'Privatsjåfør er på vei!'}
                    {activeBookedTrip.status === 'driver_arrived' && 'Sjåføren venter utenfor!'}
                    {activeBookedTrip.status === 'trip_started' && 'Eksklusiv tur pågår...'}
                    {activeBookedTrip.status === 'completed' && 'Turen er fullført!'}
                  </h1>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-mono">Tur-ID: {activeBookedTrip.id}</span>
                <span className="text-base font-black text-[#D4AF37] font-mono">{activeBookedTrip.estimatedPrice} NOK</span>
                {activeBookedTrip.couponCode && (
                  <span className="text-[10px] text-emerald-400 font-bold block">Rabatt {activeBookedTrip.couponCode} brukt</span>
                )}
              </div>
            </div>

            {/* STRIPE PAYMENT RECEIPT & STATUS BADGE */}
            {activeBookedTrip.paymentStatus === 'paid' ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-300 uppercase">Betaling Fullført · Stripe</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                        3D Secure
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Fastpris {activeBookedTrip.estimatedPrice} NOK er betalt. Kvittering sendt til {activeBookedTrip.customerEmail || 'e-post'}.
                    </p>
                    {activeBookedTrip.paymentIntentId && (
                      <span className="text-[10px] font-mono text-emerald-400/80 block mt-0.5">
                        Transaksjons-ID: {activeBookedTrip.paymentIntentId}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-right">
                  <span className="text-[9px] uppercase font-bold text-emerald-300 block">Status</span>
                  <span className="text-xs font-black text-emerald-200">BETALT MED KORT</span>
                </div>
              </div>
            ) : activeBookedTrip.paymentStatus === 'pending_payment' ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                  <div>
                    <span className="font-bold text-amber-300 block">Venter på Stripe-betaling</span>
                    <span className="text-[11px] text-slate-400">Fullfør betalingen for å bekrefte bestillingen.</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-400">{activeBookedTrip.estimatedPrice} NOK</span>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex justify-between items-center text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span>Betalingsmåte: <strong className="text-white capitalize">{activeBookedTrip.paymentMethod === 'card' ? 'Bankkort / Stripe' : activeBookedTrip.paymentMethod}</strong></span>
                </div>
                <span className="font-mono font-bold text-[#D4AF37]">{activeBookedTrip.estimatedPrice} NOK</span>
              </div>
            )}

            {/* LIVE MAP TRACKER WITH MOVING DRIVER LOCATION */}
            <div className="space-y-2 text-left">
              <LeafletMap
                pickup={activeBookedTrip.pickup}
                destination={activeBookedTrip.destination}
                driverLocation={activeBookedTrip.driverLocation}
                routeGeometry={activeBookedTrip.routeGeometry}
                centerLat={activeBookedTrip.driverLocation?.lat || activeBookedTrip.pickup?.lat || 59.9139}
                centerLng={activeBookedTrip.driverLocation?.lng || activeBookedTrip.pickup?.lng || 10.7522}
                zoom={14}
              />
            </div>

            {/* ASSIGNED DRIVER & VEHICLE CARD */}
            {activeBookedTrip.driverName && (
              <div className="bg-[#090D16] p-5 rounded-2xl border border-[#D4AF37]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37]/30 to-black border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white">{activeBookedTrip.driverName}</h3>
                      <span className="px-2 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black rounded-full uppercase">
                        Sertifisert Aron VIP
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{activeBookedTrip.vehicleModel || 'Tesla Model Y Juniper'}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#D4AF37] font-mono">
                      <span>Bilskilt: {activeBookedTrip.vehicleLicensePlate || 'EK 88201'}</span>
                      <span>·</span>
                      <span>Drosjeløyve: {activeBookedTrip.permitNumber || 'OS 10597'}</span>
                    </div>
                  </div>
                </div>

                {activeBookedTrip.driverPhone && (
                  <a
                    href={`tel:${activeBookedTrip.driverPhone}`}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 hover:brightness-110 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    Ring Sjåfør
                  </a>
                )}
              </div>
            )}

            {/* POST-TRIP RATING & TIPPING SECTION (WHEN COMPLETED) */}
            {activeBookedTrip.status === 'completed' && !ratingSubmitted && (
              <div className="bg-[#090D16] p-6 rounded-3xl border border-[#D4AF37] space-y-5 animate-slide-up text-center shadow-2xl">
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto text-[#D4AF37]">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Hvordan var VIP-opplevelsen din?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gi sjåføren din stjernevurdering og eventuelle drikkepenger (100% utbetales til sjåfør).
                  </p>
                </div>

                {/* 5-STAR RATING SELECTOR */}
                <div className="flex justify-center items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className="p-1.5 transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= selectedRating
                            ? 'text-[#D4AF37] fill-[#D4AF37]'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* TIP PILLS */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Gi Drikkepenger
                  </label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[0, 20, 50, 100, 200].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setSelectedTip(amount);
                          setCustomTip('');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedTip === amount && !customTip
                            ? 'bg-[#D4AF37] text-slate-950 font-black shadow-md'
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
                  className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg cursor-pointer hover:brightness-110"
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
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-200 font-bold uppercase text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                Gå til Mine Turer & Kvittering
              </button>
              <button
                onClick={() => setBookedTrip(null)}
                className="flex-1 py-3 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg cursor-pointer hover:brightness-110"
              >
                Bestill Ny VIP Tur
              </button>
            </div>

          </div>
        ) : (
          /* MAIN CLASSIC LUXURY BOOKING LAYOUT */
          <div className="space-y-8">
            
            {/* CLASSIC HERO TITLE */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    ARON TAXI NORWAY
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Oslo · Gardermoen · Viken</span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Bestill Drosje & Privatsjåfør
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light max-w-xl">
                  Garantert fastpris, profesjonelle privatsjåfører, 100% utslippsfri elbilflåte og førsteklasses service.
                </p>
              </div>

              {/* LIVE DRIVER STATUS */}
              <div className="bg-[#0E131F] border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute inset-0" />
                </div>
                <div className="text-left text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sjåførstatus i Oslo</span>
                  <span className="font-bold text-white">
                    {isDriverAvailable ? 'Ledige biler i nærområdet' : 'Forhåndsbestilling aktiv'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT FORM (7 COLS) */}
              <form onSubmit={handleBookingSubmit} className="lg:col-span-7 bg-[#0E131F]/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
                
                {/* 1. LOCATIONS (PICKUP & DESTINATION) */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black tracking-wider text-[#D4AF37] uppercase flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    1. Hente- og Leveringsadresse
                  </h3>

                  {/* FROM */}
                  <div className="relative">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Fra (Hentested) *</label>
                    <div className="relative flex items-center">
                      <MapPin className="w-4 h-4 text-[#D4AF37] absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={fromQuery}
                        onChange={(e) => handleFromSearch(e.target.value)}
                        placeholder="Hvor skal du hentes?"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    {fromSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#131926] border border-white/10 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                        {fromSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleFromSelect(item)}
                            className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-white/10 border-b border-white/5 last:border-0 truncate cursor-pointer"
                          >
                            {item.address}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TO */}
                  <div className="relative">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Til (Destinasjon) *</label>
                    <div className="relative flex items-center">
                      <Navigation className="w-4 h-4 text-emerald-400 absolute left-3 pointer-events-none rotate-45" />
                      <input
                        type="text"
                        required
                        value={toQuery}
                        onChange={(e) => handleToSearch(e.target.value)}
                        placeholder="Hvor skal du reise?"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    {toSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#131926] border border-white/10 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                        {toSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleToSelect(item)}
                            className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-white/10 border-b border-white/5 last:border-0 truncate cursor-pointer"
                          >
                            {item.address}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* OPTIONAL STOPS */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Stopp underveis (Valgfritt)</label>
                    <input
                      type="text"
                      placeholder="Eks. Stopp innom Hotel Continental eller Majorstuen"
                      value={viaStops}
                      onChange={(e) => setViaStops(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* 2. VEHICLE CLASS TIER SELECTOR */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      2. Velg Kjøretøysklasse
                    </label>
                    <span className="text-[11px] text-slate-400">Garantert bilmodell</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {VEHICLE_TIERS.map((tier) => {
                      const isSelected = selectedTier === tier.id;
                      const tierPrice = priceDetails ? Math.round(priceDetails.totalPrice * tier.multiplier) : null;
                      return (
                        <div
                          key={tier.id}
                          onClick={() => setSelectedTier(tier.id)}
                          className={`relative p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gradient-to-b from-[#D4AF37]/15 to-[#0B0F19] border-[#D4AF37] shadow-xl shadow-[#D4AF37]/10'
                              : 'bg-[#090D16] border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
                          }`}
                        >
                          {tier.popular && (
                            <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-[#D4AF37] text-slate-950 text-[9px] font-black uppercase rounded-full shadow-md">
                              {tier.badge}
                            </span>
                          )}

                          <div>
                            <h4 className="font-bold text-white text-sm mb-1">
                              {tier.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-light leading-relaxed mb-3">
                              {tier.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5 text-slate-400 text-[11px]">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                {tier.seats}
                              </span>
                              <span className="flex items-center gap-1">
                                <Luggage className="w-3.5 h-3.5 text-slate-500" />
                                {tier.luggageCap}
                              </span>
                            </div>

                            <div className="text-right">
                              {calculating ? (
                                <span className="text-[11px] text-slate-500 font-mono">Beregner...</span>
                              ) : tierPrice ? (
                                <span className={`font-mono font-bold ${isSelected ? 'text-[#D4AF37] text-sm font-black' : 'text-white'}`}>
                                  {tierPrice} NOK
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">Fastpris</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. TIME & PASSENGERS */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-xs font-black tracking-wider text-[#D4AF37] uppercase flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    3. Tidspunkt & Passasjerer
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Passasjerer</label>
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Passasjer{n > 1 ? 'er' : ''}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Kofferter</label>
                      <select
                        value={luggage}
                        onChange={(e) => setLuggage(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Koffert{n !== 1 ? 'er' : ''}</option>)}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tidspunkt</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPreorder(false)}
                          className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            !isPreorder
                              ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] font-black shadow-md'
                              : 'bg-[#090D16] text-slate-300 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          NÅ DIREKTE
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPreorder(true)}
                          className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isPreorder
                              ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] font-black shadow-md'
                              : 'bg-[#090D16] text-slate-300 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          FORHÅNDSBESTILL
                        </button>
                      </div>
                    </div>
                  </div>

                  {isPreorder && (
                    <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                      <label className="block text-[11px] font-bold text-[#D4AF37] uppercase">Dato og tidspunkt for henting *</label>
                      <input
                        type="datetime-local"
                        required={isPreorder}
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  )}
                </div>

                {/* 4. PREFERENCES & SPECIAL REQUESTS */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowPreferences(!showPreferences)}
                    className="w-full flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer py-1"
                  >
                    <span className="flex items-center gap-2 text-[#D4AF37]">
                      <Sparkles className="w-4 h-4" />
                      4. Tilleggsvalg & Spesialønsker (Valgfritt)
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-normal normal-case">
                      {showPreferences ? 'Skjul' : 'Vis valg'}
                      {showPreferences ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {showPreferences && (
                    <div className="bg-[#090D16] p-4 rounded-2xl border border-white/10 space-y-4 animate-slide-up text-xs">
                      
                      {/* QUIET RIDE TOGGLE */}
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <VolumeX className="w-4 h-4 text-[#D4AF37]" />
                          <div>
                            <span className="font-bold text-white block">Stille tur (Quiet Ride)</span>
                            <span className="text-[10px] text-slate-400">Privat atmosfære – sjåføren holder prat til et minimum.</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={quietRide}
                          onChange={(e) => setQuietRide(e.target.checked)}
                          className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                        />
                      </div>

                      {/* TEMPERATURE */}
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <Thermometer className="w-4 h-4 text-cyan-400" />
                          <div>
                            <span className="font-bold text-white block">Kupétemperatur</span>
                            <span className="text-[10px] text-slate-400">Foretrukket temperatur under turen.</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {[
                            { id: 'cool', label: 'Kjølig' },
                            { id: 'normal', label: 'Standard' },
                            { id: 'warm', label: 'Varmt' }
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setTemperature(t.id as any)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                temperature === t.id
                                  ? 'bg-[#D4AF37] text-slate-950 font-black'
                                  : 'bg-white/5 text-slate-400 hover:text-white'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* LUGGAGE HELP & SPECIALS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <label className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={luggageHelp}
                            onChange={(e) => setLuggageHelp(e.target.checked)}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          <span className="text-[11px] text-slate-200">Bagasjehjelp til/fra døren</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={childSeat}
                            onChange={(e) => setChildSeat(e.target.checked)}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          <span className="text-[11px] text-slate-200">Barnesete / Sittepute</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={petFriendly}
                            onChange={(e) => setPetFriendly(e.target.checked)}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          <span className="text-[11px] text-slate-200">Kjæledyr i bur tillatt</span>
                        </label>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Flynummer (f.eks. DY142)"
                            value={flightNumber}
                            onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-[11px] text-white uppercase focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* 5. CONTACT DETAILS */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-xs font-black tracking-wider text-[#D4AF37] uppercase flex items-center gap-2">
                    <User className="w-4 h-4" />
                    5. Kontaktinformasjon
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Navn *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ola Nordmann"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Telefon *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+47 900 00 000"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">E-post *</label>
                      <input
                        type="email"
                        required
                        placeholder="ola@epost.no"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Beskjed til sjåfør (Valgfritt)</label>
                    <textarea
                      rows={2}
                      placeholder="F.eks. Møtested ved hovedinngangen, ekstra bagasje, rullestol eller spesielle ønsker..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* 6. PAYMENT METHOD */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                      6. Betalingsmåte
                    </label>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#D4AF37]" />
                      256-bit SSL Kryptert
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'card', name: 'Kort / Stripe', sub: 'Visa · Mastercard' },
                      { id: 'vipps', name: 'Vipps', sub: 'Mobilbetaling' },
                      { id: 'apple_pay', name: 'Apple Pay', sub: 'Touch / Face ID' },
                      { id: 'cash', name: 'Kontant', sub: 'Betal i bil' }
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`py-3 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          paymentMethod === pm.id
                            ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] font-black shadow-lg shadow-[#D4AF37]/20 scale-[1.02]'
                            : 'bg-[#090D16] text-slate-300 border-white/10 hover:border-white/20 font-bold'
                        }`}
                      >
                        <div className="uppercase text-xs">{pm.name}</div>
                        <div className={`text-[10px] font-medium mt-0.5 ${paymentMethod === pm.id ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                          {pm.sub}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* STRIPE SECURE BADGE */}
                  {(paymentMethod === 'card' || (paymentMethod as string) === 'stripe') && (
                    <div className="p-3 bg-gradient-to-r from-[#D4AF37]/10 via-[#0F1420] to-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        <span className="text-slate-300">
                          Offisiell <strong>Stripe Checkout</strong> med BankID, 3D Secure og umiddelbar e-postkvittering.
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono font-black rounded-full uppercase shrink-0">
                        {stripeStatus?.mode === 'live' ? 'Stripe Live' : 'Stripe Testmodus'}
                      </span>
                    </div>
                  )}
                </div>

                {/* 7. RABATTKODE (CLEAN & SIMPLE INPUT) */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Rabattkode (Valgfritt)
                  </label>
                  {appliedCoupon ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono font-bold text-emerald-300">{appliedCoupon.code}</span>
                        <span className="text-slate-400">({appliedCoupon.discountDescription})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-rose-400 hover:underline cursor-pointer font-bold"
                      >
                        Fjern
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Skriv inn rabattkode..."
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          className="flex-1 px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white font-mono placeholder-slate-500 uppercase focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          className="px-5 py-2.5 bg-white/10 hover:bg-[#D4AF37] hover:text-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-white/10"
                        >
                          Bruk
                        </button>
                      </div>
                      {couponError && <p className="text-[11px] text-rose-400">{couponError}</p>}
                    </div>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <div className="space-y-2.5 pt-3">
                  <button
                    type="submit"
                    disabled={submitting || calculating || (!isPreorder && !isDriverAvailable)}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      !isPreorder && !isDriverAvailable
                        ? 'bg-[#151c28] text-slate-400 border border-white/10 cursor-not-allowed opacity-85'
                        : 'bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#C5A028] hover:brightness-110 text-slate-950 shadow-2xl shadow-[#D4AF37]/25 cursor-pointer'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {paymentMethod === 'card' ? 'Klargjør Stripe Checkout...' : 'Sender bestilling...'}
                      </>
                    ) : !isPreorder && !isDriverAvailable ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        Ingen sjåfør ledig nå – Velg Forhåndsbestilling
                      </>
                    ) : paymentMethod === 'card' ? (
                      <>
                        <CreditCard className="w-4 h-4" />
                        {isPreorder ? 'Forhåndsbestill & Betal med Stripe' : 'Bekreft & Betal med Stripe'} ({finalPayablePrice > 0 ? `${finalPayablePrice} NOK` : 'Beregner...'})
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : isPreorder ? (
                      <>
                        Bekreft Forhåndsbestilling ({finalPayablePrice > 0 ? `${finalPayablePrice} NOK` : 'Beregner...'})
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Bekreft & Bestill Nå ({finalPayablePrice > 0 ? `${finalPayablePrice} NOK` : 'Beregner...'})
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {!isPreorder && !isDriverAvailable && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center text-xs text-rose-300">
                      Direkte bestilling er midlertidig stengt da alle biler er opptatt. Klikk på <b>«FORHÅNDSBESTILL»</b> for å reservere bil til senere tidspunkt.
                    </div>
                  )}
                </div>

              </form>

              {/* RIGHT SIDE MAP & PRICING BREAKDOWN (5 COLS) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* LEAFLET MAP PREVIEW */}
                <div className="bg-[#0E131F]/90 border border-white/10 rounded-3xl p-4 shadow-2xl space-y-2 backdrop-blur-xl">
                  <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                    <span className="font-bold text-slate-200 uppercase tracking-wider">Ruteberegning</span>
                    <span className="text-[#D4AF37] font-mono text-[10px]">Raskeste Vei</span>
                  </div>
                  
                  <LeafletMap
                    pickup={fromPoint}
                    destination={toPoint}
                    routeGeometry={routeData?.geometry}
                  />
                </div>

                {/* PRICING BREAKDOWN CARD WITH START FEE & AIRPORT FEE */}
                <div className="bg-[#0E131F]/90 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <h3 className="text-xs font-black tracking-wider text-[#D4AF37] uppercase flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Prisberegning & Spesifikasjon
                    </h3>
                    <span className="px-2.5 py-0.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black rounded-full uppercase">
                      Fastpris
                    </span>
                  </div>

                  {calculating ? (
                    <div className="flex items-center gap-3 text-xs text-slate-400 py-6 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                      <span>Beregner rute og fastpris...</span>
                    </div>
                  ) : priceDetails && routeData ? (
                    <div className="space-y-2.5 text-xs">
                      
                      {/* STARTGEBYR */}
                      <div className="flex justify-between items-center py-1 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          Startgebyr (oppstart):
                        </span>
                        <span className="font-mono font-bold text-white">{priceDetails.startFee} NOK</span>
                      </div>

                      {/* DISTANSE */}
                      <div className="flex justify-between items-center py-1 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Kjøredistanse ({routeData.distanceKm} km á {priceDetails.ratePerKm} kr):
                        </span>
                        <span className="font-mono font-bold text-white">{priceDetails.distanceCost} NOK</span>
                      </div>

                      {/* TID */}
                      <div className="flex justify-between items-center py-1 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Tidsberegning ({routeData.durationMinutes} min):
                        </span>
                        <span className="font-mono font-bold text-white">{priceDetails.timeCost} NOK</span>
                      </div>

                      {/* FLYPLASSGEBYR */}
                      <div className="flex justify-between items-center py-1 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Plane className="w-3.5 h-3.5 text-sky-400" />
                          Flyplassgebyr (Gardermoen/Torp):
                        </span>
                        <span className={`font-mono font-bold ${priceDetails.airportFee > 0 ? 'text-sky-300' : 'text-slate-500'}`}>
                          {priceDetails.airportFee > 0 ? `${priceDetails.airportFee} NOK` : '0 NOK'}
                        </span>
                      </div>

                      {/* BILKLASSE TILLEGG HVIS VIP */}
                      {currentTierObj.multiplier > 1 && (
                        <div className="flex justify-between items-center py-1 text-slate-300">
                          <span>Bilklasse ({currentTierObj.name}):</span>
                          <span className="font-mono text-[#D4AF37]">
                            +{Math.round((currentTierObj.multiplier - 1) * 100)}% ({currentTierObj.multiplier}x)
                          </span>
                        </div>
                      )}

                      {/* RABATT DERSOM AKTIV */}
                      {appliedCoupon && discountAmount > 0 && (
                        <div className="flex justify-between items-center py-1.5 text-emerald-400 bg-emerald-500/10 px-2 rounded-lg">
                          <span className="font-bold">Rabatt ({appliedCoupon.code}):</span>
                          <span className="font-mono font-black">-{discountAmount} NOK</span>
                        </div>
                      )}

                      {/* TOTAL FASTPRIS */}
                      <div className="pt-3 flex justify-between items-center border-t border-white/10">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400 font-bold">Total Fastpris</span>
                          <div className="flex items-baseline gap-2">
                            {discountAmount > 0 && (
                              <span className="text-sm font-mono text-slate-500 line-through">
                                {baseGrossPrice} NOK
                              </span>
                            )}
                            <span className="text-2xl font-black font-display text-[#D4AF37]">
                              {finalPayablePrice} NOK
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 block">
                            Inkl. 12% MVA
                          </span>
                          <span className="text-[9px] text-slate-500 mt-0.5 block">Ingen skjulte kostnader</span>
                        </div>
                      </div>

                    </div>
                  ) : null}

                </div>

                {/* ARON TAXI GARANTI */}
                <div className="bg-[#090D16] border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                  <h4 className="text-[#D4AF37] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Aron Taxi Trygghetsgaranti
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      Garantert fastpris – ingen taksameter-overraskelser
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      Erfarne sjåfører med gyldig drosjeløyve
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      100% utslippsfrie biler
                    </li>
                  </ul>
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
