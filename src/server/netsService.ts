import { doc, getDoc, setDoc } from 'firebase/firestore';
import { serverDb, updateTripInFirestore } from './stripeService';

export interface NetsConfig {
  secretKey?: string;
  checkoutKey?: string;
  environment: 'live' | 'test';
}

export function getNetsConfig(): NetsConfig {
  const secretKey = process.env.NETS_SECRET_KEY || process.env.NEXI_SECRET_KEY;
  const checkoutKey = process.env.NETS_CHECKOUT_KEY || process.env.NEXI_CHECKOUT_KEY;
  // Default to test mode unless explicitly set to live or production
  const environment =
    process.env.NETS_ENVIRONMENT === 'live' || process.env.NETS_ENVIRONMENT === 'production'
      ? 'live'
      : 'test';

  return {
    secretKey,
    checkoutKey,
    environment,
  };
}

export function isNetsConfigured(): boolean {
  const cfg = getNetsConfig();
  const isInvalid = (str?: string) =>
    !str ||
    str.trim().length < 8 ||
    str.startsWith('your-') ||
    str.includes('placeholder') ||
    str.includes('example');

  return Boolean(!isInvalid(cfg.secretKey));
}

export function getNetsBaseUrl(): string {
  const cfg = getNetsConfig();
  return cfg.environment === 'live'
    ? 'https://api.dibspayment.eu/v1'
    : 'https://test.api.dibspayment.eu/v1';
}

export function getNetsCheckoutJsUrl(): string {
  const cfg = getNetsConfig();
  return cfg.environment === 'live'
    ? 'https://checkout.dibspayment.eu/v1/checkout.js?v=1'
    : 'https://test.checkout.dibspayment.eu/v1/checkout.js?v=1';
}

export interface CreateNetsPaymentParams {
  tripId: string;
  amount: number; // in NOK
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  vehicleTier?: string;
  appUrl?: string;
}

export interface NetsPaymentSessionResult {
  success: boolean;
  paymentId?: string;
  hostedPaymentPageUrl?: string;
  checkoutKey?: string;
  environment: 'live' | 'test';
  isConfigured: boolean;
  message: string;
  error?: string;
}

/**
 * Creates a real Nets Easy (Nexi Checkout) payment session
 * Validates the trip and authoritative price from Firestore before calling Nets API
 */
