import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { OFFICIAL_ASSETS } from '../constants/assets';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Car, User, Globe, LogIn, ChevronRight } from 'lucide-react';

export const Header: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0A0D14]/90 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* LOGO - CLICKABLE, RETURNS TO "/" */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <img
              src={OFFICIAL_ASSETS.logo}
              alt="Aron Taxi Norway Logo"
              className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:block text-left">
              <span className="block font-display text-lg tracking-wider font-semibold text-[#F5F2ED] group-hover:text-[#D4AF37] transition-colors">
                ARON TAXI
              </span>
              <span className="block text-[10px] tracking-widest text-[#D4AF37] font-medium uppercase">
                NORWAY · OSLO
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden md:flex items-center space-x-1 bg-white/5 border border-white/10 p-1.5 rounded-full">
            <Link
              to="/slik-fungerer-det"
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                isCurrent('/slik-fungerer-det')
                  ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('nav.howItWorks')}
            </Link>
            
            <Link
              to="/biler"
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                isCurrent('/biler')
                  ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('nav.vehicles')}
            </Link>

            <Link
              to="/for-sjaforer"
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                isCurrent('/for-sjaforer')
                  ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('nav.forDrivers')}
            </Link>
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* LANGUAGE TOGGLE */}
            <button
              onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all cursor-pointer"
              title="Bytt språk / Change language"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* LOGGED IN PORTALS OR LOGIN BUTTON */}
            {user ? (
              <div className="flex items-center space-x-3">
                {role === 'admin' ? (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase bg-[#D4AF37] text-slate-950 hover:bg-[#E5C158] rounded-full transition-all shadow-md"
                  >
                    Admin Portal
                  </Link>
                ) : role === 'driver' ? (
                  <Link
                    to="/driver"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase bg-[#D4AF37] text-slate-950 hover:bg-[#E5C158] rounded-full transition-all shadow-md"
                  >
                    <Car className="w-4 h-4" />
                    Sjåfør Portal
                  </Link>
                ) : (
                  <Link
                    to="/konto"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wider text-slate-200 bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 rounded-full transition-all"
                  >
                    <User className="w-4 h-4 text-[#D4AF37]" />
                    Min Konto
                  </Link>
                )}
                
                <button
                  onClick={logout}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
                >
                  Logg ut
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider text-slate-200 hover:text-white bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 rounded-full transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                {t('nav.login')}
              </Link>
            )}

            {/* BOOK TAXI BUTTON */}
            <Link
              to="/bestill"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] text-slate-950 hover:brightness-110 rounded-full transition-all shadow-lg shadow-[#D4AF37]/20"
            >
              {t('nav.bookTaxi')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="flex md:hidden items-center space-x-3">
            <button
              onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
              className="p-2 text-xs font-bold text-slate-300 bg-white/5 rounded-full border border-white/10"
            >
              {lang.toUpperCase()}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#D4AF37]" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A0D14] border-b border-white/10 px-4 pt-4 pb-6 space-y-3">
          <Link
            to="/bestill"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center py-3 px-4 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-slate-950 font-bold uppercase tracking-wider rounded-full text-sm shadow-md"
          >
            {t('nav.bookTaxi')}
          </Link>
          <Link
            to="/slik-fungerer-det"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-200 hover:text-[#D4AF37] font-medium text-sm"
          >
            {t('nav.howItWorks')}
          </Link>
          <Link
            to="/biler"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-200 hover:text-[#D4AF37] font-medium text-sm"
          >
            {t('nav.vehicles')}
          </Link>
          <Link
            to="/for-sjaforer"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-200 hover:text-[#D4AF37] font-medium text-sm"
          >
            {t('nav.forDrivers')}
          </Link>
          
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to={role === 'admin' ? '/admin' : role === 'driver' ? '/driver' : '/konto'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-[#D4AF37] font-semibold text-sm"
                >
                  Gå til Dashboard ({role.toUpperCase()})
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 text-slate-400 hover:text-white text-sm"
                >
                  Logg ut
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-200 hover:text-[#D4AF37] font-medium text-sm"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
