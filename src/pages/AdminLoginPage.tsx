import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, ArrowRight, Loader2, AlertCircle, KeyRound } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminPasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await loginAdmin(password);
    setLoading(false);
    if (res.success) {
      toast.success('Administrator autentisert. Åpner sentralbord.');
      navigate('/admin');
    } else {
      setError(res.error || 'Ugyldig administratorpassord.');
      toast.error(res.error || 'Ugyldig administratorpassord.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#121722]/90 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-xl">
          
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto shadow-lg shadow-[#D4AF37]/10">
              <Lock className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-widest uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              ADMINISTRATOR TILGANG · SENTRALBORD
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F2ED]">
              Admin Innlogging
            </h1>
            <p className="text-xs text-slate-400 font-light">
              Skriv inn ditt administratorpassord for å åpne sentralbord og flåtestyring
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminPasscodeSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center justify-between">
                <span>Administrator Passord</span>
                <span className="text-[10px] text-[#D4AF37] font-normal flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Sikker tilgang
                </span>
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Skriv inn passord..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D121D] border border-white/10 rounded-xl text-sm text-[#F5F2ED] placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  Logg inn i Sentralbordet
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
            <Link to="/login" className="text-slate-400 hover:text-white">
              &larr; Kundeinnlogging
            </Link>
            <Link to="/driver/login" className="text-[#D4AF37] hover:underline">
              Sjåførportal
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