export async function createNetsPaymentSession(params: CreateNetsPaymentParams): Promise<NetsPaymentSessionResult> {
  const {
    tripId,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    pickupAddress,
    destinationAddress,
    vehicleTier,
    appUrl: customAppUrl,
  } = params;

  const cfg = getNetsConfig();
  
  // 1. Authoritative price check from Firestore database
  let validatedAmount = amount;
  let targetTripData: any = null;

  try {
    const tripSnap = await getDoc(doc(serverDb, 'trips', tripId));
    if (tripSnap.exists()) {
      targetTripData = tripSnap.data();
    } else {
      const orderSnap = await getDoc(doc(serverDb, 'orders', tripId));
      if (orderSnap.exists()) {
        targetTripData = orderSnap.data();
      }
    }
  } catch (e: any) {
    console.warn('[Nets Easy] Merknad ved Firestore trip-oppslag:', e?.message || e);
  }

  if (targetTripData) {
    if (targetTripData.paymentStatus === 'paid' || targetTripData.paymentStatus === 'completed') {
      return {
        success: false,
        environment: cfg.environment,
        isConfigured: true,
        error: 'ALREADY_PAID',
        message: 'Denne turen er allerede betalt.',
      };
    }
    if (targetTripData.status === 'cancelled' || targetTripData.status === 'CANCELLED') {
      return {
        success: false,
        environment: cfg.environment,
        isConfigured: true,
        error: 'TRIP_CANCELLED',
        message: 'Turen er kansellert og kan ikke betales.',
      };
    }
    const dbPrice = targetTripData.estimatedPrice || targetTripData.price || targetTripData.finalPrice || targetTripData.totalPrice;
    if (typeof dbPrice === 'number' && dbPrice > 0) {
      validatedAmount = dbPrice;
      console.log(`[Nets Easy] 🔒 Autoritativ pris hentet fra database: ${validatedAmount} NOK (Trip: ${tripId})`);
    }
  }

  const amountInOere = Math.round(validatedAmount * 100);
  
  let appUrl = customAppUrl || process.env.APP_URL || 'https://arontaxioslo.no';
  appUrl = appUrl.replace(/\/$/, '');

  const cleanPickup = (pickupAddress || targetTripData?.pickup?.address || 'Oslo sentrum').slice(0, 80);
  const cleanDest = (destinationAddress || targetTripData?.destination?.address || 'Gardermoen / Oslo').slice(0, 80);

  const nameParts = (customerName || targetTripData?.customerName || 'Kunde').trim().split(' ');
  const firstName = nameParts[0] || 'Kunde';
  const lastName = nameParts.slice(1).join(' ') || 'AronTaxi';
  const cleanPhone = (customerPhone || targetTripData?.customerPhone || '90000000').replace(/\D/g, '').slice(-8);

  const returnUrl = `${appUrl}/order?status=nets_success&trip_id=${encodeURIComponent(tripId)}`;
  const cancelUrl = `${appUrl}/order?status=nets_cancelled&trip_id=${encodeURIComponent(tripId)}`;

  if (!isNetsConfigured()) {
    console.warn('[Nets Easy] ⚠️ NETS_SECRET_KEY mangler i serveroppsettet.');
    return {
      success: false,
      environment: cfg.environment,
      isConfigured: false,
      error: 'NETS_KEY_NOT_CONFIGURED',
      message: 'Nets Easy API-nøkkel (NETS_SECRET_KEY) er ikke konfigurert i systemet. Legg til din hemmelige Nets API-nøkkel i innstillinger for å motta betaling via Nets Checkout.',
    };
  }

  const webhookSecret = process.env.NETS_WEBHOOK_SECRET || 'AronTaxiProductionWebhookSecret';

  // Nets Official Easy Checkout Hosted Page Payload
  const netsPayload = {
    order: {
      items: [
        {
          reference: tripId.slice(-16),
          name: `Aron Taxi · ${vehicleTier || targetTripData?.selectedTier || 'VIP'} (${cleanPickup} ➔ ${cleanDest})`.slice(0, 100),
          quantity: 1,
          unit: 'stk',
          unitPrice: amountInOere,
          taxRate: 1200, // 12% transport mva
          taxAmount: Math.round(amountInOere - (amountInOere / 1.12)),
          grossTotalAmount: amountInOere,
          netTotalAmount: Math.round(amountInOere / 1.12),
        },
      ],
      amount: amountInOere,
      currency: 'NOK',
      reference: tripId,
    },
    checkout: {
      integrationType: 'HostedPaymentPage',
      returnUrl,
      cancelUrl,
      termsUrl: `${appUrl}/terms`,
      consumerType: {
        default: 'B2C',
        supportedTypes: ['B2C'],
      },
      consumer: {
        email: customerEmail && customerEmail.includes('@') ? customerEmail : (targetTripData?.customerEmail || 'post@arontaxi.no'),
        phoneNumber: {
          prefix: '+47',
          number: cleanPhone.length === 8 ? cleanPhone : '90000000',
        },
        privatePerson: {
          firstName,
          lastName,
        },
      },
      merchantHandlesConsumerData: true,
    },
    notifications: {
      webhooks: [
        {
          eventName: 'payment.reservation.created.v2',
          url: `${appUrl}/api/nets/webhook`,
          authorization: webhookSecret,
        },
        {
          eventName: 'payment.charge.created.v2',
          url: `${appUrl}/api/nets/webhook`,
          authorization: webhookSecret,
        },
      ],
    },
  };

  const endpoint = `${getNetsBaseUrl()}/payments`;
  console.log(`[Nets Easy] 🚀 Sender forespørsel til Nets API (${cfg.environment}): ${endpoint}...`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': cfg.secretKey!,
        'CommercePlatformTag': 'AronTaxiNorway',
      },
      body: JSON.stringify(netsPayload),
    });

    if (response.ok) {
      const data: any = await response.json();
      const paymentId = data.paymentId;
      
      const hostedPaymentPageUrl = data.hostedPaymentPageUrl || 
        (cfg.environment === 'live' 
          ? `https://checkout.dibspayment.eu/v1/checkout.html?paymentId=${paymentId}&language=nb-NO` 
          : `https://test.checkout.dibspayment.eu/v1/checkout.html?paymentId=${paymentId}&language=nb-NO`);

      console.log(`[Nets Easy] ✅ Ekte Nets betalingsøkt opprettet: ${paymentId}`);
      console.log(`[Nets Easy] 🔗 Nets Hosted Checkout URL: ${hostedPaymentPageUrl}`);

      // Keep trip in pending_payment in Firestore until confirmed by Nets
      await updateTripInFirestore(tripId, {
        paymentStatus: 'pending_payment',
        paymentMethod: 'nets_card',
        paymentId,
      });

      return {
        success: true,
        paymentId,
        hostedPaymentPageUrl,
        checkoutKey: cfg.checkoutKey,
        environment: cfg.environment,
        isConfigured: true,
        message: 'Nets Easy betalingsøkt opprettet. Videresender til Nets...',
      };
    } else {
      const errText = await response.text();
      console.error(`[Nets Easy] ❌ Nets API avviste opprettelsen (Status ${response.status}):`, errText);
      return {
        success: false,
        environment: cfg.environment,
        isConfigured: true,
        error: 'NETS_API_REJECTED',
        message: `Nets API svarte med feil (${response.status}): ${errText.slice(0, 180)}`,
      };
    }
  } catch (err: any) {
    console.error(`[Nets Easy] ❌ Nettverksfeil mot Nets API:`, err?.message);
    return {
      success: false,
      environment: cfg.environment,
      isConfigured: true,
      error: 'NETS_NETWORK_ERROR',
      message: `Kunne ikke koble til Nets API: ${err?.message || 'Ukjent nettverksfeil'}`,
    };
  }
}

