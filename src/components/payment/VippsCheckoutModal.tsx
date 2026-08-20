import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  X,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { vippsClient, VippsStatus } from '../../services/vippsClient';

interface VippsCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelPayment: () => Promise<void>;
  tripId: string;
  amount: number;
  pickupAddress: string;
  destinationAddress: string;
  customerName: string;
  customerPhone: string;
  onPaymentSuccess: (details: {
    paymentId: string;
    paymentMethod: string;
    amount: number;
    vippsNumber?: string;
    vippsRecipient?: string;
    paidAt: string;
    payerPhone: string;
  }) => Promise<void>;
}

export const VippsCheckoutModal: React.FC<VippsCheckoutModalProps> = ({
  isOpen,
  onClose,
  onCancelPayment,
  tripId,
  amount,
  pickupAddress,
  destinationAddress,
  customerName,
  customerPhone,
  onPaymentSuccess,
}) => {
  const [stage, setStage] = useState<'initiating' | 'awaiting_approval' | 'processing' | 'success' | 'failed'>('initiating');
  const [payerPhone, setPayerPhone] = useState<string>(customerPhone || '');
  const [reference, setReference] = useState<string>('');
  const [isTestMode, setIsTestMode] = useState<boolean>(true);
  const [vippsStatus, setVippsStatus] = useState<VippsStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef<number>(0);

  // Initialize payment on open
  useEffect(() => {
    if (!isOpen || !tripId || amount <= 0) return;

    let isMounted = true;

    async function initPayment() {
      setStage('initiating');
      setErrorMessage('');
      pollCountRef.current = 0;

      try {
        const [status, payment] = await Promise.all([
          vippsClient.getStatus(),
          vippsClient.createPayment({
            tripId,
            amount,
            customerPhone: customerPhone || '+47 90000000',
            customerName: customerName || 'Kunde',
            pickupAddress,
            destinationAddress,
          })
        ]);

        if (!isMounted) return;

        setVippsStatus(status);
        setReference(payment.reference);
        setIsTestMode(payment.isTestMode);
        setRedirectUrl(payment.redirectUrl);
        setStage('awaiting_approval');

        // Start polling for payment verification
        startPolling(payment.reference);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Vipps initialization error:', err);
        setErrorMessage(err?.message || 'Kunne ikke opprette Vipps-betalingsordre.');
        setStage('failed');
      }
    }

    initPayment();

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [isOpen, tripId, amount]);

  const startPolling = (ref: string) => {
    stopPolling();
    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      // Stop polling after 5 minutes (120 checks * 2.5s)
      if (pollCountRef.current > 120) {
        stopPolling();
        setErrorMessage('Betalingsforespørselen utløp på tid. Prøv igjen.');
        setStage('failed');
        return;
      }

      try {
        const verify = await vippsClient.verifyPayment(ref, tripId);
        if (verify.isPaid || verify.state === 'AUTHORIZED' || verify.state === 'CAPTURED') {
          stopPolling();
          handleSuccess(ref);
        } else if (verify.state === 'ABORTED' || verify.state === 'EXPIRED' || verify.state === 'TERMINATED') {
          stopPolling();
          setErrorMessage('Betalingen ble avbrutt eller avvist i Vipps.');
          setStage('failed');
        }
      } catch (e) {
        // Polling retry
      }
    }, 2500);
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleSuccess = async (ref: string) => {
    setStage('success');
    setIsSubmitting(false);

    try {
      await onPaymentSuccess({
        paymentId: ref,
        paymentMethod: 'vipps',
        amount,
        vippsNumber: vippsStatus?.merchantSerialNumber || '97323339',
        vippsRecipient: 'Aron Taxi Oslo',
        paidAt: new Date().toISOString(),
        payerPhone: payerPhone || customerPhone,
      });
      toast.success('🎉 Vipps-betaling godkjent! Turen er bekreftet.');
    } catch (e) {
      console.warn('Payment success callback notice:', e);
    }
  };

  // Test mode approval (Simulates customer authorizing in Vipps app)
  const handleApproveTestMode = async () => {
    if (!reference) return;
    setIsSubmitting(true);
    setStage('processing');

    try {
      await vippsClient.approveTestPayment(reference);
      await new Promise(r => setTimeout(r, 1000));
      stopPolling();
      await handleSuccess(reference);
    } catch (err: any) {
      toast.error('Godkjenning feilet: ' + (err?.message || 'Ukjent feil'));
      setStage('awaiting_approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel payment and delete unbooked trip
  const handleCancel = async () => {
    stopPolling();
    setIsSubmitting(true);

    try {
      if (reference) {
        await vippsClient.cancelPayment(reference, tripId);
      }
      await onCancelPayment();
      toast.info('Vipps-betalingen ble avbrutt. Ingen tur ble bestilt.');
    } catch (err) {
      console.warn('Cancellation error:', err);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleCopyRef = () => {
    if (!reference) return;
    navigator.clipboard.writeText(reference);
    setCopiedRef(true);
    toast.success('Referanse kopiert!');
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleOpenVippsApp = () => {
    if (redirectUrl && !redirectUrl.includes('/order?status=')) {
      window.location.href = redirectUrl;
    } else {
      window.location.href = 'vipps://';
    }
    toast.info('Åpner Vipps på din enhet...');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#0F1420] border-2 border-[#FF5B24] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-white font-sans my-auto relative"
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#FF5B24] to-[#E04B18] px-5 py-4 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0">
                <Smartphone className="w-5 h-5 text-[#FF5B24]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                    Vipps e-Payment
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-black/25 text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                    {isTestMode ? 'Testmiljø' : 'Offisiell API'}
                  </span>
                </div>
                <p className="text-[11px] text-white/90 font-medium">
                  Aron Taxi Norway · Sikker forhåndsbetaling
                </p>
              </div>
            </div>

            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer disabled:opacity-40"
              title="Avbryt og lukk"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* UNPAID BANNER */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Bestillingen låses og sendes <strong>kun ved godkjent betaling</strong>.</span>
            </span>
            <span className="font-mono font-bold text-amber-400">{amount} NOK</span>
          </div>

          {/* STAGE 0: INITIATING */}
          {stage === 'initiating' && (
            <div className="p-10 flex flex-col items-center justify-center space-y-4 text-center">
              <RefreshCw className="w-10 h-10 text-[#FF5B24] animate-spin" />
              <div>
                <h4 className="text-base font-bold text-white">Oppretter Vipps-betaling...</h4>
                <p className="text-xs text-slate-400 mt-1">Kobler til Vipps e-Payment API for {amount} NOK</p>
              </div>
            </div>
          )}

          {/* STAGE 1: AWAITING APPROVAL IN VIPPS */}
          {stage === 'awaiting_approval' && (
            <div className="p-5 sm:p-6 space-y-4 animate-in fade-in">
              {/* TRIP SUMMARY */}
              <div className="bg-[#161D2E] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Rute</span>
                  <p className="text-xs text-white font-semibold truncate">
                    {pickupAddress.split(',')[0]} ➔ {destinationAddress.split(',')[0]}
                  </p>
                  <p className="text-[11px] text-slate-400">{customerName || 'Gjest'} · Ref: {reference}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fastpris</span>
                  <span className="text-lg font-black text-[#FF5B24] font-mono">{amount} NOK</span>
                </div>
              </div>

              {/* PULSING APPROVAL BOX */}
              <div className="bg-gradient-to-b from-[#182133] to-[#121824] border-2 border-[#FF5B24]/40 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FF5B24]/20 border border-[#FF5B24] flex items-center justify-center text-[#FF5B24] relative animate-pulse">
                  <Smartphone className="w-7 h-7" />
                </div>

                <div>
                  <h4 className="text-base font-black text-white">
                    Venter på bekreftelse i Vipps...
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Åpne Vipps på telefonen din og godkjenn betalingen på <strong className="text-[#FF5B24] font-mono">{amount} NOK</strong>.
                  </p>
                </div>

                {/* DETAILS BOX */}
                <div className="bg-black/50 p-3 rounded-xl border border-white/10 text-xs space-y-2 text-left">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Mottaker:</span>
                    <span className="font-bold text-white">Aron Taxi Norway</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Ordre-referanse:</span>
                    <div className="flex items-center gap-1.5 font-mono text-white">
                      <span>{reference}</span>
                      <button
                        type="button"
                        onClick={handleCopyRef}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        title="Kopier"
                      >
                        {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 border-t border-white/10 pt-1.5">
                    <span>Beløp å betale:</span>
                    <span className="font-mono text-base font-black text-[#FF5B24]">{amount} NOK</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenVippsApp}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-[#FF5B24]" />
                  <span>Åpne Vipps-appen på denne enheten</span>
                </button>

                {/* TEST MODE / SANDBOX SIMULATION BUTTON */}
                {isTestMode && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleApproveTestMode}
                    className="w-full py-3.5 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>GODKJENN BETALING I TESTMILJØ ({amount} NOK)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Avbryt betaling (turen bestilles IKKE)
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Automatisk avvisning: Ubetalte turer forkastes av systemet</span>
              </div>
            </div>
          )}

          {/* STAGE 2: PROCESSING */}
          {stage === 'processing' && (
            <div className="p-10 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in">
              <div className="w-14 h-14 rounded-full border-4 border-t-[#FF5B24] border-white/10 animate-spin" />
              <div>
                <h4 className="text-base font-bold text-white">Bekrefter Vipps-betaling...</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Autoriserer {amount} NOK hos Vipps MobilePay
                </p>
              </div>
            </div>
          )}

          {/* STAGE 3: SUCCESS */}
          {stage === 'success' && (
            <div className="p-8 flex flex-col items-center justify-center space-y-4 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Vipps-betaling godkjent!</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm">
                  Beløpet på <strong>{amount} NOK</strong> er reservert og godkjent. Turen er nå bekreftet og sendt direkte til ledige sjåfører.
                </p>
              </div>
              <div className="p-3 bg-[#151C2B] rounded-xl border border-white/10 text-xs text-slate-300 w-full font-mono">
                Status: <span className="text-emerald-400 font-bold">BETALT & BEKREFTET</span> • Ref: {reference}
              </div>
            </div>
          )}

          {/* STAGE 4: FAILED */}
          {stage === 'failed' && (
            <div className="p-6 space-y-4 text-center animate-in fade-in">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 text-red-400 border-2 border-red-500 flex items-center justify-center">
                <X className="w-7 h-7 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Betalingen ble ikke fullført</h4>
                <p className="text-xs text-slate-300 mt-1">
                  {errorMessage || 'Betalingen ble avbrutt eller avvist. Ingen tur er bestilt.'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Gå tilbake til bestilling
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
