import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import {
  getStripe,
  isStripeConfigured,
  getStripeMode,
  updateTripInFirestore,
  serverDb,
} from './src/server/stripeService';
import { doc, getDoc } from 'firebase/firestore';

const app = express();
const PORT = 3000;

// Enable CORS for all origins (production domain, previews, mobile clients)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, stripe-signature');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 1. RAW BODY PARSER FOR STRIPE WEBHOOK (Must precede express.json())
app.use(
  ['/api/stripe/webhook', '/api/stripe-webhook'],
  express.raw({ type: 'application/json' })
);

// 2. STANDARD JSON BODY PARSER FOR OTHER API ROUTES
app.use(express.json());

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Aron Taxi Norway API',
    stripeConfigured: isStripeConfigured(),
    mode: getStripeMode(),
    timestamp: new Date().toISOString(),
  });
});

// Stripe Configuration Status (Safe public metadata)
app.get('/api/stripe-config', (_req: Request, res: Response) => {
  res.json({
    isConfigured: isStripeConfigured(),
    mode: getStripeMode(),
    publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    message: isStripeConfigured()
      ? `Stripe er tilkoblet (${getStripeMode() === 'live' ? 'Produksjon' : 'Testmodus'}).`
      : 'Stripe Secret Key mangler. Legg til STRIPE_SECRET_KEY i miljøvariabler/Secrets for å aktivere kortbetaling.',
  });
});