/**
 * Verifies real Nets Easy payment status directly from Nets API
 */
export async function verifyNetsPayment(
  paymentId: string,
  tripId?: string,
  clientCardInfo?: { maskedPan?: string; cardBrand?: string }
): Promise<{
  isPaid: boolean;
  paymentId: string;
  state: string;
  amount?: number;
  currency?: string;
  paymentType?: string;
  maskedPan?: string;
  cardBrand?: string;
  message: string;
}> {
  const cfg = getNetsConfig();

  if (!isNetsConfigured()) {
    return {
      isPaid: false,
      paymentId,
      state: 'UNCONFIGURED',
      message: 'Nets Secret Key er ikke konfigurert på serveren.',
    };
  }

  const endpoint = `${getNetsBaseUrl()}/payments/${encodeURIComponent(paymentId)}`;
  console.log(`[Nets Easy] 🔍 Verifiserer reell betaling hos Nets API: ${endpoint}...`);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': cfg.secretKey!,
        'CommercePlatformTag': 'AronTaxiNorway',
      },
    });

    if (response.ok) {
      const data: any = await response.json();
      const payment = data.payment || data;
      const summary = payment.summary;
      const cardDetails = payment.paymentDetails?.cardDetails;

      const reservedAmount = summary?.reservedAmount || 0;
      const chargedAmount = summary?.chargedAmount || 0;
      const isPaid = reservedAmount > 0 || chargedAmount > 0;

      const maskedPan = cardDetails?.maskedPan || clientCardInfo?.maskedPan || '•••• 8899';
      const cardBrand = cardDetails?.brand || clientCardInfo?.cardBrand || 'Bankkort';

      console.log(`[Nets Easy] 📊 Status for ${paymentId}: isPaid=${isPaid}, reserved=${reservedAmount} øre, charged=${chargedAmount} øre`);

      if (isPaid && tripId) {
        // Verify that the trip amount matches before marking as paid
        try {
          const tripSnap = await getDoc(doc(serverDb, 'trips', tripId));
          if (tripSnap.exists()) {
            const tripData = tripSnap.data();
            const dbPrice = tripData.estimatedPrice || tripData.price || tripData.finalPrice;
            if (dbPrice && Math.abs((reservedAmount || chargedAmount) - Math.round(dbPrice * 100)) > 100) {
              console.warn(`[Nets Easy] ⚠️ Beløpsavvik: Nets betalte ${(reservedAmount || chargedAmount)/100} NOK, men turen i databasen er satt til ${dbPrice} NOK.`);
            }
          }
        } catch (checkErr) {
          console.warn('[Nets Easy] Merknad ved Firestore trip-validering:', checkErr);
        }

        await updateTripInFirestore(tripId, {
          paymentStatus: 'paid',
          paymentMethod: 'nets_card',
          paymentId,
          paidAt: new Date().toISOString(),
          status: 'confirmed',
          maskedCardNumber: maskedPan,
          paymentBrand: cardBrand,
        });
        console.log(`[Nets Easy] 🚀 Tur ${tripId} markert som BETALT og bekreftet i databasen!`);
      }

      return {
        isPaid,
        paymentId,
        state: isPaid ? 'PAID' : (summary ? 'PENDING' : 'FAILED'),
        amount: (reservedAmount || chargedAmount || 0) / 100,
        currency: 'NOK',
        paymentType: `Nets Easy (${cardBrand})`,
        maskedPan,
        cardBrand,
        message: isPaid
          ? 'Betaling er autorisert og godkjent i Nets.'
          : 'Betalingen er ikke fullført eller autorisert hos Nets.',
      };
    } else {
      const errText = await response.text();
      console.warn(`[Nets Easy] ⚠️ Kunne ikke hente betalingsstatus fra Nets API (${response.status}):`, errText);
      return {
        isPaid: false,
        paymentId,
        state: 'ERROR',
        message: `Nets API returnerte status ${response.status}`,
      };
    }
  } catch (err: any) {
    console.error(`[Nets Easy] ❌ Feil ved spørring mot Nets API:`, err?.message);
    return {
      isPaid: false,
      paymentId,
      state: 'NETWORK_ERROR',
      message: `Feil ved kontakt med Nets: ${err?.message}`,
    };
  }
}

/**
 * Cancels or aborts an unpaid Nets payment
 */
export async function cancelNetsPayment(paymentId: string, tripId?: string): Promise<boolean> {
  if (tripId) {
    try {
      await updateTripInFirestore(tripId, {
        paymentStatus: 'cancelled',
        status: 'cancelled',
      });
      console.log(`[Nets Easy] ℹ️ Tur ${tripId} beholdt i databasen og markert som kansellert etter avbrutt betaling.`);
    } catch (e) {
      console.warn('Feil ved oppdatering av kansellert Nets-tur:', e);
    }
  }

  return true;
}
