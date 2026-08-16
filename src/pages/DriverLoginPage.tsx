import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { OFFICIAL_ASSETS } from '../constants/assets';
import { Lock, Mail, Loader2, AlertCircle, ArrowRight, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';

export const DriverLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await loginWithEmail(email, password, 'driver');
    setLoading(false);

    if (res.success) {
      toast.success('Innlogget som sjåfør! Åpner sjåførappen...');
      navigate('/driver');
    } else {
      setErrorMessage(res.error || 'Innlogging feilet. Vennligst sjekk e-post og passord.');
      toast.error(res.error || 'Innlogging feilet.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#121722]/95 border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6 backdrop-blur-xl">
          
          {/* HEADER BRANDING */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              ARON TAXI NORWAY · DRIVER APP
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F2ED]">
              Sjåfør Logg Inn
            </h1>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Autentiser din offisielle sjåførkonto for å gå online og motta turer
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* REAL FIREBASE AUTH FORM */}
          <form onSubmit={handleDriverLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                Sjåfør E-post
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="sjafor@arontaxi.no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D121D] border border-white/10 rounded-2xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                Passord
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D121D] border border-white/10 rounded-2xl text-xs text-[#F5F2ED] focus:outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Logg inn på Sjåførkonto
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ADMIN APPROVAL INFO & REGISTRATION NOTICE */}
          <div className="p-4 bg-[#0D121D] rounded-2xl border border-[#D4AF37]/20 space-y-2.5 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#D4AF37] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Godkjent sjåfør?</span>
              </div>
              <Link
                to="/bli-sjafor"
                className="text-[#D4AF37] font-black uppercase text-[10px] tracking-wider hover:underline flex items-center gap-1"
              >
                Søk om konto <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="leading-relaxed font-light">
              Nye sjåfører må sende inn søknad med førerkort og drosjeløyve for godkjenning av Aron Taxi administrasjon før tilgang gis.
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-white/5 text-[10px]">
              <Link to="/bli-sjafor" className="text-white font-bold hover:text-[#D4AF37] transition-colors">
                📝 Send inn sjåførsøknad
              </Link>
              <a href="tel:+4796990901" className="text-[#D4AF37] font-semibold hover:underline flex items-center gap-1">
                <Phone className="w-3 h-3" />
                +47 96 99 09 01
              </a>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
