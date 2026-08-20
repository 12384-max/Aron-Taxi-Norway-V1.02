import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { serverDb, updateTripInFirestore } from './stripeService';

export interface VippsConfig {
  clientId?: string;
  clientSecret?: string;
  subscriptionKey?: string;
  merchantSerialNumber?: string;
  environment: 'test' | 'live';
}

export function getVippsConfig(): VippsConfig {
  return {
    clientId: process.env.VIPPS_CLIENT_ID,
    clientSecret: process.env.VIPPS_CLIENT_SECRET,
    subscriptionKey: process.env.VIPPS_SUBSCRIPTION_KEY || process.env.VIPPS_OCP_APIM_SUBSCRIPTION_KEY,
    merchantSerialNumber: process.env.VIPPS_MERCHANT_SERIAL_NUMBER || process.env.VIPPS_MSN,
    environment: process.env.VIPPS_ENVIRONMENT === 'live' ? 'live' : 'test',
  };
}

export function isVippsConfigured(): boolean {
  const cfg = getVippsConfig();
  const isInvalid = (str?: string) =>
    !str ||
    str.trim().length < 6 ||
    str.startsWith('your-') ||
    str.includes('placeholder') ||
    str.includes('example');

  return Boolean(
    !isInvalid(cfg.clientId) &&
    !isInvalid(cfg.clientSecret) &&
    !isInvalid(cfg.subscriptionKey) &&
    !isInvalid(cfg.merchantSerialNumber)
  );
}

export function getVippsBaseUrl(): string {
  const cfg = getVippsConfig();
  return cfg.environment === 'live'
    ? 'https://api.vipps.no'
    : 'https://apitest.vipps.no';
}

interface CachedToken {
  token: string;
  expiresAt: number; // Unix timestamp in ms
}

let cachedToken: CachedToken | null = null;

/**
 * Retrieves a valid OAuth2 bearer token from Vipps Access Token API
 */
export async function getVippsAccessToken(): Promise<string> {
  const cfg = getVippsConfig();
  if (!isVippsConfigured()) {
    throw new Error('Vipps API-nøkler (VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, etc.) er ikke konfigurert.');
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const url = `${getVippsBaseUrl()}/accesstoken/get`;
  console.log(`[Vipps Backend] 🔑 Henter nytt Access Token fra ${url}...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      client_id: cfg.clientId!,
      client_secret: cfg.clientSecret!,
      'Ocp-Apim-Subscription-Key': cfg.subscriptionKey!,
      'Merchant-Serial-Number': cfg.merchantSerialNumber!,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Vipps Backend] ❌ Feil ved henting av Vipps token (${response.status}):`, errText);
    throw new Error(`Vipps autentisering feilet: ${response.status} ${errText}`);
  }

  const data: any = await response.json();
  const token = data.access_token || data.token;
  const expiresInSec = parseInt(data.expires_in || '3600', 10);

  cachedToken = {
    token,
    expiresAt: now + expiresInSec * 1000,
  };

  console.log(`[Vipps Backend] ✅ Nytt Vipps Access Token mottatt (utløper om ${expiresInSec}s).`);
  return token;
}

export interface CreateVippsPaymentParams {
  tripId: string;
  amount: number; // in NOK
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  vehicleTier?: string;
}

export interface VippsPaymentResult {
  success: boolean;
  reference: string;
  redirectUrl: string;
  isTestMode: boolean;
  status: 'CREATED' | 'AUTHORIZED' | 'PENDING';
  message: string;
}

// In-memory simulator state for testing without API keys or test keys
interface SimulatedPayment {
  reference: string;
  tripId: string;
  amount: number;
  customerPhone: string;
  state: 'CREATED' | 'AUTHORIZED' | 'CAPTURED' | 'ABORTED' | 'EXPIRED';
  createdAt: number;
}

const simulatedPayments = new Map<string, SimulatedPayment>();

/**
 * Creates a Vipps e-Payment
 */