// 3. CREATE STRIPE CHECKOUT SESSION
app.post('/api/create-checkout-session', async (req: Request, res: Response) => {
  console.log('[Stripe Server] 📥 Mottok /api/create-checkout-session:', {
    tripId: req.body?.tripId,
    amount: req.body?.amount,
    customerName: req.body?.customerName,
  });

  try {
    if (!isStripeConfigured()) {
      console.warn('[Stripe Server] ⚠️ STRIPE_SECRET_KEY mangler i Secrets/miljøvariabler.');
      return res.status(503).json({
        error: 'STRIPE_NOT_CONFIGURED',
        message:
          'Stripe er ikke konfigurert på serveren ennå. Vennligst legg inn STRIPE_SECRET_KEY i Secrets/miljøvariabler for Aron Taxi.',
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
    } = req.body;

    if (!tripId || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'INVALID_PARAMETERS',
        message: 'Mangler påkrevde parametere: tripId og gyldig beløp (amount i NOK).',
      });
    }

    // Production domain is https://arontaxioslo.no
    const defaultProdUrl = 'https://arontaxioslo.no';
    
    // In dev / preview environments, support host headers if provided, otherwise default to production domain
    let baseUrl = defaultProdUrl;
    if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
      baseUrl = process.env.APP_URL.replace(/\/$/, '');
    } else if (req.headers.origin && typeof req.headers.origin === 'string') {
      const origin = req.headers.origin.trim();
      if (!origin.includes('localhost') && !origin.includes('workers.dev')) {
        baseUrl = origin.replace(/\/$/, '');
      }
    }

    // Security check: Validate amount against stored trip if it exists (with fast timeout)
    let validatedAmount = amount;
    try {
      const fetchTripPromise = getDoc(doc(serverDb, 'trips', tripId));
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
      const tripSnap: any = await Promise.race([fetchTripPromise, timeoutPromise]);
      if (tripSnap && typeof tripSnap.exists === 'function' && tripSnap.exists()) {
        const storedTrip = tripSnap.data();
        if (storedTrip?.estimatedPrice && typeof storedTrip.estimatedPrice === 'number' && storedTrip.estimatedPrice > 0) {
          validatedAmount = storedTrip.estimatedPrice;
          console.log(`[Stripe Backend] 🔒 Server validerte beløp mot Firestore: ${validatedAmount} NOK`);
        }
      }
    } catch (dbErr: any) {
      // Non-blocking fallback: proceed with client-supplied amount
      console.log(`[Stripe Backend] Tur-validering benytter overført beløp (${amount} NOK)`);
    }

    const tierNameMap: Record<string, string> = {
      vip_black: 'Aron Black VIP Executive',
      comfort_eco: 'Aron Comfort Electric',
      airport_vip: 'Aron Airport VIP Express',
    };
    const tierLabel = tierNameMap[vehicleTier] || 'Aron Taxi VIP';

    const cleanPickup = (pickupAddress || 'Oslo sentrum').slice(0, 100);
    const cleanDest = (destinationAddress || 'Gardermoen / Oslo').slice(0, 100);
    const lineItemDesc = `Taxi fra ${cleanPickup} til ${cleanDest}${distanceKm ? ` (${distanceKm} km)` : ''}`;

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      currency: 'nok',
      customer_email: customerEmail && customerEmail.includes('@') ? customerEmail : undefined,
      client_reference_id: tripId,
      line_items: [
        {
          price_data: {
            currency: 'nok',
            product_data: {
              name: `Aron Taxi Norway · ${tierLabel}`,
              description: lineItemDesc,
              metadata: {
                tripId,
                pickupAddress: cleanPickup,
                destinationAddress: cleanDest,
              },
            },
            unit_amount: Math.round(validatedAmount * 100), // Beløp i øre (NOK * 100)
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
        pickupAddress: cleanPickup,
        destinationAddress: cleanDest,
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

    // Mark trip as pending_payment in Firestore asynchronously
    updateTripInFirestore(tripId, {
      paymentStatus: 'pending_payment',
      stripeSessionId: session.id,
      paymentMethod: 'stripe',
    }).catch((err) => console.warn('[Stripe Backend] Async trip update note:', err));

    console.log(`[Stripe Backend] ✅ Checkout Session opprettet for tur ${tripId}: ${session.id} (URL: ${session.url})`);

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[Stripe Backend] ❌ Feil ved oppretting av checkout session:', error);
    return res.status(500).json({
      error: error?.code || 'STRIPE_SESSION_FAILED',
      message: error?.message || 'Kunne ikke opprette Stripe Checkout Session.',
    });
  }
});

// 4. VERIFY STRIPE CHECKOUT SESSION (Called by frontend on return to confirm with Stripe directly)
app.get('/api/verify-checkout-session', async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.session_id as string;
    const tripId = req.query.trip_id as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Mangler session_id i forespørsel.' });
    }

    if (!isStripeConfigured()) {
      return res.status(503).json({ error: 'Stripe er ikke konfigurert på serveren.' });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    const isPaid = session.payment_status === 'paid';
    const targetTripId = tripId || session.client_reference_id || session.metadata?.tripId || '';

    let paymentIntentId = '';
    if (session.payment_intent) {
      paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id;
    }

    if (isPaid && targetTripId) {
      await updateTripInFirestore(targetTripId, {
        paymentStatus: 'paid',
        stripeSessionId: session.id,
        paymentIntentId: paymentIntentId || undefined,
        paidAt: new Date().toISOString(),
        paymentMethod: 'stripe',
        status: 'confirmed', // Confirmed & ready for driver assignment
      });
      console.log(`[Stripe Backend] ✅ Tur ${targetTripId} verifisert som BETALT (paid / confirmed).`);
    }

    return res.json({
      success: true,
      isPaid,
      sessionStatus: session.status,
      paymentStatus: session.payment_status,
      tripId: targetTripId,
      paymentIntentId,
      amountTotal: session.amount_total ? session.amount_total / 100 : undefined,
      currency: session.currency,
      customerEmail: session.customer_details?.email || session.customer_email,
    });
  } catch (error: any) {
    console.error('[Stripe Backend] ❌ Feil ved verifisering av checkout session:', error?.message || error);
    return res.status(500).json({
      error: 'VERIFICATION_FAILED',
      message: error?.message || 'Feil ved verifisering av Stripe betaling.',
    });
  }
});

