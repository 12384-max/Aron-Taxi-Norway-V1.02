import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Lock,
  CheckCircle2,
  ShieldCheck,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { createNetsPaymentSession, verifyNetsPayment } from '../../services/netsClient';

interface NetsTestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  amount: number;
  pickupAddress: string;
  destinationAddress: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onPaymentSuccess: (details: {
    paymentId: string;
    paymentMethod: string;
    amount: number;
    maskedCard: string;
    paidAt: string;
  }) => Promise<void>;
}

// Nets Official Standard Test Cards
const NETS_TEST_CARDS = [
  {
    type: 'Visa Test (3DS Approved)',
    number: '4925 0000 0000 0004',
    exp: '12/28',
    cvc: '123',
    brand: 'visa',
    desc: 'Offisielt Nets testkort med 3D Secure / BankID godkjenning',
  },
  {
    type: 'Mastercard Test',
    number: '5100 0000 0000 0000',
    exp: '10/27',
    cvc: '456',
    brand: 'mastercard',
    desc: 'Standard Nets Mastercard testkort',
  },
  {
    type: 'BankAxept / Norsk Bankkort',
    number: '4925 1111 2222 3333',
    exp: '08/29',
    cvc: '789',
    brand: 'bankaxept',
    desc: 'Debetkort / BankAxept testkort',
  },
];

