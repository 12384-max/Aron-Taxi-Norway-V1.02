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
  const { loginWithEmail, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    const res = await loginWithGoogle('driver');
    setGoogleLoading(false);

    if (res.success) {
      toast.success('Innlogget med Google! Åpner sjåførappen...');
      navigate('/driver');
    } else {
      setErrorMessage(res.error || 'Google-innlogging feilet.');
      toast.error(res.error || 'Google-innlogging feilet.');
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

          {/* GOOGLE AUTH OPTION */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold">
              <span className="bg-[#121722] px-3 text-slate-500 tracking-wider">Eller</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[#F5F2ED] font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2.5"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Logg inn med Google
              </>
            )}
          </button>

          {/* ADMIN APPROVAL INFO NOTICE */}
          <div className="p-4 bg-[#0D121D] rounded-2xl border border-white/5 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-[#D4AF37] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lukket sjåførsystem</span>
            </div>
            <p className="leading-relaxed font-light">
              Nye sjåfører må være forhåndsgodkjent og registrert av Aron Taxi administrasjon før tilgang gis.
            </p>
            <div className="pt-1 flex items-center justify-between border-t border-white/5 text-[10px]">
              <span>Trenger du tilgang?</span>
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