export async function createVippsPayment(params: CreateVippsPaymentParams): Promise<VippsPaymentResult> {
  const { tripId, amount, customerPhone, customerName, pickupAddress, destinationAddress, vehicleTier } = params;
  const reference = `TUR-${tripId.replace(/[^a-zA-Z0-9_-]/g, '').slice(-12).toUpperCase()}`;
  const amountInOere = Math.round(amount * 100);

  const cleanPhone = (customerPhone || '90000000').replace(/\D/g, '').slice(-8);
  const appUrl = (process.env.APP_URL || 'https://arontaxioslo.no').replace(/\/$/, '');
  const returnUrl = `${appUrl}/order?status=vipps_success&trip_id=${tripId}&ref=${reference}`;

  const cfg = getVippsConfig();

  // If real or test Vipps keys are provided, call Vipps e-Payment v1 API
  if (isVippsConfigured()) {
    try {
      const token = await getVippsAccessToken();
      const vippsUrl = `${getVippsBaseUrl()}/epayment/v1/payments`;

      const payload = {
        amount: {
          currency: 'NOK',
          value: amountInOere,
        },
        paymentMethod: {
          type: 'WALLET',
        },
        customer: {
          phoneNumber: cleanPhone.length === 8 ? `47${cleanPhone}` : undefined,
        },
        reference,
        userFlow: 'WEB_REDIRECT',
        returnUrl,
        paymentDescription: `Aron Taxi · ${pickupAddress || 'Oslo'} ➔ ${destinationAddress || 'Gardermoen'} (${amount} NOK)`.slice(0, 100),
      };

      console.log(`[Vipps Backend] 🚀 Oppretter Vipps e-Payment for tur ${tripId} (${amount} NOK) til ${vippsUrl}...`);

      const response = await fetch(vippsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Ocp-Apim-Subscription-Key': cfg.subscriptionKey!,
          'Merchant-Serial-Number': cfg.merchantSerialNumber!,
          'Idempotency-Key': `idem_${reference}_${Date.now()}`,
          'Vipps-System-Name': 'Aron Taxi Booking System',
          'Vipps-System-Version': '2.0.0',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data: any = await response.json();
        console.log(`[Vipps Backend] ✅ Vipps e-Payment opprettet:`, data);

        // Keep trip in pending_payment status until real authorization
        await updateTripInFirestore(tripId, {
          paymentStatus: 'pending_payment',
          paymentMethod: 'vipps',
          paymentId: reference,
        });

        return {
          success: true,
          reference,
          redirectUrl: data.redirectUrl || returnUrl,
          isTestMode: cfg.environment === 'test',
          status: data.state || 'CREATED',
          message: 'Vipps betaling opprettet.',
        };
      } else {
        const errText = await response.text();
        console.warn(`[Vipps Backend] ⚠️ Vipps API svarte med status ${response.status}:`, errText);
      }
    } catch (apiErr: any) {
      console.warn(`[Vipps Backend] ⚠️ Feil ved kall mot Vipps API, bruker Vipps Testmiljø:`, apiErr?.message);
    }
  }

  // Fallback to Vipps Test/Sandbox Engine
  console.log(`[Vipps Backend] 📱 Initialiserer Vipps Sandbox for tur ${tripId} (Referanse: ${reference}, Beløp: ${amount} NOK)`);

  simulatedPayments.set(reference, {
    reference,
    tripId,
    amount,
    customerPhone: cleanPhone,
    state: 'CREATED',
    createdAt: Date.now(),
  });

  // Mark trip as pending_payment (NOT visible to drivers yet!)
  await updateTripInFirestore(tripId, {
    paymentStatus: 'pending_payment',
    paymentMethod: 'vipps',
    paymentId: reference,
  });

  return {
    success: true,
    reference,
    redirectUrl: returnUrl,
    isTestMode: true,
    status: 'CREATED',
    message: 'Vipps e-Payment klar til godkjenning.',
  };
}

/**
 * Verifies or checks payment state on Vipps
 */