export const NetsTestCheckoutModal: React.FC<NetsTestCheckoutModalProps> = ({
  isOpen,
  onClose,
  tripId,
  amount,
  pickupAddress,
  destinationAddress,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
}) => {
  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);
  const [cardNumber, setCardNumber] = useState<string>(NETS_TEST_CARDS[0].number);
  const [cardExp, setCardExp] = useState<string>(NETS_TEST_CARDS[0].exp);
  const [cardCvc, setCardCvc] = useState<string>(NETS_TEST_CARDS[0].cvc);
  const [cardHolder, setCardHolder] = useState<string>(customerName || 'Ola Nordmann');
  
  const [netsPaymentId, setNetsPaymentId] = useState<string>('');

  // Stages: 'input' -> 'processing' -> '3ds_simulation' -> 'success'
  const [paymentStage, setPaymentStage] = useState<'input' | 'processing' | '3ds_simulation' | 'success'>('input');
  const [copiedCard, setCopiedCard] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPreset = (idx: number) => {
    setSelectedCardIdx(idx);
    const card = NETS_TEST_CARDS[idx];
    setCardNumber(card.number);
    setCardExp(card.exp);
    setCardCvc(card.cvc);
  };

  const handleCopyCard = (num: string) => {
    navigator.clipboard.writeText(num.replace(/\s/g, ''));
    setCopiedCard(true);
    toast.success('Testkortnummer kopiert!');
    setTimeout(() => setCopiedCard(false), 2000);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExp || !cardCvc) {
      toast.error('Vennligst fyll ut alle kortfeltene');
      return;
    }

    setSubmitting(true);
    setPaymentStage('processing');

    try {
      // 1. Call Nets API to create / register test payment session
      const session = await createNetsPaymentSession({
        tripId,
        amount,
        pickupAddress,
        destinationAddress,
        customerName: cardHolder || customerName || 'Gjestekunde',
        customerEmail: customerEmail || 'gjest@arontaxi.no',
        customerPhone: customerPhone || '+47 900 00 000',
      });

      if (session.paymentId) {
        setNetsPaymentId(session.paymentId);
      }

      // Transition to 3D Secure verification step
      setTimeout(() => {
        setPaymentStage('3ds_simulation');
        setSubmitting(false);
      }, 1000);
    } catch (err: any) {
      console.warn('Nets session warning:', err?.message);
      setPaymentStage('3ds_simulation');
      setSubmitting(false);
    }
  };

  const handleApprove3DS = async () => {
    setSubmitting(true);
    setPaymentStage('processing');

    try {
      const paymentId = netsPaymentId || `nets_test_${Date.now()}`;
      const maskedCard = `•••• ${cardNumber.slice(-4)}`;
      const paidAt = new Date().toISOString();

      // Verify payment with Nets backend verification endpoint
      await verifyNetsPayment(paymentId, tripId);

      await onPaymentSuccess({
        paymentId,
        paymentMethod: 'nets_card',
        amount,
        maskedCard,
        paidAt,
      });

      setPaymentStage('success');
      toast.success('✅ Betaling godkjent i Nets testmiljø!');
    } catch (err: any) {
      toast.error('Kunne ikke fullføre bestilling: ' + (err?.message || 'Ukjent feil'));
      setPaymentStage('input');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F1420] border-2 border-[#D4AF37]/60 rounded-3xl shadow-2xl overflow-hidden text-white font-sans">
        
        {/* TOP BAR / NETS HEADER */}
        <div className="bg-gradient-to-r from-[#172033] via-[#101524] to-[#172033] px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#002D72] flex items-center justify-center font-black text-white text-xs tracking-tighter border border-white/20 shadow-md">
              nets:
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-wide">Nets Easy Checkout</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-black uppercase">
                  Testmiljø
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Nexi / Nets Group · Sikker kortbetaling</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting && paymentStage === 'processing'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NOTICE: TEST ENVIRONMENT (INGEN EKTE PENGER) */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="leading-snug">
            <strong>Testmodus aktiv:</strong> Ingen ekte penger trekkes. Bruk ett av de forhåndsdefinerte Nets testkortene nedenfor.
          </span>
        </div>

        {/* STAGE 1: CARD INPUT */}
        {paymentStage === 'input' && (
          <div className="p-6 space-y-5">
            {/* ORDER SUMMARY */}
            <div className="bg-[#161D2E] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tur-detaljer</span>
                <p className="text-xs text-white font-semibold truncate">{pickupAddress} → {destinationAddress}</p>
                <p className="text-[11px] text-slate-400">{customerName} · {customerPhone}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Å betale</span>
                <span className="text-xl font-black text-[#D4AF37] font-mono">{amount} NOK</span>
              </div>
            </div>

            {/* PRESET TEST CARDS SELECTOR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Velg Nets Testkort
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Klikk for å fylle ut</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {NETS_TEST_CARDS.map((c, i) => (
                  <button
                    key={c.type}
                    type="button"
                    onClick={() => handleSelectPreset(i)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedCardIdx === i
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md'
                        : 'bg-[#141A29] border-white/10 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className={`w-4 h-4 ${selectedCardIdx === i ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{c.type}</span>
                          <span className="font-mono text-[11px] text-slate-400">({c.number})</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{c.desc}</p>
                      </div>
                    </div>

                    {selectedCardIdx === i && (
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* CARD FORM */}
            <form onSubmit={handleProcessPayment} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Kortnummer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4925 0000 0000 0004"
                    className="w-full px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyCard(cardNumber)}
                    title="Kopier testkortnummer"
                    className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-white"
                  >
                    {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Utløp (MM/ÅÅ)
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="12/28"
                    className="w-full px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="text"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Kortholders navn
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Ola Nordmann"
                  className="w-full px-3.5 py-2.5 bg-[#090D16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#C5A028] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>BETAL KR {amount} MED NETS TEST</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-1 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  PCI-DSS Level 1
                </span>
                <span>•</span>
                <span>BankID / 3-D Secure</span>
                <span>•</span>
                <span>Nets Easy Sandbox</span>
              </div>
            </form>
          </div>
        )}

        {/* STAGE 2: PROCESSING */}
        {paymentStage === 'processing' && (
          <div className="p-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-14 h-14 rounded-full border-4 border-t-[#D4AF37] border-white/10 animate-spin" />
            <div>
              <h4 className="text-base font-bold text-white">Kobler til Nets Easy Testmiljø...</h4>
              <p className="text-xs text-slate-400 mt-1">Autoriserer testtransaksjon på {amount} NOK</p>
            </div>
          </div>
        )}

        {/* STAGE 3: 3D SECURE / BANKID TEST SIMULATOR */}
        {paymentStage === '3ds_simulation' && (
          <div className="p-6 space-y-5 animate-in fade-in">
            <div className="bg-[#172033] border-2 border-cyan-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-[10px]">
                    BankID
                  </div>
                  <span className="text-xs font-bold text-white">3-D Secure Testverifisering</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300">Nets Verified</span>
              </div>

              <p className="text-xs text-slate-300">
                Bekreft betalingen på <strong>{amount} NOK</strong> til <strong>Aron Taxi Oslo</strong> med din BankID testkode.
              </p>

              <div className="bg-black/40 p-3 rounded-xl border border-white/10 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Kortnummer:</span>
                  <span className="font-mono text-white">•••• {cardNumber.slice(-4)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Kjøpmann:</span>
                  <span className="text-white">Aron Taxi Norway AS</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Beløp:</span>
                  <span className="font-bold text-[#D4AF37] font-mono">{amount} NOK</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentStage('input')}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleApprove3DS}
                disabled={submitting}
                className="flex-2 py-3 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>GODKJENN BETALING ({amount} NOK)</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: SUCCESS */}
        {paymentStage === 'success' && (
          <div className="p-8 flex flex-col items-center justify-center space-y-4 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">Betaling godkjent i Nets testmiljø!</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-sm">
                Beløpet på <strong>{amount} NOK</strong> er autorisert. Bestillingen er nå sendt direkte til sjåfør-dashboardet.
              </p>
            </div>
            <div className="p-3 bg-[#151C2B] rounded-xl border border-white/10 text-xs text-slate-300 w-full font-mono">
              Status: <span className="text-emerald-400 font-bold">BETALT (Nets Easy)</span> • Transaksjon: #{tripId.slice(-6)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
