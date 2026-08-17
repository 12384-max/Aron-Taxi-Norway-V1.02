import type { IncomingMessage, ServerResponse } from 'http';
import {
  getStripe,
  isStripeConfigured,
  getStripeMode,
  updateTripInFirestore,
  serverDb,
} from './stripeService';
import { doc, getDoc } from 'firebase/firestore';

export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!body.trim()) {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

export async function parseRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, stripe-signature');
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

export async function handleCreateCheckoutSession(
  reqBody: any,
  originHeader: string | undefined,
  res: ServerResponse
) {
  console.log('[Stripe Handler] 📥 create-checkout-session mottatt:', {
    tripId: reqBody?.tripId,
    amount: reqBody?.amount,
    customerName: reqBody?.customerName,
  });

  if (!isStripeConfigured()) {
    console.warn('[Stripe Handler] ⚠️ STRIPE_SECRET_KEY mangler.');
    return sendJson(res, 503, {
      error: 'STRIPE_NOT_CONFIGURED',
      message: 'Stripe Secret Key mangler. Vennligst legg inn STRIPE_SECRET_KEY i miljøvariabler/Secrets for Aron Taxi.',
    });
  }

  const {
    tripId,
    customerId,
    amount,
    pickupAddress,
    destinationAddress,
    customerName,
    customerEmail,
    customerPhone,
    vehicleTier,
    distanceKm,
    durationMinutes,
    passengers,
    couponCode,
  } = reqBody || {};

  if (!tripId || typeof amount !== 'number' || amount <= 0) {
    return sendJson(res, 400, {
      error: 'INVALID_PARAMETERS',
      message: 'Mangler påkrevde parametere: tripId og gyldig beløp (amount i NOK).',
    });
  }

  const stripe = getStripe();
  const defaultProdUrl = 'https://arontaxioslo.no';
  let baseUrl = defaultProdUrl;

  if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
    baseUrl = process.env.APP_URL.replace(/\/$/, '');
  } else if (originHeader && typeof originHeader === 'string') {
    const origin = originHeader.trim();
    if (!origin.includes('localhost') && !origin.includes('workers.dev')) {
      baseUrl = origin.replace(/\/$/, '');
    }
  }

  // Security check: Validate against Firestore if available
  let validatedAmount = amount;
  try {
    const fetchTripPromise = getDoc(doc(serverDb, 'trips', tripId));
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
    const tripSnap: any = await Promise.race([fetchTripPromise, timeoutPromise]);
    if (tripSnap && tripSnap.exists && tripSnap.exists()) {
      const storedTrip = tripSnap.data();
      if (storedTrip.estimatedPrice && typeof storedTrip.estimatedPrice === 'number' && storedTrip.estimatedPrice > 0) {
        validatedAmount = storedTrip.estimatedPrice;
      }
    }
  } catch (dbErr) {
    console.warn('[Stripe Handler] Firestore trip lookup note:', dbErr);
  }

  const tierNameMap: Record<string, string> = {
    vip_black: 'Aron Black VIP Executive',
    comfort_eco: 'Aron Comfort Electric',
    airport_vip: 'Aron Airport VIP Shuttle',
  };

  const lineItemDescription = `Aron Taxi Oslo: ${pickupAddress || 'Start'} ➔ ${destinationAddress || 'Mål'} (${distanceKm || '—'} km, ${durationMinutes || '—'} min)`;
  const cleanPickup = (pickupAddress || '').slice(0, 450);
  const cleanDest = (destinationAddress || '').slice(0, 450);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: customerEmail || undefined,
    client_reference_id: tripId,
    line_items: [
      {
        price_data: {
          currency: 'nok',
          product_data: {
            name: tierNameMap[vehicleTier] || 'Aron Taxi VIP Transport',
            description: lineItemDescription.slice(0, 500),
            metadata: {
              tripId,
              pickupAddress: cleanPickup,
              destinationAddress: cleanDest,
            },
          },
          unit_amount: Math.round(validatedAmount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      tripId,
      customerId: customerId || '',
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      customerEmail: customerEmail || '',
      vehicleTier: vehicleTier || 'vip_black',
      distanceKm: distanceKm ? String(distanceKm) : '',
      durationMinutes: durationMinutes ? String(durationMinutes) : '',
      passengers: passengers ? String(passengers) : '1',
      couponCode: couponCode || '',
    },
    success_url: `${baseUrl}/betaling/suksess?session_id={CHECKOUT_SESSION_ID}&trip_id=${encodeURIComponent(
      tripId
    )}`,
    cancel_url: `${baseUrl}/betaling/avbrutt?trip_id=${encodeURIComponent(
      tripId
    )}`,
  });

  // Update trip asynchronously
  updateTripInFirestore(tripId, {
    paymentStatus: 'pending_payment',
    stripeSessionId: session.id,
    paymentMethod: 'stripe',
  }).catch((e) => console.warn('[Stripe Handler] Async Firestore note:', e));

  console.log(`[Stripe Handler] ✅ Checkout Session opprettet for tur ${tripId}: ${session.id}`);

  return sendJson(res, 200, {
    success: true,
    url: session.url,
    sessionId: session.id,
  });
}

export async function handleVerifySession(sessionId: string, tripIdParam: string | undefined, res: ServerResponse) {
  if (!sessionId) {
    return sendJson(res, 400, { error: 'MISSING_SESSION_ID', message: 'Mangler session_id parameter.' });
  }

  if (!isStripeConfigured()) {
    return sendJson(res, 503, { error: 'STRIPE_NOT_CONFIGURED', message: 'Stripe er ikke konfigurert på serveren.' });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'line_items'],
  });

  const isPaid = session.payment_status === 'paid';
  const targetTripId = session.client_reference_id || session.metadata?.tripId || tripIdParam;
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as any)?.id;

  if (isPaid && targetTripId) {
    await updateTripInFirestore(targetTripId, {
      paymentStatus: 'paid',
      stripeSessionId: session.id,
      paymentIntentId: paymentIntentId || undefined,
      paidAt: new Date().toISOString(),
      paymentMethod: 'stripe',
      status: 'confirmed',
    });
    console.log(`[Stripe Handler] ✅ Tur ${targetTripId} verifisert som BETALT (paid / confirmed).`);
  }

  return sendJson(res, 200, {
    success: true,
    isPaid,
    paymentStatus: session.payment_status,
    tripId: targetTripId || null,
    amountTotal: session.amount_total ? session.amount_total / 100 : null,
    currency: session.currency?.toUpperCase() || 'NOK',
    customerEmail: session.customer_details?.email || session.customer_email || null,
    paymentIntentId: paymentIntentId || null,
  });
}
