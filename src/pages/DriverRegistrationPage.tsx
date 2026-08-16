import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useTrips } from '../context/TripContext';
import { OFFICIAL_ASSETS } from '../constants/assets';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  FileCheck,
  Car,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Award,
  CreditCard,
  Building,
  Check,
  Clock,
  HelpCircle,
  ChevronRight,
  FileText
} from 'lucide-react';

export const DriverRegistrationPage: React.FC = () => {
  const { submitDriverApplication, driverApplications } = useTrips();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal info
    name: '',
    email: '',
    phone: '+47 ',
    password: '',
    confirmPassword: '',
    experienceYears: '3',

    // Step 2: Licenses & Permits
    licenseNumber: '',
    permitNumber: '',
    driverCardNumber: '',
    hasValidSeddel: true,
    hasCleanCriminalRecord: true,

    // Step 3: Vehicle setup
    hasOwnVehicle: false,
    vehicleModel: '',
    vehiclePlate: '',
    vehicleYear: new Date().getFullYear().toString(),
    vehicleColor: 'Sort',
    taximeterBrand: 'Semel / Digitax / Cabonline',

    // Step 4: Confirmation & terms
    acceptTerms: false,
    acceptDataProcessing: false,
    notes: ''
  });

  // Track existing application lookup
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    const q = lookupQuery.trim().toLowerCase();
    const found = driverApplications.find(
      (a) =>
        a.id.toLowerCase() === q ||
        a.email.toLowerCase() === q ||
        a.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
    );
    if (found) {
      setLookupResult(found);
    } else {
      setLookupResult('not_found');
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || formData.phone.length < 8) {
        toast.error('Vennligst fyll ut navn, gyldig e-post og telefonnummer');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        toast.error('Passordet må være på minst 6 tegn for din fremtidige sjåførkonto');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passordene stemmer ikke overens');
        return;
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2) {
      if (!formData.licenseNumber.trim()) {
        toast.error('Vennligst oppgi ditt førerkortnummer (Klasse B)');
        return;
      }
      if (!formData.permitNumber.trim()) {
        toast.error('Vennligst oppgi ditt drosjeløyvenummer eller kjøreseddelnummer');
        return;
      }
      if (!formData.hasValidSeddel) {
        toast.error('Gyldig kjøreseddel fra Politiet er et lovkrav for drosjesjåfører i Norge');
        return;
      }
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 3) {
      if (formData.hasOwnVehicle) {
        if (!formData.vehicleModel.trim() || !formData.vehiclePlate.trim()) {
          toast.error('Vennligst oppgi bilmodell og kjennemerke/skiltnummer for din drosjebil');
          return;
        }
      }
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptTerms || !formData.acceptDataProcessing) {
      toast.error('Du må godkjenne vilkårene og egenerklæringen for å sende inn søknaden');
      return;
    }

    setSubmitting(true);

    try {
      const app = await submitDriverApplication({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        licenseNumber: formData.licenseNumber.trim(),
        permitNumber: formData.permitNumber.trim(),
        driverCardNumber: formData.driverCardNumber.trim() || undefined,
        hasOwnVehicle: formData.hasOwnVehicle,
        vehicleModel: formData.hasOwnVehicle ? formData.vehicleModel.trim() : undefined,
        vehiclePlate: formData.hasOwnVehicle ? formData.vehiclePlate.trim().toUpperCase() : undefined,
        vehicleYear: formData.hasOwnVehicle ? parseInt(formData.vehicleYear) || undefined : undefined,
        vehicleColor: formData.hasOwnVehicle ? formData.vehicleColor : undefined,
        experienceYears: parseInt(formData.experienceYears) || 3,
        hasValidSeddel: formData.hasValidSeddel,
        hasCleanCriminalRecord: formData.hasCleanCriminalRecord,
        notes: formData.notes.trim() || undefined
      });

      setSubmittedAppId(app.id);
      toast.success('Søknad registrert! Aron Taxi administrasjon vil behandle søknaden din.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error('Kunne ikke sende inn søknad. Vennligst prøv igjen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl w-full mx-auto space-y-10">
        {/* TOP BRANDING & TITLE */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold tracking-widest uppercase">
            <ShieldCheck className="w-4 h-4" />
            ARON TAXI NORWAY · OFFISIELL SJÅFØRREGISTRERING
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-[#F5F2ED] tracking-tight">
            Bli Sjåfør i <span className="text-[#D4AF37]">Oslo</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Fyll ut all påkrevd informasjon og løyvedokumentasjon nedenfor. Når du har sendt inn søknaden, vil Aron Taxi administrasjon godkjenne kontoen din før du kan logge inn.
          </p>
        </div>

        {/* APPLICATION SUCCESS RECEIPT SCREEN */}
        {submittedAppId ? (
          <div className="bg-[#121722]/95 border border-[#D4AF37]/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-[#34D186]/20 border border-[#34D186]/40 text-[#34D186] flex items-center justify-center mx-auto shadow-lg shadow-[#34D186]/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⏳ Søknad Innsendt · Venter på Admin Godkjenning
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white pt-2">
                Takk for din søknad, {formData.name}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-light max-w-lg mx-auto leading-relaxed">
                Din søknad er oversendt til Aron Taxi ledelse. Vi verifiserer drosjeløyve, kjøreseddel og registrering. Så snart administrator har godkjent søknaden, vil du kunne logge inn på sjåførappen med e-posten og passordet du oppga.
              </p>
            </div>

            {/* APPLICATION SUMMARY BOX */}
            <div className="bg-[#0A0D14] border border-white/10 rounded-2xl p-6 text-left space-y-3 max-w-md mx-auto text-xs font-mono">
              <div className="flex justify-between border-b border-white/5 pb-2 text-slate-400">
                <span>Søknads-ID:</span>
                <span className="text-[#D4AF37] font-bold">{submittedAppId}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-slate-400">
                <span>Søker:</span>
                <span className="text-white">{formData.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-slate-400">
                <span>E-post for innlogging:</span>
                <span className="text-white">{formData.email}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-slate-400">
                <span>Telefon:</span>
                <span className="text-white">{formData.phone}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-slate-400">
                <span>Løyvenummer:</span>
                <span className="text-white">{formData.permitNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Kjøretøy:</span>
                <span className="text-white">
                  {formData.hasOwnVehicle ? `Egen bil (${formData.vehiclePlate})` : 'Aron Taxi Flåtebil (Tesla / Mercedes)'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/driver/login"
                className="px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
              >
                Gå til Sjåfør Innlogging
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase text-xs tracking-wider rounded-2xl transition-all"
              >
                Tilbake til Hovedsiden
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* STEP PROGRESS BAR */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {[
                { num: 1, title: 'Personalia', icon: User },
                { num: 2, title: 'Løyver & Lisens', icon: FileCheck },
                { num: 3, title: 'Kjøretøy', icon: Car },
                { num: 4, title: 'Bekreftelse', icon: Award }
              ].map((s) => {
                const IconComponent = s.icon;
                const isActive = step === s.num;
                const isPassed = step > s.num;
                return (
                  <div
                    key={s.num}
                    className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col items-center sm:items-start gap-1.5 ${
                      isActive
                        ? 'bg-[#121722] border-[#D4AF37] text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                        : isPassed
                        ? 'bg-[#121722]/60 border-[#34D186]/50 text-[#34D186]'
                        : 'bg-[#121722]/30 border-white/5 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isActive
                            ? 'bg-[#D4AF37] text-slate-950'
                            : isPassed
                            ? 'bg-[#34D186] text-slate-950'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : s.num}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">
                        {s.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FORM CARD */}
            <div className="bg-[#121722]/95 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
              {/* STEP 1: PERSONAL INFORMATION & LOGIN CREDENTIALS */}
              {step === 1 && (
                <form onSubmit={handleNextStep} className="space-y-6">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-[#D4AF37]" />
                      Trinn 1: Personopplysninger & Innlogging
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Disse opplysningene brukes til din personlige sjåførprofil og fremtidige innlogging.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        Fullt Navn (Iht. Førerkort) *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          placeholder="F.eks. Ahmad Aron"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        E-postadresse (Sjåførkonto) *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          required
                          placeholder="din.epost@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        Norsk Telefonnummer *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          required
                          placeholder="+47 90 00 00 00"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        Opprett Passord for Sjåførkonto *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="password"
                          required
                          placeholder="Minst 6 tegn"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        Gjenta Passord *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="password"
                          required
                          placeholder="Gjenta passord"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        Kjøreerfaring som taxisjåfør / yrkessjåfør
                      </label>
                      <select
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option value="1">Under 1 år / Helt ny med kjøreseddel</option>
                        <option value="2">1 - 2 års erfaring</option>
                        <option value="3">3 - 5 års erfaring</option>
                        <option value="6">Over 5 års erfaring i Oslo</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center gap-2 cursor-pointer"
                    >
                      Neste: Løyver & Lisenser
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: LICENSES & PERMITS */}
              {step === 2 && (
                <form onSubmit={handleNextStep} className="space-y-6">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-[#D4AF37]" />
                      Trinn 2: Førerkort, Kjøreseddel & Drosjeløyve
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Norske myndighetskrav krever gyldig førerrett klasse B og godkjent kjøreseddel for drosje.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        Førerkortnummer (Klasse B) *
                      </label>
                      <div className="relative">
                        <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          placeholder="F.eks. 12345678"
                          value={formData.licenseNumber}
                          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        Drosjeløyvenummer / Kjøreseddelløyve *
                      </label>
                      <div className="relative">
                        <Award className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          placeholder="F.eks. OS 10597 eller L-1234"
                          value={formData.permitNumber}
                          onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        Sjåførkortnummer / Taksameter ID (Valgfritt)
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          placeholder="F.eks. CARD-982173"
                          value={formData.driverCardNumber}
                          onChange={(e) => setFormData({ ...formData, driverCardNumber: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    {/* STATUTORY REQUIREMENTS CHECKBOXES */}
                    <div className="sm:col-span-2 p-4 bg-[#0A0D14] rounded-2xl border border-white/5 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasValidSeddel}
                          onChange={(e) => setFormData({ ...formData, hasValidSeddel: e.target.checked })}
                          className="mt-0.5 w-4 h-4 accent-[#D4AF37] rounded"
                        />
                        <span className="text-xs text-slate-300">
                          <strong className="text-white">Gyldig kjøreseddel for persontransport:</strong> Jeg bekrefter at jeg innehar gyldig kjøreseddel utstedt av Norsk Politi for persontransport mot vederlag.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasCleanCriminalRecord}
                          onChange={(e) => setFormData({ ...formData, hasCleanCriminalRecord: e.target.checked })}
                          className="mt-0.5 w-4 h-4 accent-[#D4AF37] rounded"
                        />
                        <span className="text-xs text-slate-300">
                          <strong className="text-white">Vandel og politiattest:</strong> Jeg oppfyller yrkessjåførkravene til hederlig vandel og har ingen sperrer for drosjekjøring.
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase rounded-2xl cursor-pointer"
                    >
                      Tilbake
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center gap-2 cursor-pointer"
                    >
                      Neste: Kjøretøy
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: VEHICLE SETUP */}
              {step === 3 && (
                <form onSubmit={handleNextStep} className="space-y-6">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                      <Car className="w-5 h-5 text-[#D4AF37]" />
                      Trinn 3: Kjøretøyoppsett
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Velg om du vil kjøre en av Aron Taxis offisielle flåtebiler eller din egen godkjente drosjebil.
                    </p>
                  </div>

                  {/* CHOOSE VEHICLE OPTION */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setFormData({ ...formData, hasOwnVehicle: false })}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        !formData.hasOwnVehicle
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                          : 'bg-[#0A0D14] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black uppercase tracking-wider text-[#D4AF37]">
                          Aron Taxi Flåtebil
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            !formData.hasOwnVehicle
                              ? 'bg-[#D4AF37] border-[#D4AF37] text-slate-950'
                              : 'border-white/30'
                          }`}
                        >
                          {!formData.hasOwnVehicle && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <h3 className="font-display text-base font-bold text-white mb-1">
                        Tesla Model Y Juniper / Mercedes EQE
                      </h3>
                      <p className="text-xs text-slate-400 font-light leading-relaxed">
                        Kjør en av våre topp moderne, heldigitale luksusbiler. Aron Taxi stiller med fullt utstyrt bil og løyve.
                      </p>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, hasOwnVehicle: true })}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        formData.hasOwnVehicle
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                          : 'bg-[#0A0D14] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black uppercase tracking-wider text-[#D4AF37]">
                          Egen Drosjebil
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            formData.hasOwnVehicle
                              ? 'bg-[#D4AF37] border-[#D4AF37] text-slate-950'
                              : 'border-white/30'
                          }`}
                        >
                          {formData.hasOwnVehicle && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <h3 className="font-display text-base font-bold text-white mb-1">
                        Jeg har egen godkjent drosje
                      </h3>
                      <p className="text-xs text-slate-400 font-light leading-relaxed">
                        Koble din egen bil til Aron Taxi sentralen og motta turer med 85% sjåførandel og 100% tips.
                      </p>
                    </div>
                  </div>

                  {/* OWN VEHICLE DETAILS FORM */}
                  {formData.hasOwnVehicle && (
                    <div className="p-5 bg-[#0A0D14] rounded-2xl border border-white/10 space-y-4 animate-in fade-in duration-200">
                      <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                        Kjøretøyinformasjon for din drosjebil:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                            Bilmerke og Modell *
                          </label>
                          <input
                            type="text"
                            required={formData.hasOwnVehicle}
                            placeholder="F.eks. Tesla Model Y, Mercedes E-Klasse"
                            value={formData.vehicleModel}
                            onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-[#121722] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                            Kjennemerke / Skiltnummer *
                          </label>
                          <input
                            type="text"
                            required={formData.hasOwnVehicle}
                            placeholder="F.eks. EL 89234"
                            value={formData.vehiclePlate}
                            onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-[#121722] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37] uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                            Årsmodell
                          </label>
                          <input
                            type="number"
                            placeholder="2024"
                            value={formData.vehicleYear}
                            onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-[#121722] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                            Taksameter / Takstsystem
                          </label>
                          <input
                            type="text"
                            placeholder="Semel / Digitax / App-taksameter"
                            value={formData.taximeterBrand}
                            onChange={(e) => setFormData({ ...formData, taximeterBrand: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-[#121722] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase rounded-2xl cursor-pointer"
                    >
                      Tilbake
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center gap-2 cursor-pointer"
                    >
                      Neste: Egenerklæring & Send
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: CONFIRMATION, NOTES & SUBMIT */}
              {step === 4 && (
                <form onSubmit={handleSubmitApplication} className="space-y-6">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#D4AF37]" />
                      Trinn 4: Egenerklæring & Innsending
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Kontroller sammendraget av dine opplysninger før du sender inn søknaden til administrator.
                    </p>
                  </div>

                  {/* SUMMARY REVIEW CARD */}
                  <div className="bg-[#0A0D14] border border-white/10 rounded-2xl p-5 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 uppercase font-bold text-[10px] block">Søkers Navn:</span>
                        <span className="text-white font-semibold text-sm">{formData.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-bold text-[10px] block">E-post / Innlogging:</span>
                        <span className="text-white font-mono">{formData.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-bold text-[10px] block">Telefon:</span>
                        <span className="text-white font-mono">{formData.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-bold text-[10px] block">Drosjeløyvenummer:</span>
                        <span className="text-[#D4AF37] font-bold font-mono">{formData.permitNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-bold text-[10px] block">Førerkort (Klasse B):</span>
                        <span className="text-white font-mono">{formData.licenseNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-bold text-[10px] block">Kjøretøy:</span>
                        <span className="text-emerald-400 font-semibold">
                          {formData.hasOwnVehicle
                            ? `Egen bil: ${formData.vehicleModel} (${formData.vehiclePlate})`
                            : 'Aron Taxi Flåte (Tesla Model Y / Mercedes EQE)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* EXTRA NOTES */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Eventuelle kommentarer eller tilleggsopplysninger til Aron Taxi administrasjon (Valgfritt)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Skriv inn eventuelle merknader her..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0A0D14] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  {/* MANDATORY CONSENT CHECKBOXES */}
                  <div className="p-4 bg-[#0A0D14] rounded-2xl border border-white/5 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={formData.acceptTerms}
                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                        className="mt-0.5 w-4 h-4 accent-[#D4AF37] rounded"
                      />
                      <span className="text-xs text-slate-300">
                        <strong className="text-white">Aksept av sjåførvilkår:</strong> Jeg bekrefter at alle oppgitte opplysninger er korrekte, og at jeg aksepterer Aron Taxis retningslinjer for punktlighet, kundeservice og profesjonell fremferd. *
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={formData.acceptDataProcessing}
                        onChange={(e) => setFormData({ ...formData, acceptDataProcessing: e.target.checked })}
                        className="mt-0.5 w-4 h-4 accent-[#D4AF37] rounded"
                      />
                      <span className="text-xs text-slate-300">
                        <strong className="text-white">Admin verifisering & samtykke:</strong> Jeg samtykker til at Aron Taxi administrasjon behandler søknaden min og utfører nødvendig kontroll av drosjeløyve og kjøreseddel før godkjenning. *
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase rounded-2xl cursor-pointer"
                    >
                      Tilbake
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-9 py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <span>Sender inn søknad...</span>
                      ) : (
                        <>
                          Send Søknad til Godkjenning
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* APPLICATION STATUS LOOKUP COMPONENT */}
            <div className="bg-[#121722]/80 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Har du allerede sendt inn en søknad?
                  </h3>
                  <p className="text-xs text-slate-400 font-light">
                    Sjekk status på din eksisterende sjåførsøknad med e-post eller telefonnummer
                  </p>
                </div>
              </div>

              <form onSubmit={handleLookup} className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Skriv inn e-postadresse eller tlf..."
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[#0A0D14] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Sjekk Status
                </button>
              </form>

              {lookupResult && lookupResult !== 'not_found' && (
                <div className="p-4 bg-[#0A0D14] rounded-2xl border border-white/10 space-y-2 text-xs animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{lookupResult.name} ({lookupResult.email})</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        lookupResult.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : lookupResult.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {lookupResult.status === 'approved'
                        ? '✅ Godkjent av Admin'
                        : lookupResult.status === 'rejected'
                        ? '❌ Avslått'
                        : '⏳ Venter på Admin Godkjenning'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Innsendt: {new Date(lookupResult.createdAt).toLocaleDateString('no-NO')} · Løyvenr: {lookupResult.permitNumber}
                  </p>
                  {lookupResult.adminNotes && (
                    <p className="p-2.5 bg-white/5 rounded-xl text-slate-300 italic text-[11px]">
                      Notat fra admin: {lookupResult.adminNotes}
                    </p>
                  )}
                  {lookupResult.status === 'approved' && (
                    <div className="pt-2">
                      <Link
                        to="/driver/login"
                        className="inline-flex items-center gap-1.5 text-[#D4AF37] font-bold hover:underline"
                      >
                        Gå til innlogging for å starte kjøring <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {lookupResult === 'not_found' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Ingen søknad funnet med disse opplysningene. Vennligst sjekk stavingen eller send inn en ny søknad over.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