export async function verifyVippsPayment(reference: string, tripId?: string): Promise<{
  isPaid: boolean;
  state: 'CREATED' | 'AUTHORIZED' | 'CAPTURED' | 'ABORTED' | 'EXPIRED' | 'TERMINATED' | 'UNKNOWN';
  reference: string;
  tripId?: string;
  amount?: number;
  message: string;
}> {
  const cfg = getVippsConfig();

  // If real Vipps is configured, query official Vipps e-Payment GET endpoint
  if (isVippsConfigured()) {
    try {
      const token = await getVippsAccessToken();
      const vippsUrl = `${getVippsBaseUrl()}/epayment/v1/payments/${encodeURIComponent(reference)}`;

      const response = await fetch(vippsUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Ocp-Apim-Subscription-Key': cfg.subscriptionKey!,
          'Merchant-Serial-Number': cfg.merchantSerialNumber!,
        },
      });

      if (response.ok) {
        const data: any = await response.json();
        const state = (data.state || 'UNKNOWN') as any;
        const isPaid = state === 'AUTHORIZED' || state === 'CAPTURED';

        console.log(`[Vipps Backend] 🔍 Sjekket Vipps status for ${reference}: state=${state}`);

        if (isPaid && tripId) {
          await updateTripInFirestore(tripId, {
            paymentStatus: 'paid',
            paymentMethod: 'vipps',
            paymentId: reference,
            paidAt: new Date().toISOString(),
            status: 'confirmed', // Now drivers can see and receive the trip!
          });
          console.log(`[Vipps Backend] 🚀 Tur ${tripId} bekreftet som BETALT (paid / confirmed) via Vipps e-Payment!`);
        } else if ((state === 'ABORTED' || state === 'EXPIRED' || state === 'TERMINATED') && tripId) {
          await updateTripInFirestore(tripId, {
            paymentStatus: 'cancelled',
            status: 'cancelled',
          });
          console.log(`[Vipps Backend] ❌ Tur ${tripId} ble avbrutt eller utløpt i Vipps.`);
        }

        return {
          isPaid,
          state,
          reference,
          tripId,
          amount: data.amount?.value ? data.amount.value / 100 : undefined,
          message: isPaid ? 'Betaling er autorisert i Vipps.' : `Vipps status: ${state}`,
        };
      }
    } catch (err: any) {
      console.warn(`[Vipps Backend] ⚠️ Feil ved sjekk mot Vipps API:`, err?.message);
    }
  }

  // Check Sandbox Simulator state
  const sim = simulatedPayments.get(reference);
  if (sim) {
    const isPaid = sim.state === 'AUTHORIZED' || sim.state === 'CAPTURED';

    if (isPaid && sim.tripId) {
      await updateTripInFirestore(sim.tripId, {
        paymentStatus: 'paid',
        paymentMethod: 'vipps',
        paymentId: reference,
        paidAt: new Date().toISOString(),
        status: 'confirmed',
      });
    }

    return {
      isPaid,
      state: sim.state,
      reference,
      tripId: sim.tripId,
      amount: sim.amount,
      message: isPaid ? 'Betaling godkjent i Vipps.' : `Venter på godkjenning (${sim.state}).`,
    };
  }

  return {
    isPaid: false,
    state: 'UNKNOWN',
    reference,
    tripId,
    message: 'Fant ikke betaling.',
  };
}

/**
 * Approve payment in test sandbox mode
 */
export async function approveSimulatedVippsPayment(reference: string): Promise<boolean> {
  const sim = simulatedPayments.get(reference);
  if (!sim) return false;

  sim.state = 'AUTHORIZED';
  console.log(`[Vipps Sandbox] ✅ Betaling ${reference} godkjent i Vipps Testmiljø.`);

  if (sim.tripId) {
    await updateTripInFirestore(sim.tripId, {
      paymentStatus: 'paid',
      paymentMethod: 'vipps',
      paymentId: reference,
      paidAt: new Date().toISOString(),
      status: 'confirmed',
    });
  }
  return true;
}

/**
 * Reject / Abort payment in test sandbox mode
 */
export async function rejectSimulatedVippsPayment(reference: string): Promise<boolean> {
  const sim = simulatedPayments.get(reference);
  if (!sim) return false;

  sim.state = 'ABORTED';
  console.log(`[Vipps Sandbox] ❌ Betaling ${reference} ble avbrutt av bruker.`);

  if (sim.tripId) {
    try {
      await deleteDoc(doc(serverDb, 'trips', sim.tripId));
      console.log(`[Vipps Sandbox] 🗑️ Ubetalt tur ${sim.tripId} slettet fra databasen.`);
    } catch (e) {
      await updateTripInFirestore(sim.tripId, {
        paymentStatus: 'cancelled',
        status: 'cancelled',
      });
    }
  }
  return true;
}
