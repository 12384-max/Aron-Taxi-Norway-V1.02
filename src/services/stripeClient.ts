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

/**
 * Calls the secure backend endpoint to create a Stripe Checkout Session.
 * Stripe Secret Key is strictly maintained on the server-side.
 */
export async function createStripeCheckoutSession(
  params: CreateSessionParams
): Promise<StripeSessionResult> {
  try {
    const apiEndpoint = '/api/create-checkout-session';
    const res = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(params),
    });

    const rawText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Server returned non-JSON response:', rawText);
      return {
        success: false,
        error: 'INVALID_SERVER_RESPONSE',
        message: `Betalingsserver svarte med status ${res.status}: ${rawText.slice(0, 100)}`,
      };
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

    return {
      success: true,
      url: data.url,
      sessionId: data.sessionId,
    };
  } catch (err: any) {
    console.error('Stripe create session error:', err);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: err?.message ? `Nettverksfeil: ${err.message}` : 'Nettverksfeil ved kontakt med betalingsserveren.',
    };
  }
}

/**
 * Verifies a Stripe Checkout Session status on the server.
 */
export async function verifyStripeSession(
  sessionId: string,
  tripId?: string
): Promise<VerificationResult> {
  try {
    const url = new URL('/api/verify-checkout-session', window.location.origin);
    url.searchParams.set('session_id', sessionId);
    if (tripId) url.searchParams.set('trip_id', tripId);

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    const rawText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        isPaid: false,
        error: 'INVALID_RESPONSE',
        message: 'Uventet svar fra betalingsserveren.',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        isPaid: false,
        error: data.error,
        message: data.message || 'Kunne ikke verifisere betaling.',
      };
    }

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
    console.error('Stripe verify session error:', err);
    return {
      success: false,
      isPaid: false,
      error: 'NETWORK_ERROR',
      message: 'Kunne ikke nå betalingsserveren for verifisering.',
    };
  }
}

/**
 * Checks if Stripe backend is active and configured.
 */
export async function checkStripeStatus(): Promise<StripeConfigStatus> {
  try {
    const res = await fetch('/api/stripe-config');
    if (!res.ok) {
      return {
        isConfigured: false,
        mode: 'test',
        message: 'Betalingsserver svarte ikke.',
      };
    }
    return await res.json();
  } catch (e) {
    return {
      isConfigured: false,
      mode: 'test',
      message: 'Server offline',
    };
  }
}
