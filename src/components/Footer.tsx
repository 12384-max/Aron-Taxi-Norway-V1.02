import React from 'react';
import { Link } from 'react-router-dom';
import { OFFICIAL_ASSETS } from '../constants/assets';
import { Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#07090E] text-slate-300 border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* BRAND COLUMN */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="inline-block group">
              <img
                src={OFFICIAL_ASSETS.logo}
                alt="Aron Taxi Norway Logo"
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-2xl object-cover border border-[#D4AF37]/40 shadow-lg shadow-amber-500/10 transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            <p className="font-display text-lg font-semibold text-[#F5F2ED]">
              Aron Taxi Norway
            </p>
            <p className="text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">
              Oslo · Siden 2025
            </p>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Klassisk, trygg og luksuriøs taxi for Oslo. Bestill enkelt på sekunder, følg turen din i sanntid og kjenn deg trygg.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
              <ShieldCheck className="w-4 h-4" />
              <span>Godkjent drosjeløyve & sertifiserte sjåfører</span>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="font-display text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-4">
              Navigasjon
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/bestill" className="hover:text-[#D4AF37] transition-colors">
                  Bestill taxi
                </Link>
              </li>
              <li>
                <Link to="/slik-fungerer-det" className="hover:text-[#D4AF37] transition-colors">
                  Slik fungerer det
                </Link>
              </li>
              <li>
                <Link to="/biler" className="hover:text-[#D4AF37] transition-colors">
                  Biler (Tesla Model Y & Mercedes EQE)
                </Link>
              </li>
              <li>
                <Link to="/for-sjaforer" className="hover:text-[#D4AF37] transition-colors">
                  For sjåfører
                </Link>
              </li>
              <li>
                <Link to="/bli-sjafor" className="hover:text-[#D4AF37] text-emerald-400 font-semibold transition-colors">
                  ✦ Søk om å bli sjåfør (/bli-sjafor)
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#D4AF37] transition-colors">
                  Kunde Logg inn / Registrer
                </Link>
              </li>
            </ul>
          </div>

          {/* PORTALS & ROLES */}
          <div>
            <h4 className="font-display text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-4">
              Portaler
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/driver/login" className="hover:text-[#D4AF37] transition-colors">
                  Sjåfør Innlogging (/driver/login)
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-[#D4AF37] transition-colors">
                  Admin Dispatch (/admin/login)
                </Link>
              </li>
              <li>
                <Link to="/konto" className="hover:text-[#D4AF37] transition-colors">
                  Kundekonto & Mine turer
                </Link>
              </li>
              <li>
                <Link to="/bestill" className="hover:text-[#D4AF37] transition-colors">
                  Gjestebestilling (Uten innlogging)
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTACT INFO */}
          <div>
            <h4 className="font-display text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-4">
              Kontakt oss
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>Oslo og Viken, Norge</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href="tel:+4796990901" className="hover:text-[#D4AF37] transition-colors font-mono">
                  +47 96 99 09 01
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href="mailto:aron.taxi@hotmail.com" className="hover:text-[#D4AF37] transition-colors">
                  aron.taxi@hotmail.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Aron Taxi Norway. Alle rettigheter reservert.</p>
          <p className="text-[11px] tracking-widest uppercase text-slate-600">
            Klassisk & Premium oslo taxi
          </p>
        </div>
      </div>
    </footer>
  );
};
