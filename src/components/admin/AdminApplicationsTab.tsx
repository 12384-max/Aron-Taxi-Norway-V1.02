import React, { useState } from 'react';
import { DriverApplication, Vehicle } from '../../types';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Phone,
  Mail,
  User,
  Car,
  Award,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Trash2,
  Eye,
  FileText,
  Building,
  Sparkles
} from 'lucide-react';

interface AdminApplicationsTabProps {
  applications: DriverApplication[];
  vehicles: Vehicle[];
  onApproveApplication: (applicationId: string, options?: { vehicleId?: string; permitNumber?: string; adminNotes?: string }) => Promise<void>;
  onRejectApplication: (applicationId: string, reason?: string) => Promise<void>;
  onDeleteApplication: (applicationId: string) => Promise<void>;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AdminApplicationsTab: React.FC<AdminApplicationsTabProps> = ({
  applications,
  vehicles,
  onApproveApplication,
  onRejectApplication,
  onDeleteApplication,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApp, setSelectedApp] = useState<DriverApplication | null>(null);

  // Approval Modal State
  const [approvalModalApp, setApprovalModalApp] = useState<DriverApplication | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('v1');
  const [assignedPermit, setAssignedPermit] = useState<string>('OS 10597');
  const [adminApprovalNotes, setAdminApprovalNotes] = useState<string>('');
  const [processingAction, setProcessingAction] = useState(false);

  // Rejection Modal State
  const [rejectionModalApp, setRejectionModalApp] = useState<DriverApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Delete Confirm State
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<DriverApplication | null>(null);

  // Filter applications
  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = app.name ? app.name.toLowerCase().includes(q) : false;
      const matchEmail = app.email ? app.email.toLowerCase().includes(q) : false;
      const matchPhone = app.phone ? app.phone.toLowerCase().includes(q) : false;
      const matchPermit = app.permitNumber ? app.permitNumber.toLowerCase().includes(q) : false;
      const matchLicense = app.licenseNumber ? app.licenseNumber.toLowerCase().includes(q) : false;
      const matchPlate = app.vehiclePlate ? app.vehiclePlate.toLowerCase().includes(q) : false;
      if (!matchName && !matchEmail && !matchPhone && !matchPermit && !matchLicense && !matchPlate) {
        return false;
      }
    }
    return true;
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  const handleOpenApprove = (app: DriverApplication) => {
    setApprovalModalApp(app);
    setAssignedPermit(app.permitNumber || 'OS 10597');
    setSelectedVehicleId(app.hasOwnVehicle ? 'own' : 'v1');
    setAdminApprovalNotes('Dokumenter og drosjeløyve verifisert og godkjent av administrasjon.');
  };

