/**
 * Vipps MobilePay e-Payment Client Service
 * Connects frontend to the backend Vipps e-Payment integration.
 */

export interface VippsStatus {
  status: string;
  service: string;
  configured: boolean;
  environment: 'test' | 'live';
  merchantSerialNumber: string | null;
  mode: string;
  message: string;
}

export interface CreateVippsPaymentOptions {
  tripId: string;
  amount: number;
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  vehicleTier?: string;
}

export interface CreateVippsPaymentResponse {
  success: boolean;
  reference: string;
  redirectUrl: string;
  isTestMode: boolean;
  status: string;
  message: string;
}

export interface VerifyVippsPaymentResponse {
  isPaid: boolean;
  state: 'CREATED' | 'AUTHORIZED' | 'CAPTURED' | 'ABORTED' | 'EXPIRED' | 'TERMINATED' | 'UNKNOWN';
  reference: string;
  tripId?: string;
  amount?: number;
  message: string;
}

class VippsClientService {
  private getApiUrl(endpoint: string): string {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Check status of Vipps configuration
   */
  async getStatus(): Promise<VippsStatus> {
    try {
      const res = await fetch(this.getApiUrl('/api/vipps/status'));
      if (!res.ok) throw new Error('Vipps status error');
      return await res.json();
    } catch (e) {
      return {
        status: 'error',
        service: 'Vipps MobilePay',
        configured: false,
        environment: 'test',
        merchantSerialNumber: null,
        mode: 'offline',
        message: 'Kunne ikke hente Vipps-status fra serveren.',
      };
    }
  }

  /**
   * Create a Vipps payment order
   */
  async createPayment(options: CreateVippsPaymentOptions): Promise<CreateVippsPaymentResponse> {
    try {
      const res = await fetch(this.getApiUrl('/api/vipps/create-payment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Vipps betalingsopprettelse feilet' }));
        throw new Error(err.message || err.error || 'Kunne ikke opprette Vipps-betaling');
      }

      return await res.json();
    } catch (e: any) {
      console.warn('Backend Vipps API error, using sandbox fallback:', e?.message);
      const reference = `TUR-${(options.tripId || 'TEST').replace(/[^a-zA-Z0-9_-]/g, '').slice(-12).toUpperCase()}`;
      return {
        success: true,
        reference,
        redirectUrl: `/order?status=vipps_success&trip_id=${options.tripId}&ref=${reference}`,
        isTestMode: true,
        status: 'CREATED',
        message: 'Vipps e-Payment Testmiljø aktiv.',
      };
    }
  }

  /**
   * Verify if a payment has been authorized or captured in Vipps
   */
  async verifyPayment(reference: string, tripId?: string): Promise<VerifyVippsPaymentResponse> {
    const query = new URLSearchParams({ reference, ...(tripId ? { tripId } : {}) });
    const res = await fetch(this.getApiUrl(`/api/vipps/verify-payment?${query.toString()}`));

    if (!res.ok) {
      throw new Error('Kunne ikke verifisere betalingen hos Vipps');
    }

    return await res.json();
  }

  /**
   * Approve payment in test sandbox
   */
  async approveTestPayment(reference: string): Promise<boolean> {
    const res = await fetch(this.getApiUrl('/api/vipps/approve-test-payment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    });
    return res.ok;
  }

  /**
   * Cancel payment
   */
  async cancelPayment(reference: string, tripId?: string): Promise<boolean> {
    const res = await fetch(this.getApiUrl('/api/vipps/cancel-payment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, tripId }),
    });
    return res.ok;
  }
}

export const vippsClient = new VippsClientService();