// 5. STRIPE WEBHOOK HANDLER (POST /api/stripe/webhook and POST /api/stripe-webhook)
const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret && sig) {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else if (!webhookSecret) {
      console.warn('[Stripe Webhook] ⚠️ STRIPE_WEBHOOK_SECRET mangler i Secrets. Parser webhook-payload i fallback-modus.');
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (Buffer.isBuffer(req.body)) {
        event = JSON.parse(req.body.toString('utf8'));
      }
    } else {
      console.error('[Stripe Webhook] ❌ Mangler stripe-signature header.');
      return res.status(400).send('Missing stripe-signature header');
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] ❌ Signaturfeil under webhook-verifisering: ${err.message}`);
    return res.status(400).send(`Webhook Signature Verification Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] 🔔 Mottatt event: ${event?.type} (ID: ${event?.id || 'ukjent'})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const tripId = session.client_reference_id || session.metadata?.tripId;
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

        if (tripId) {
          await updateTripInFirestore(tripId, {
            paymentStatus: 'paid',
            stripeSessionId: session.id,
            paymentIntentId: paymentIntentId || undefined,
            paidAt: new Date().toISOString(),
            paymentMethod: 'stripe',
            status: 'confirmed', // Sender bekreftet tur til sjåførene
          });
          console.log(`[Stripe Webhook] ✅ Tur ${tripId} markert som BETALT (paid / confirmed) og klargjort for sjåførpool.`);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        const tripId = paymentIntent.metadata?.tripId;
        if (tripId) {
          await updateTripInFirestore(tripId, {
            paymentStatus: 'paid',
            paymentIntentId: paymentIntent.id,
            paidAt: new Date().toISOString(),
            paymentMethod: 'stripe',
          });
          console.log(`[Stripe Webhook] ✅ PaymentIntent lyktes for tur ${tripId}.`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const tripId = paymentIntent.metadata?.tripId;
        if (tripId) {
          await updateTripInFirestore(tripId, {
            paymentStatus: 'payment_failed',
            paymentIntentId: paymentIntent.id,
          });
          console.warn(`[Stripe Webhook] ⚠️ Betaling feilet for tur ${tripId}.`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as any;
        const tripId = session.client_reference_id || session.metadata?.tripId;
        if (tripId) {
          await updateTripInFirestore(tripId, {
            paymentStatus: 'cancelled',
            stripeSessionId: session.id,
          });
          console.log(`[Stripe Webhook] ℹ️ Checkout session utløpt for tur ${tripId}.`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Mottok ubehandlet event: ${event.type}`);
    }

    // Return HTTP 200 to Stripe immediately
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] ❌ Feil under behandling av event:', error?.message || error);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
};

// 5. STRIPE WEBHOOK HANDLER (GET for health check, POST for Stripe events)
app.get(['/api/stripe/webhook', '/api/stripe-webhook'], (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    service: 'Aron Taxi Stripe Webhook Endpoint',
    stripeConfigured: isStripeConfigured(),
    mode: getStripeMode(),
    timestamp: new Date().toISOString(),
    message: 'Stripe Webhook-endepunktet er aktivt og lytter etter POST-hendelser fra Stripe.',
  });
});

app.post(['/api/stripe/webhook', '/api/stripe-webhook'], handleStripeWebhook);

// 6. VITE MIDDLEWARE (DEV) & STATIC FILES (PROD)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚖 Aron Taxi Norway server kjører på port ${PORT}`);
    console.log(`🌐 Hoveddomene: https://arontaxioslo.no`);
    console.log(`🔗 Cloud Run: ${process.env.APP_URL || 'https://ais-pre-2gimjy77jh25l3otwz67wn-220634877794.europe-west1.run.app'}`);
    console.log(`💳 Stripe Status: ${isStripeConfigured() ? `Tilkoblet (${getStripeMode()} mode)` : 'Venter på STRIPE_SECRET_KEY'}`);
  });
}

startServer();
