import React, { useState } from 'react';
import { Coupon } from '../../types';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  Calendar,
  Zap,
  X
} from 'lucide-react';

interface AdminCouponsTabProps {
  coupons: Coupon[];
  onCreateCoupon: (c: Omit<Coupon, 'id' | 'usedCount'>) => void;
  onToggleCoupon: (couponId: string) => void;
  onDeleteCoupon: (couponId: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AdminCouponsTab: React.FC<AdminCouponsTabProps> = ({
  coupons,
  onCreateCoupon,
  onToggleCoupon,
  onDeleteCoupon,
  showToast
}) => {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [maxUses, setMaxUses] = useState('100');
  const [minTripAmount, setMinTripAmount] = useState('200');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('Kampanjerabatt for Aron Taxi');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    onCreateCoupon({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: parseFloat(discountValue) || 10,
      maxUses: parseInt(maxUses) || 100,
      minTripAmount: parseFloat(minTripAmount) || 0,
      expiryDate,
      description,
      isActive: true
    });

    setShowModal(false);
    setCode('');
    showToast(`Rabattkode ${code.toUpperCase()} er nå aktiv!`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#D4AF37]" />
            Rabattkoder & Kampanjestyring
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Opprett prosent- og kronekampanjer for kunder og bedrifter i Oslo.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ny Rabattkode
        </button>
      </div>

      {/* 2. COUPON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.id} className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg hover:border-[#D4AF37]/30 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-lg font-black text-[#D4AF37] tracking-wider block">
                  {c.code}
                </span>
                <span className="text-xs text-white font-bold">
                  {c.discountType === 'percentage' ? `${c.discountValue}% Rabatt` : `${c.discountValue} NOK Rabatt`}
                </span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                  c.isActive
                    ? 'bg-[#34D186]/15 border border-[#34D186]/30 text-[#34D186]'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                }`}
              >
                {c.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {c.isActive ? 'Aktiv' : 'Deaktivert'}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-400 border-t border-white/5 pt-3">
              <div className="flex justify-between">
                <span>Bruk / Grense:</span>
                <span className="font-mono text-slate-200">{c.usedCount} / {c.maxUses}</span>
              </div>
              <div className="flex justify-between">
                <span>Min. turpris:</span>
                <span className="font-mono text-slate-200">{c.minTripAmount} NOK</span>
              </div>
              <div className="flex justify-between">
                <span>Utløpsdato:</span>
                <span className="font-mono text-slate-200">{c.expiryDate}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <button
                onClick={() => onToggleCoupon(c.id)}
                className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                {c.isActive ? 'Deaktiver' : 'Aktiver'}
              </button>

              <button
                onClick={() => onDeleteCoupon(c.id)}
                className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#D4AF37]" />
                Opprett Rabattkode
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Kode *</label>
                <input
                  type="text"
                  required
                  placeholder="Eks. SOMMER2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Type *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value="percentage">Prosent (%)</option>
                    <option value="fixed">Fast Beløp (NOK)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Rabattverdi *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Maks Bruk</label>
                  <input
                    type="number"
                    required
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Utløpsdato</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#D4AF37] hover:brightness-110 text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg mt-2 cursor-pointer"
              >
                Opprett Rabattkode
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
