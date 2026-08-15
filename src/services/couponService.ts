import { Coupon } from '../types';

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'c1',
    code: 'VELKOMMEN2026',
    discountType: 'percentage',
    discountValue: 15,
    maxUses: 500,
    usedCount: 48,
    expiryDate: '2026-12-31',
    isActive: true,
    minTripAmount: 150,
    description: '15% Velkomstrabatt på din neste tur i Oslo'
  },
  {
    id: 'c2',
    code: 'FLYPLASS100',
    discountType: 'fixed',
    discountValue: 100,
    maxUses: 200,
    usedCount: 84,
    expiryDate: '2026-12-31',
    isActive: true,
    minTripAmount: 600,
    description: '100 kr fast avslag på flyplasstransport til/fra Gardermoen'
  },
  {
    id: 'c3',
    code: 'ARONVIP',
    discountType: 'percentage',
    discountValue: 20,
    maxUses: 100,
    usedCount: 19,
    expiryDate: '2026-12-31',
    isActive: true,
    minTripAmount: 250,
    description: '20% Eksklusiv Aron Black VIP-rabatt på alle turer'
  },
  {
    id: 'c4',
    code: 'OSLO10',
    discountType: 'percentage',
    discountValue: 10,
    maxUses: 300,
    usedCount: 65,
    expiryDate: '2026-12-31',
    isActive: true,
    minTripAmount: 150,
    description: '10% Bytakst-rabatt i Stor-Oslo'
  }
];

export const getStoredCoupons = (): Coupon[] => {
  try {
    const raw = localStorage.getItem('aron_admin_coupons');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Feil ved lesing av rabattkoder:', e);
  }
  return DEFAULT_COUPONS;
};

export const saveCoupons = (coupons: Coupon[]) => {
  try {
    localStorage.setItem('aron_admin_coupons', JSON.stringify(coupons));
    window.dispatchEvent(new Event('aron_coupons_updated'));
  } catch (e) {
    console.warn('Feil ved lagring av rabattkoder:', e);
  }
};

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  discountDescription: string;
  errorMessage?: string;
}

export const validateAndCalculateDiscount = (
  rawCode: string,
  basePrice: number,
  isAirport: boolean = false
): CouponValidationResult => {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false, discountAmount: 0, discountDescription: '', errorMessage: 'Vennligst skriv inn en rabattkode.' };
  }

  const cleanCode = rawCode.trim().toUpperCase();
  const allCoupons = getStoredCoupons();
  const found = allCoupons.find((c) => c.code.toUpperCase() === cleanCode);

  if (!found) {
    return {
      valid: false,
      discountAmount: 0,
      discountDescription: '',
      errorMessage: `Rabattkoden «${cleanCode}» er ugyldig eller utløpt.`
    };
  }

  if (!found.isActive) {
    return {
      valid: false,
      discountAmount: 0,
      discountDescription: '',
      errorMessage: `Rabattkoden «${cleanCode}» er for øyeblikket deaktivert.`
    };
  }

  if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
    return {
      valid: false,
      discountAmount: 0,
      discountDescription: '',
      errorMessage: `Rabattkoden «${cleanCode}» utløp den ${found.expiryDate}.`
    };
  }

  if (found.minTripAmount && basePrice < found.minTripAmount) {
    return {
      valid: false,
      discountAmount: 0,
      discountDescription: '',
      errorMessage: `Denne koden krever et minstebeløp på ${found.minTripAmount} NOK (Nåværende pris: ${basePrice} NOK).`
    };
  }

  // Calculate discount
  let discount = 0;
  let desc = '';

  if (found.discountType === 'percentage') {
    discount = Math.round((basePrice * found.discountValue) / 100);
    desc = `${found.discountValue}% rabatt (-${discount} NOK)`;
  } else {
    discount = Math.min(basePrice, found.discountValue);
    desc = `Fast avslag på ${discount} NOK`;
  }

  return {
    valid: true,
    coupon: found,
    discountAmount: discount,
    discountDescription: desc
  };
};
