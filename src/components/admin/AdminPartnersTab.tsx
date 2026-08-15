import React, { useState } from 'react';
import { CorporatePartner } from '../../types';
import {
  Building2,
  Plus,
  FileText,
  Mail,
  Phone,
  CreditCard,
  CheckCircle2,
  Percent,
  X
} from 'lucide-react';

interface AdminPartnersTabProps {
  partners: CorporatePartner[];
  onCreatePartner: (p: Omit<CorporatePartner, 'id' | 'currentBalance' | 'createdAt'>) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AdminPartnersTab: React.FC<AdminPartnersTabProps> = ({
  partners,
  onCreatePartner,
  showToast
}) => {
  const [showModal, setShowModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [orgNumber, setOrgNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [creditLimit, setCreditLimit] = useState('50000');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'biweekly'>('monthly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !orgNumber) return;

    onCreatePartner({
      companyName,
      orgNumber,
      contactPerson,
      contactEmail,
      contactPhone,
      discountPercent: parseFloat(discountPercent) || 0,
      creditLimit: parseFloat(creditLimit) || 50000,
      billingCycle,
      status: 'active'
    });

    setShowModal(false);
    setCompanyName('');
    setOrgNumber('');
    showToast(`Bedriftsavtale for ${companyName} er opprettet!`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D4AF37]" />
            Bedriftsavtaler & B2B Kredittkontoer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Månedlig samlefaktura, faste rabatter og kredittrammer for hoteller og konsern.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ny Bedriftskunde
        </button>
      </div>

      {/* 2. PARTNERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {partners.map((p) => (
          <div key={p.id} className="bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl hover:border-[#D4AF37]/30 transition-all">
            <div className="flex justify-between items-start pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{p.companyName}</h3>
                  <span className="text-[11px] font-mono text-slate-400">Org.nr: {p.orgNumber}</span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 bg-[#34D186]/15 border border-[#34D186]/30 text-[#34D186] text-[10px] font-black uppercase rounded-full">
                {p.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#0B0F19] p-3.5 rounded-2xl border border-white/5">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Kontaktperson</span>
                <span className="text-white font-medium">{p.contactPerson}</span>
                <span className="text-[10px] text-slate-400 block">{p.contactEmail}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Rabattavtale</span>
                <span className="text-[#D4AF37] font-black text-sm">{p.discountPercent}% Fast Rabatt</span>
                <span className="text-[10px] text-slate-400 block uppercase">Faktura: {p.billingCycle}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Utestående saldo / Kredittgrense:</span>
                <span className="font-mono font-bold text-white">{p.currentBalance.toLocaleString('no-NO')} / {p.creditLimit.toLocaleString('no-NO')} NOK</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#D4AF37] h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.round((p.currentBalance / p.creditLimit) * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/5 text-xs">
              <span className="text-[11px] text-slate-500 font-mono">Tlf: {p.contactPhone}</span>
              
              <button
                onClick={() => showToast(`Samlefaktura generert for ${p.companyName}`, 'success')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                Generer Samlefaktura
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                Opprett Ny Bedriftsavtale
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Firmanavn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Eks. Grand Hotel Oslo"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Org.nummer *</label>
                  <input
                    type="text"
                    required
                    placeholder="999 888 777"
                    value={orgNumber}
                    onChange={(e) => setOrgNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Kontaktperson</label>
                  <input
                    type="text"
                    placeholder="Navn Navnesen"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">E-post</label>
                  <input
                    type="email"
                    placeholder="faktura@firma.no"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="+47 22 00 00 00"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Rabatt (%)</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Kredittgrense (NOK)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#D4AF37] hover:brightness-110 text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg mt-2 cursor-pointer"
              >
                Lagre Bedriftsavtale
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
