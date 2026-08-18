import { collection, query, where, orderBy, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { db } from './firebase';
import { Trip } from '../types';

export interface TripQueryFilter {
  customerName?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  status?: string;
  limitCount?: number;
}

export interface TripQueryResult {
  trips: Trip[];
  totalFound: number;
  queryDurationMs: number;
  source: 'firestore' | 'cache' | 'local';
}

/**
 * Queries the trips collection in Firestore efficiently.
 * Supports date-range indexing, status constraints, and customer name filtering.
 */
export async function queryTripsFromFirestore(filters: TripQueryFilter): Promise<TripQueryResult> {
  const startTime = performance.now();
  const tripsRef = collection(db, 'trips');
  
  try {
    const queryConstraints: any[] = [];

    // Date range filter using ISO strings
    if (filters.startDate) {
      const startISO = new Date(`${filters.startDate}T00:00:00.000Z`).toISOString();
      queryConstraints.push(where('createdAt', '>=', startISO));
    }

    if (filters.endDate) {
      const endISO = new Date(`${filters.endDate}T23:59:59.999Z`).toISOString();
      queryConstraints.push(where('createdAt', '<=', endISO));
    }

    // Status filter
    if (filters.status && filters.status !== 'all' && filters.status !== 'active') {
      queryConstraints.push(where('status', '==', filters.status));
    }

    // Order by createdAt desc (if date range is used, createdAt is the range field)
    queryConstraints.push(orderBy('createdAt', 'desc'));

    if (filters.limitCount && filters.limitCount > 0) {
      queryConstraints.push(firestoreLimit(filters.limitCount));
    } else {
      queryConstraints.push(firestoreLimit(100)); // sane default limit for performance
    }

    const q = query(tripsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    let results: Trip[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as Trip);
    });

    // In-memory customer name / generic substring filter if specified
    if (filters.customerName && filters.customerName.trim()) {
      const term = filters.customerName.toLowerCase().trim();
      results = results.filter((t) => {
        const cName = (t.customerName || '').toLowerCase();
        const cPhone = (t.customerPhone || '').toLowerCase();
        const cEmail = (t.customerEmail || '').toLowerCase();
        const tId = (t.id || '').toLowerCase();
        const dName = (t.driverName || '').toLowerCase();
        const pick = (t.pickup?.address || '').toLowerCase();
        const dest = (t.destination?.address || '').toLowerCase();

        return (
          cName.includes(term) ||
          cPhone.includes(term) ||
          cEmail.includes(term) ||
          tId.includes(term) ||
          dName.includes(term) ||
          pick.includes(term) ||
          dest.includes(term)
        );
      });
    }

    // Filter active status if requested
    if (filters.status === 'active') {
      results = results.filter((t) => !['completed', 'cancelled'].includes(t.status));
    }

    const duration = Math.round(performance.now() - startTime);

    return {
      trips: results,
      totalFound: results.length,
      queryDurationMs: duration,
      source: 'firestore'
    };
  } catch (err: any) {
    console.warn('Firestore direct query note:', err.message);

    // Graceful fallback to client storage if offline or firestore unavailable
    const saved = localStorage.getItem('aron_trips');
    let localTrips: Trip[] = saved ? JSON.parse(saved) : [];

    if (filters.startDate) {
      localTrips = localTrips.filter((t) => {
        if (!t.createdAt) return false;
        try {
          return new Date(t.createdAt).toISOString().split('T')[0] >= filters.startDate!;
        } catch {
          return false;
        }
      });
    }
    if (filters.endDate) {
      localTrips = localTrips.filter((t) => {
        if (!t.createdAt) return false;
        try {
          return new Date(t.createdAt).toISOString().split('T')[0] <= filters.endDate!;
        } catch {
          return false;
        }
      });
    }
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        localTrips = localTrips.filter((t) => !['completed', 'cancelled'].includes(t.status));
      } else {
        localTrips = localTrips.filter((t) => t.status === filters.status);
      }
    }
    if (filters.customerName && filters.customerName.trim()) {
      const term = filters.customerName.toLowerCase().trim();
      localTrips = localTrips.filter((t) => 
        (t.customerName || '').toLowerCase().includes(term) ||
        (t.customerPhone || '').toLowerCase().includes(term) ||
        (t.id || '').toLowerCase().includes(term)
      );
    }

    const duration = Math.round(performance.now() - startTime);
    return {
      trips: localTrips,
      totalFound: localTrips.length,
      queryDurationMs: duration,
      source: 'local'
    };
  }
}
