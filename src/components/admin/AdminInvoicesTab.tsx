import React, { useState } from 'react';
import { Trip, Invoice } from '../../types';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Plus,
  Printer,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Building,
  User,
  Calendar,
  X,
  CreditCard,
  Send
} from 'lucide-react';

interface AdminInvoicesTabProps {
  trips: Trip[];
  invoices: Invoice[];
  onCreateInvoice: (inv: Omit<Invoice, 'id'>) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: Invoice['status']) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AdminInvoicesTab: React.FC<AdminInvoicesTabProps> = ({
  trips,
  invoices,
  onCreateInvoice,
  onUpdateInvoiceStatus,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue' | 'credited'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);

  // New Invoice Form state
  const [newInvCustomerName, setNewInvCustomerName] = useState('');
  const [newInvCustomerEmail, setNewInvCustomerEmail] = useState('');
  const [newInvCustomerPhone, setNewInvCustomerPhone] = useState('+47 900 00 000');
  const [newInvCustomerOrg, setNewInvCustomerOrg] = useState('');
  const [newInvPickup, setNewInvPickup] = useState('Oslo S, Jernbanetorget');
  const [newInvDest, setNewInvDest] = useState('Oslo Lufthavn Gardermoen');
  const [newInvAmount, setNewInvAmount] = useState('1490');
  const [newInvVatRate, setNewInvVatRate] = useState<number>(12);
  const [newInvDescription, setNewInvDescription] = useState('Persontransport og bedriftskjøring Oslo');
  const [newInvDueDate, setNewInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerEmail && inv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.companyName && inv.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.kidNumber && inv.kidNumber.includes(searchQuery));
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidInvoiced = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const unpaidInvoiced = invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalMva = invoices.reduce((sum, inv) => sum + inv.vatAmount, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(newInvAmount) || 0;
    const vatRateDecimal = newInvVatRate / 100;
    const net = Math.round(total / (1 + vatRateDecimal));
    const vat = total - net;
    const invId = `FAKT-2026-${1000 + invoices.length + 1}`;
    const kid = `2026${Date.now().toString().slice(-6)}`;

    onCreateInvoice({
      customerName: newInvCustomerName,
      customerEmail: newInvCustomerEmail,
      customerPhone: newInvCustomerPhone,
      companyName: newInvCustomerOrg ? newInvCustomerName : undefined,
      orgNumber: newInvCustomerOrg || undefined,
      kidNumber: kid,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newInvDueDate,
      pickupAddress: newInvPickup,
      destinationAddress: newInvDest,
      distanceKm: 48,
      durationMinutes: 35,
      vehiclePlate: 'EK 88201',
      permitNumber: 'OS 10597',
      amountExVat: net,
      vatRate: newInvVatRate,
      vatAmount: vat,
      totalAmount: total,
      status: 'unpaid',
      paymentMethod: 'invoice',
      notes: newInvDescription
    });

    setShowNewInvoiceModal(false);
    showToast(`Faktura ${invId} opprettet med KID ${kid}!`, 'success');
  };

  const handleSendEmail = (inv: Invoice) => {
    showToast(`Faktura ${inv.id} er sendt på e-post til ${inv.customerEmail || inv.customerName}!`, 'success');
  };

  const exportInvoicesToCSV = () => {
    if (filteredInvoices.length === 0) {
      showToast('Ingen fakturaer å eksportere.', 'warning');
      return;
    }

    const headers = ['FakturaID', 'Kunde', 'E-post', 'Org.nr', 'Utstedt', 'Forfall', 'KID', 'Status', 'Netto', 'MVA', 'Total (NOK)'];
    const rows = filteredInvoices.map(i => [
      `"${i.id}"`,
      `"${(i.customerName || '').replace(/"/g, '""')}"`,
      `"${i.customerEmail || ''}"`,
      `"${i.orgNumber || ''}"`,
      `"${i.issueDate}"`,
      `"${i.dueDate}"`,
      `"${i.kidNumber || ''}"`,
      `"${i.status}"`,
      `"${i.amountExVat}"`,
      `"${i.vatAmount}"`,
      `"${i.totalAmount}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AronTaxi_Fakturaer_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Fakturarapport lastet ned som CSV.', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#D4AF37]" />
            Fakturasystem & E-Wallet
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatisk KID-generering, 12% og 25% MVA-beregning, bedriftsfakturaer og sjåføroppgjør.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={exportInvoicesToCSV}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Eksporter CSV
          </button>

          <button
            onClick={() => setShowNewInvoiceModal(true)}
            className="px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Opprett Faktura
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Fakturert</span>
          <div className="text-2xl font-black text-white font-mono">{totalInvoiced.toLocaleString('no-NO')} kr</div>
          <span className="text-[11px] text-slate-500 font-medium">{invoices.length} fakturaer utstedt</span>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-[#34D186]">Innbetalt (Betalt)</span>
          <div className="text-2xl font-black text-[#34D186] font-mono">{paidInvoiced.toLocaleString('no-NO')} kr</div>
          <span className="text-[11px] text-slate-500 font-medium">{invoices.filter(i => i.status === 'paid').length} oppgjorte</span>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-amber-400">Utestående / Forfall</span>
          <div className="text-2xl font-black text-amber-400 font-mono">{unpaidInvoiced.toLocaleString('no-NO')} kr</div>
          <span className="text-[11px] text-slate-500 font-medium">{invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length} venter</span>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-blue-400">Innkrevd MVA (12%/25%)</span>
          <div className="text-2xl font-black text-blue-400 font-mono">{totalMva.toLocaleString('no-NO')} kr</div>
          <span className="text-[11px] text-slate-500 font-medium">Beregnet avgift</span>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTER BAR */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 shadow-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Søk på fakturanummer, kundenavn, e-post, org.nr eller KID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'paid', 'unpaid', 'overdue', 'credited'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer uppercase ${
                statusFilter === st
                  ? 'bg-[#D4AF37] text-slate-950 font-black shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'Alle' : st === 'paid' ? 'Betalt' : st === 'unpaid' ? 'Utestående' : st === 'overdue' ? 'Purring' : 'Kreditert'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. INVOICES TABLE */}
      <div className="bg-[#111827] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="p-4">Fakturanr</th>
                <th className="p-4">Kunde / Bedrift</th>
                <th className="p-4">Dato & Forfall</th>
                <th className="p-4">KID-nummer</th>
                <th className="p-4">Beløp (inkl. MVA)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-bold text-slate-300">Ingen fakturaer funnet</p>
                    <p className="text-[11px] text-slate-500">Opprett en ny faktura eller endre søkefilteret.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#D4AF37]">
                      {inv.id}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-400">
                        {inv.orgNumber ? `Org: ${inv.orgNumber}` : inv.customerEmail || 'Privatkunde'}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div>Utstedt: {inv.issueDate}</div>
                      <div className="text-[10px] font-bold text-slate-300">Forfall: {inv.dueDate}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {inv.kidNumber || '–'}
                    </td>
                    <td className="p-4">
                      <div className="font-mono font-bold text-white">{inv.totalAmount.toLocaleString('no-NO')} NOK</div>
                      <div className="text-[10px] text-slate-500 font-mono">MVA ({inv.vatRate}%): {inv.vatAmount} NOK</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          inv.status === 'paid'
                            ? 'bg-[#34D186]/15 border border-[#34D186]/30 text-[#34D186]'
                            : inv.status === 'unpaid'
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                            : inv.status === 'overdue'
                            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                            : 'bg-slate-500/15 border border-slate-500/30 text-slate-400'
                        }`}
                      >
                        {inv.status === 'paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {inv.status === 'paid' ? 'Betalt' : inv.status === 'unpaid' ? 'Utestående' : inv.status === 'overdue' ? 'Purring' : 'Kreditert'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          title="Vis / Skriv ut Faktura"
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSendEmail(inv)}
                          title="Send på e-post"
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-[#D4AF37] rounded-lg transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        <select
                          value={inv.status}
                          onChange={(e) => onUpdateInvoiceStatus(inv.id, e.target.value as any)}
                          className="bg-[#0B0F19] border border-white/10 text-[10px] font-bold text-slate-200 rounded-lg px-2 py-1"
                        >
                          <option value="unpaid">Utestående</option>
                          <option value="paid">Merk Betalt</option>
                          <option value="overdue">Send Purring</option>
                          <option value="credited">Krediter</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CREATE NEW INVOICE MODAL */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="font-display text-lg font-black text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#D4AF37]" />
                Opprett Ny Faktura
              </h3>
              <button onClick={() => setShowNewInvoiceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Kundenavn / Firmanavn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Eks. DNB Hovedkontor AS"
                    value={newInvCustomerName}
                    onChange={(e) => setNewInvCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">E-post for Faktura *</label>
                  <input
                    type="email"
                    required
                    placeholder="faktura@kunde.no"
                    value={newInvCustomerEmail}
                    onChange={(e) => setNewInvCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Org.nummer (Valgfritt)</label>
                  <input
                    type="text"
                    placeholder="999 888 777"
                    value={newInvCustomerOrg}
                    onChange={(e) => setNewInvCustomerOrg(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Forfallsdato *</label>
                  <input
                    type="date"
                    required
                    value={newInvDueDate}
                    onChange={(e) => setNewInvDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Hentested</label>
                  <input
                    type="text"
                    value={newInvPickup}
                    onChange={(e) => setNewInvPickup(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Destinasjon</label>
                  <input
                    type="text"
                    value={newInvDest}
                    onChange={(e) => setNewInvDest(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Totalbeløp (NOK inkl. MVA) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newInvAmount}
                    onChange={(e) => setNewInvAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-mono text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">MVA-Sats *</label>
                  <select
                    value={newInvVatRate}
                    onChange={(e) => setNewInvVatRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value={12}>12% MVA (Persontransport / Taxi)</option>
                    <option value={25}>25% MVA (Administrasjon / Tillegg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Beskrivelse / Spesifikasjon</label>
                <textarea
                  rows={2}
                  value={newInvDescription}
                  onChange={(e) => setNewInvDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#D4AF37] hover:brightness-110 text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Opprett Faktura & Generer KID
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. OFFICIAL NORWEGIAN TAX INVOICE PRINT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="font-display text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D4AF37]" />
                Offisiell Norsk Fakturakvittering
              </h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PRINTABLE WHITE CANVAS */}
            <div className="bg-white text-slate-900 p-8 rounded-2xl space-y-6 font-sans text-xs shadow-2xl">
              
              {/* HEADER */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <h1 className="font-black text-xl tracking-tight text-slate-950 uppercase">Aron Taxi Norway AS</h1>
                  <p className="text-slate-500 font-mono text-[11px] mt-0.5">Org.nr: 931 482 109 MVA</p>
                  <p className="text-slate-500 text-[11px]">Dronning Eufemias gate 16, 0191 Oslo</p>
                  <p className="text-slate-500 text-[11px]">post@arontaxi.no · Tlf: +47 96 99 09 01</p>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase tracking-widest font-black text-[#B89020] block">FAKTURA</span>
                  <span className="font-mono text-base font-black text-slate-950">{selectedInvoice.id}</span>
                  <p className="text-slate-500 text-[10px] mt-1">Dato: {selectedInvoice.issueDate}</p>
                </div>
              </div>

              {/* BUYER INFO & PAYMENT SPECS */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Faktureres Til</span>
                  <p className="font-black text-slate-900 text-sm">{selectedInvoice.customerName}</p>
                  {selectedInvoice.orgNumber && (
                    <p className="font-mono text-slate-600">Org.nr: {selectedInvoice.orgNumber}</p>
                  )}
                  {selectedInvoice.customerEmail && (
                    <p className="text-slate-600">{selectedInvoice.customerEmail}</p>
                  )}
                </div>

                <div className="space-y-1 font-mono text-[11px] text-right">
                  <div><strong className="text-slate-500">Forfallsdato:</strong> {selectedInvoice.dueDate}</div>
                  <div><strong className="text-slate-500">KID-nummer:</strong> {selectedInvoice.kidNumber || '2026889900'}</div>
                  <div><strong className="text-slate-500">Bankkonto:</strong> 1503.88.99012</div>
                  <div><strong className="text-slate-500">Betalingsstatus:</strong> <span className="uppercase font-bold text-emerald-700">{selectedInvoice.status}</span></div>
                </div>
              </div>

              {/* ROUTE INFO */}
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Fra:</span>
                  <span className="font-medium text-slate-900">{selectedInvoice.pickupAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Til:</span>
                  <span className="font-medium text-slate-900">{selectedInvoice.destinationAddress}</span>
                </div>
              </div>

              {/* LINE ITEMS TABLE */}
              <div className="space-y-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-500 uppercase text-[10px]">
                      <th className="py-2">Beskrivelse</th>
                      <th className="py-2 text-right">MVA %</th>
                      <th className="py-2 text-right">Eks. MVA</th>
                      <th className="py-2 text-right">Inkl. MVA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr>
                      <td className="py-3 font-sans">
                        <p className="font-bold text-slate-900">{selectedInvoice.notes || 'Persontransport i Oslo-regionen'}</p>
                        <p className="text-[10px] text-slate-500">Aron Taxi Premium Flåte</p>
                      </td>
                      <td className="py-3 text-right">{selectedInvoice.vatRate}%</td>
                      <td className="py-3 text-right">{selectedInvoice.amountExVat} NOK</td>
                      <td className="py-3 text-right font-bold">{selectedInvoice.totalAmount} NOK</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TOTALS CALCULATION */}
              <div className="border-t-2 border-dashed border-slate-300 pt-4 space-y-1.5 font-mono text-right text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Netto beløp eks. MVA:</span>
                  <span>{selectedInvoice.amountExVat} NOK</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>MVA ({selectedInvoice.vatRate}%):</span>
                  <span>{selectedInvoice.vatAmount} NOK</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-300">
                  <span>TOTALT Å BETALE:</span>
                  <span>{selectedInvoice.totalAmount} NOK</span>
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleSendEmail(selectedInvoice)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4 text-[#D4AF37]" />
                Send på E-post
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-[#D4AF37] hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  Skriv ut / Lagre PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Lukk
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