  const handleExecuteApproval = async () => {
    if (!approvalModalApp) return;
    setProcessingAction(true);
    try {
      await onApproveApplication(approvalModalApp.id, {
        vehicleId: selectedVehicleId === 'own' ? undefined : selectedVehicleId,
        permitNumber: assignedPermit,
        adminNotes: adminApprovalNotes
      });
      showToast(`Sjåfør ${approvalModalApp.name} er nå godkjent og aktivert!`, 'success');
      setApprovalModalApp(null);
    } catch (e: any) {
      showToast('Kunne ikke godkjenne sjåføren: ' + (e?.message || 'Ukjent feil'), 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleExecuteRejection = async () => {
    if (!rejectionModalApp) return;
    setProcessingAction(true);
    try {
      await onRejectApplication(rejectionModalApp.id, rejectionReason);
      showToast(`Søknaden for ${rejectionModalApp.name} ble avslått.`, 'info');
      setRejectionModalApp(null);
    } catch (e: any) {
      showToast('Kunne ikke avslå søknaden: ' + (e?.message || 'Ukjent feil'), 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmApp) return;
    setProcessingAction(true);
    try {
      await onDeleteApplication(deleteConfirmApp.id);
      showToast(`Søknad fra ${deleteConfirmApp.name} ble slettet.`, 'success');
      setDeleteConfirmApp(null);
    } catch (e: any) {
      showToast('Kunne ikke slette søknad: ' + (e?.message || 'Ukjent feil'), 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* METRICS HEADER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="uppercase font-bold text-[10px] tracking-wider">Totale Søknader</span>
            <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <span className="block font-display text-2xl font-black text-white">{applications.length}</span>
          <span className="text-[10px] text-slate-500 font-medium">Registrerte søkere</span>
        </div>

        <div className="bg-[#111827] border border-amber-500/30 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-amber-400">
            <span className="uppercase font-bold text-[10px] tracking-wider">Venter Godkjenning</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="block font-display text-2xl font-black text-amber-400">{pendingCount}</span>
          <span className="text-[10px] text-amber-500/80 font-medium">Krever admin vurdering</span>
        </div>

        <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="uppercase font-bold text-[10px] tracking-wider">Godkjente Sjåfører</span>
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <span className="block font-display text-2xl font-black text-emerald-400">{approvedCount}</span>
          <span className="text-[10px] text-slate-500 font-medium">Aktive i systemet</span>
        </div>

        <div className="bg-[#111827] border border-rose-500/30 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-rose-400">
            <span className="uppercase font-bold text-[10px] tracking-wider">Avslåtte Søknader</span>
            <X className="w-3.5 h-3.5" />
          </div>
          <span className="block font-display text-2xl font-black text-rose-400">{rejectedCount}</span>
          <span className="text-[10px] text-slate-500 font-medium">Ikke kvalifisert</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-[#111827] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Søk navn, e-post, tlf, løyvenr..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0A0D14] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#34D186]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { key: 'all', label: `Alle (${applications.length})` },
            { key: 'pending', label: `Venter (${pendingCount})`, badge: pendingCount > 0 },
            { key: 'approved', label: `Godkjent (${approvedCount})` },
            { key: 'rejected', label: `Avslått (${rejectedCount})` }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#34D186] text-slate-950 shadow-md shadow-[#34D186]/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* APPLICATIONS LIST */}
      {filteredApps.length === 0 ? (
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-display text-base font-bold text-white">Ingen sjåførsøknader funnet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
            {searchQuery || statusFilter !== 'all'
              ? 'Prøv å endre søk eller filter for å finne søknader.'
              : 'Når nye sjåfører fyller ut søknadsskjemaet på nettsiden, vil de dukke opp her til vurdering og godkjenning.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApps.map((app) => {
            const isPending = app.status === 'pending';
            const isApproved = app.status === 'approved';
            const isRejected = app.status === 'rejected';

            return (
              <div
                key={app.id}
                className={`bg-[#111827] border rounded-2xl p-5 sm:p-6 transition-all space-y-4 shadow-xl ${
                  isPending
                    ? 'border-amber-500/40 hover:border-amber-500/70 shadow-amber-500/5'
                    : isApproved
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : 'border-white/10 hover:border-white/20 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* DRIVER INFO */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : isApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      <User className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-base font-bold text-white">
                          {app.name}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              : isApproved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isPending
                            ? '⏳ Venter Godkjenning'
                            : isApproved
                            ? '✅ Godkjent Sjåfør'
                            : '❌ Avslått'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {app.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <a
                          href={`mailto:${app.email}`}
                          className="hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {app.email}
                        </a>
                        <a
                          href={`tel:${app.phone}`}
                          className="hover:text-[#D4AF37] flex items-center gap-1 transition-colors font-mono"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {app.phone}
                        </a>
                        <span className="flex items-center gap-1 text-slate-400 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Mottatt: {new Date(app.createdAt).toLocaleString('no-NO')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Vis Full Søknad
                    </button>

                    {isPending && (
                      <>
                        <button
                          onClick={() => handleOpenApprove(app)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Godkjenn Sjåfør
                        </button>
                        <button
                          onClick={() => setRejectionModalApp(app)}
                          className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Avslå
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setDeleteConfirmApp(app)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                      title="Slett søknad"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* DETAILS ROW / BADGES */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs">
                  <div className="bg-[#0A0D14] p-2.5 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Førerkort (B):</span>
                    <span className="text-white font-mono font-semibold">{app.licenseNumber || 'Ikke oppgitt'}</span>
                  </div>

                  <div className="bg-[#0A0D14] p-2.5 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Drosjeløyvenummer:</span>
                    <span className="text-[#D4AF37] font-mono font-bold">{app.permitNumber || 'Ikke oppgitt'}</span>
                  </div>

                  <div className="bg-[#0A0D14] p-2.5 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Kjøretøyoppsett:</span>
                    <span className="text-emerald-400 font-semibold truncate block">
                      {app.hasOwnVehicle
                        ? `Egen bil: ${app.vehiclePlate || 'Drosje'}`
                        : 'Aron Flåte (Tesla / Mercedes)'}
                    </span>
                  </div>

                  <div className="bg-[#0A0D14] p-2.5 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Erfaring & Seddel:</span>
                    <span className="text-slate-300">
                      {app.experienceYears || 3} år · {app.hasValidSeddel ? '✅ Kjøreseddel OK' : '⚠️ Uten seddel'}
                    </span>
                  </div>
                </div>

                {/* ADMIN NOTES IF ANY */}
                {app.adminNotes && (
                  <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-300 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Notat fra administrator ({app.reviewedBy || 'Admin'}):</span>
                      {app.reviewedAt && <span>{new Date(app.reviewedAt).toLocaleString('no-NO')}</span>}
                    </div>
                    <p className="italic">{app.adminNotes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVE APPLICATION MODAL */}
      {approvalModalApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Godkjenning av Sjåfør
                </span>
                <h3 className="font-display text-xl font-bold text-white">
                  Godkjenn {approvalModalApp.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Når du godkjenner, aktiveres sjåførkontoen automatisk i systemet og føreren kan logge inn.
                </p>
              </div>
              <button
                onClick={() => setApprovalModalApp(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* VEHICLE ASSIGNMENT */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Tildel Kjøretøy
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="v1">Tesla Model Y Juniper (EP 17891) · Aron Flåtebil</option>
                  <option value="v2">Mercedes-Benz EQE Sedan (EL 98214) · Aron Flåtebil</option>
                  <option value="own">
                    Egen Drosjebil {approvalModalApp.vehiclePlate ? `(${approvalModalApp.vehiclePlate})` : ''}
                  </option>
                </select>
              </div>

              {/* PERMIT NUMBER */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Godkjent Drosjeløyvenummer
                </label>
                <input
                  type="text"
                  value={assignedPermit}
                  onChange={(e) => setAssignedPermit(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* ADMIN APPROVAL NOTES */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Notat / Verifiseringskommentar
                </label>
                <textarea
                  rows={3}
                  value={adminApprovalNotes}
                  onChange={(e) => setAdminApprovalNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="F.eks. Løyve og kjøreseddel kontrollert og funnet i orden..."
                />
              </div>

              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Sjåførkontoen aktiveres umiddelbart
                </div>
                <p className="font-light">
                  Sjåføren kan nå logge inn på <strong>/driver/login</strong> med e-post <strong>{approvalModalApp.email}</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setApprovalModalApp(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleExecuteApproval}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {processingAction ? (
                  <span>Godkjenner...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Fullfør & Godkjenn Sjåfør
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT APPLICATION MODAL */}
      {rejectionModalApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Avslå Søknad
                </span>
                <h3 className="font-display text-xl font-bold text-white">
                  Avslå søknad for {rejectionModalApp.name}
                </h3>
              </div>
              <button
                onClick={() => setRejectionModalApp(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Årsak til avslag (Synlig for admin og i statusoppslag)
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="F.eks. Manglende kjøreseddel, ufullstendig løyvedokumentasjon eller ikke tilstrekkelig kjøreerfaring..."
                className="w-full px-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalApp(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleExecuteRejection}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {processingAction ? 'Behandler...' : 'Bekreft Avslag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL DETAILS INSPECT MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedApp.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : selectedApp.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedApp.status === 'pending'
                    ? '⏳ Venter Godkjenning'
                    : selectedApp.status === 'approved'
                    ? '✅ Godkjent'
                    : '❌ Avslått'}
                </span>
                <h2 className="font-display text-2xl font-bold text-white mt-1">
                  {selectedApp.name}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Søknads-ID: {selectedApp.id} · Innsendt: {new Date(selectedApp.createdAt).toLocaleString('no-NO')}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#0A0D14] p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">E-postadresse:</span>
                <span className="text-white font-mono">{selectedApp.email}</span>
              </div>

              <div className="bg-[#0A0D14] p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Telefonnummer:</span>
                <span className="text-white font-mono">{selectedApp.phone}</span>
              </div>

              <div className="bg-[#0A0D14] p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Førerkortnummer (Klasse B):</span>
                <span className="text-white font-mono">{selectedApp.licenseNumber}</span>
              </div>

              <div className="bg-[#0A0D14] p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Drosjeløyvenummer:</span>
                <span className="text-[#D4AF37] font-mono font-bold">{selectedApp.permitNumber}</span>
              </div>

              <div className="bg-[#0A0D14] p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Sjåførkort / Taksameter ID:</span>
                <span className="text-white font-mono">{selectedApp.driverCardNumber || 'Ikke oppgitt'}</span>
              </div>

              <div className="bg-[#0A0D14] p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Kjøreerfaring:</span>
                <span className="text-white">{selectedApp.experienceYears || 3} år som sjåfør</span>
              </div>

              <div className="sm:col-span-2 bg-[#0A0D14] p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Kjøretøyoppsett:</span>
                <span className="text-emerald-400 font-semibold text-sm">
                  {selectedApp.hasOwnVehicle
                    ? `Egen drosjebil: ${selectedApp.vehicleModel || 'Bil'} (${selectedApp.vehiclePlate || 'Skilt ukjent'})`
                    : 'Aron Taxi Flåtebil (Tesla Model Y Juniper / Mercedes-Benz EQE)'}
                </span>
              </div>

              {selectedApp.notes && (
                <div className="sm:col-span-2 bg-[#0A0D14] p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Søkers egne merknader:</span>
                  <p className="text-slate-300 italic">{selectedApp.notes}</p>
                </div>
              )}

              {selectedApp.adminNotes && (
                <div className="sm:col-span-2 bg-[#0A0D14] p-4 rounded-2xl border border-amber-500/20 space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">Admin kommentar:</span>
                  <p className="text-amber-200">{selectedApp.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-white/10">
              <div className="flex gap-2">
                <a
                  href={`tel:${selectedApp.phone}`}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Ring
                </a>
                <a
                  href={`mailto:${selectedApp.email}`}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                  E-post
                </a>
              </div>

              <div className="flex gap-2">
                {selectedApp.status === 'pending' && (
                  <button
                    onClick={() => {
                      const target = selectedApp;
                      setSelectedApp(null);
                      handleOpenApprove(target);
                    }}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Godkjenn
                  </button>
                )}
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-lg font-bold text-white">Slett søknad?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Er du sikker på at du vil slette søknaden fra <strong>{deleteConfirmApp.name}</strong> ({deleteConfirmApp.email})? Denne handlingen kan ikke angres.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmApp(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleExecuteDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {processingAction ? 'Sletter...' : 'Ja, slett'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
