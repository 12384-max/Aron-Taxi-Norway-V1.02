import Stripe from 'stripe';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let stripeClient: Stripe | null = null;

/**
 * Lazy initialization of Stripe client.
 * Fails gracefully if STRIPE_SECRET_KEY is not configured yet.
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY er ikke konfigurert i miljøvariabler/Secrets. Vennligst legg inn din Stripe Secret Key i Secrets-panelet.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });
  }

  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim().length > 5);
}

export function getStripeMode(): 'live' | 'test' {
  const key = process.env.STRIPE_SECRET_KEY || '';
  return key.startsWith('sk_live') ? 'live' : 'test';
}

// Server-side Firestore initialization
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const serverDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

export interface TripPaymentUpdate {
  paymentStatus: 'paid' | 'payment_failed' | 'cancelled' | 'pending_payment';
  stripeSessionId?: string;
  paymentIntentId?: string;
  paidAt?: string;
  status?: string;
  paymentMethod?: 'stripe' | 'card' | 'vipps' | 'apple_pay' | 'cash' | 'invoice';
}

/**
 * Updates trip in Firestore upon Stripe webhook or verification
 */
export async function updateTripInFirestore(tripId: string, updates: TripPaymentUpdate) {
  if (!tripId) return;

  try {
    const tripRef = doc(serverDb, 'trips', tripId);
    const snap = await getDoc(tripRef);
    const now = new Date().toISOString();

    if (snap.exists()) {
      const currentData = snap.data();
      const newStatus = updates.status || (currentData.status === 'pending' || currentData.status === 'requested' ? 'requested' : currentData.status);

      await updateDoc(tripRef, {
        ...updates,
        status: newStatus,
        updatedAt: now,
      });
      console.log(`[Stripe Backend] ✅ Firestore trip ${tripId} oppdatert med status: ${updates.paymentStatus}`);
    } else {
      await setDoc(
        tripRef,
        {
          id: tripId,
          tripId,
          ...updates,
          status: updates.status || 'requested',
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
      console.log(`[Stripe Backend] 🆕 Firestore trip ${tripId} opprettet/merged med status: ${updates.paymentStatus}`);
    }
  } catch (error: any) {
    console.error(`[Stripe Backend] ❌ Feil ved oppdatering av tur ${tripId} i Firestore:`, error?.message || error);
  }
}
