export interface CreateSessionParams {
  tripId: string;
  amount: number;
  pickupAddress: string;
  destinationAddress: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleTier?: string;
  distanceKm?: number;
  durationMinutes?: number;
  passengers?: number;
  couponCode?: string;
}

export interface StripeSessionResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
  message?: string;
}

export interface VerificationResult {
  success: boolean;
  isPaid: boolean;
  sessionStatus?: string;
  paymentStatus?: string;
  tripId?: string;
  paymentIntentId?: string;
  amountTotal?: number;
  currency?: string;
  customerEmail?: string;
  error?: string;
  message?: string;
}

export interface StripeConfigStatus {
  isConfigured: boolean;
  mode: 'live' | 'test';
  publishableKey?: string;
  message: string;
}

// Candidate backend API hosts in order of priority
const CANDIDATE_API_HOSTS = [
  '', // Same origin (relative)
  (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''),
  'https://ais-pre-2gimjy77jh25l3otwz67wn-220634877794.europe-west1.run.app',
  'https://ais-dev-2gimjy77jh25l3otwz67wn-220634877794.europe-west1.run.app',
].filter((url, index, self) => (url !== undefined && self.indexOf(url) === index));

let cachedWorkingHost: string | null = null;

function getApiBaseHosts(): string[] {
  // If we already found a working host in this session, try that first
  const remembered = cachedWorkingHost || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('aron_working_api_host') : null);
  if (remembered !== null && CANDIDATE_API_HOSTS.includes(remembered)) {
    return [remembered, ...CANDIDATE_API_HOSTS.filter((h) => h !== remembered)];
  }

  // If running on custom domain (like arontaxioslo.no) where static hosting might not have backend, prioritize cloud run URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('arontaxioslo.no')) {
    return [
      'https://ais-pre-2gimjy77jh25l3otwz67wn-220634877794.europe-west1.run.app',
      '',
      'https://ais-dev-2gimjy77jh25l3otwz67wn-220634877794.europe-west1.run.app',
    ];
  }

  return CANDIDATE_API_HOSTS;
}

function setWorkingHost(host: string) {
  cachedWorkingHost = host;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('aron_working_api_host', host);
    }
  } catch {
    // Ignore storage restrictions
  }
}

/**
 * Calls the secure backend endpoint to create a Stripe Checkout Session.
 * Stripe Secret Key is strictly maintained on the server-side.
 */
export async function createStripeCheckoutSession(
  params: CreateSessionParams
): Promise<StripeSessionResult> {
  const hosts = getApiBaseHosts();
  let lastError: any = null;

  for (const host of hosts) {
    try {
      const endpoint = `${host}/api/create-checkout-session`;
      console.log(`[Stripe Client] Prøver å opprette checkout-økt via: ${endpoint || '/'}`);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(params),
      });

      const status = res.status;
      const rawText = await res.text();

      // If static host returns 405 (Method Not Allowed), 404, or HTML page, try next backend host
      if (status === 405 || status === 404 || rawText.startsWith('<!DOCTYPE') || rawText.includes('Cannot POST')) {
        console.warn(`[Stripe Client] Vert ${host || 'relativ'} svarte med status ${status} (ikke Node.js backend). Prøver neste vert...`);
        lastError = {
          success: false,
          error: 'HOST_NOT_API',
          message: `Vert ${host || 'lokal'} støttet ikke API-forespørsel (${status}).`,
        };
        continue;
      }

      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        console.warn(`[Stripe Client] JSON parse feil fra ${host}:`, rawText);
        continue;
      }

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'SERVER_ERROR',
          message: data.message || `Betalingsfeil fra server (${res.status})`,
        };
      }

      if (!data.url) {
        return {
          success: false,
          error: 'NO_CHECKOUT_URL',
          message: 'Mottok ingen Checkout-URL fra Stripe.',
        };
      }

      // Successfully connected to backend
      setWorkingHost(host);
      return {
        success: true,
        url: data.url,
        sessionId: data.sessionId,
      };
    } catch (err: any) {
      console.warn(`[Stripe Client] Nettverksfeil mot vert ${host}:`, err?.message || err);
      lastError = err;
    }
  }

  return {
    success: false,
    error: 'NETWORK_ERROR',
    message: lastError?.message
      ? `Tilkoblingsfeil: ${lastError.message}`
      : 'Kunne ikke nå betalingsserveren. Vennligst sjekk internettforbindelsen og prøv igjen.',
  };
}

/**
 * Verifies a Stripe Checkout Session status on the server.
 */
export async function verifyStripeSession(
  sessionId: string,
  tripId?: string
): Promise<VerificationResult> {
  const hosts = getApiBaseHosts();
  let lastError: any = null;

  for (const host of hosts) {
    try {
      const endpoint = `${host}/api/verify-checkout-session?session_id=${encodeURIComponent(
        sessionId
      )}${tripId ? `&trip_id=${encodeURIComponent(tripId)}` : ''}`;

      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
      });

      const status = res.status;
      const rawText = await res.text();

      if (status === 404 || status === 405 || rawText.startsWith('<!DOCTYPE')) {
        continue;
      }

      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        continue;
      }

      if (!res.ok) {
        return {
          success: false,
          isPaid: false,
          error: data.error,
          message: data.message || 'Kunne ikke verifisere betaling.',
        };
      }

      setWorkingHost(host);
      return {
        success: true,
        isPaid: data.isPaid,
        sessionStatus: data.sessionStatus,
        paymentStatus: data.paymentStatus,
        tripId: data.tripId,
        paymentIntentId: data.paymentIntentId,
        amountTotal: data.amountTotal,
        currency: data.currency,
        customerEmail: data.customerEmail,
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  return {
    success: false,
    isPaid: false,
    error: 'NETWORK_ERROR',
    message: 'Kunne ikke nå betalingsserveren for verifisering.',
  };
}

/**
 * Checks if Stripe backend is active and configured.
 */
export async function checkStripeStatus(): Promise<StripeConfigStatus> {
  const hosts = getApiBaseHosts();
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/api/stripe-config`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && typeof data.isConfigured === 'boolean') {
        setWorkingHost(host);
        return data;
      }
    } catch {
      // Try next
    }
  }

  return {
    isConfigured: false,
    mode: 'test',
    message: 'Betalingsserver offline',
  };
}
