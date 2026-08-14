import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  no: {
    'nav.howItWorks': 'Slik fungerer det',
    'nav.forDrivers': 'For sjåfører',
    'nav.vehicles': 'Biler',
    'nav.login': 'Logg inn',
    'nav.bookTaxi': 'Bestill taxi',
    'hero.tagline': 'På vei, med ro.',
    'hero.badge': 'ARON TAXI NORWAY · OSLO OG OMEGN · SIDEN 2025',
    'hero.subtitle': 'En ordentlig taxi for byen du kjenner. Bestill enkelt, følg turen og vit hvem som kommer.',
    'hero.from': 'FRA',
    'hero.fromPlaceholder': 'Hentested, adresse eller sted',
    'hero.to': 'TIL',
    'hero.toPlaceholder': 'Hvor skal vi kjøre deg?',
    'hero.findCar': 'Finn en bil',
    'hero.bookNow': 'Bestill en taxi',
    'hero.airport': 'Flyplasstransport',
    'hero.preorder': 'Forhåndsbestilling',
    'hero.fixedPrice': 'Fastpris når tilgjengelig',
    'hero.eta': 'Estimert ankomsttid',
    'footer.description': 'En klassisk, trygg og luksuriøs taxitjeneste i Oslo og omegn.',
    'footer.quickLinks': 'Hurtiglenker',
    'footer.contact': 'Kontakt oss',
    'footer.address': 'Oslo og omegn, Norge',
    'order.title': 'Bestill din taxi',
    'order.details': 'Turopplysninger',
    'order.priceEstimate': 'Prisestimat',
    'order.confirm': 'Bekreft bestilling',
    'order.guestInfo': 'Bestill som gjest (ingen innlogging kreves)',
    'driver.portal': 'Sjåførportal',
    'driver.online': 'ONLINE - Klar for turer',
    'driver.offline': 'OFFLINE - Ikke tilgjengelig',
    'admin.portal': 'Admin portal',
    'admin.liveTrips': 'Live turer',
    'admin.drivers': 'Sjåfører'
  },
  en: {
    'nav.howItWorks': 'How it works',
    'nav.forDrivers': 'For drivers',
    'nav.vehicles': 'Vehicles',
    'nav.login': 'Log in',
    'nav.bookTaxi': 'Book taxi',
    'hero.tagline': 'On the way, with peace of mind.',
    'hero.badge': 'ARON TAXI NORWAY · OSLO & REGION · SINCE 2025',
    'hero.subtitle': 'A genuine taxi for the city you know. Book easily, track your ride, and know who is coming.',
    'hero.from': 'FROM',
    'hero.fromPlaceholder': 'Pickup location, address or place',
    'hero.to': 'TO',
    'hero.toPlaceholder': 'Where are we taking you?',
    'hero.findCar': 'Find a car',
    'hero.bookNow': 'Book a taxi',
    'hero.airport': 'Airport Transfer',
    'hero.preorder': 'Pre-order',
    'hero.fixedPrice': 'Fixed price when available',
    'hero.eta': 'Estimated arrival time',
    'footer.description': 'A classic, safe, and luxury taxi service in Oslo and surrounding areas.',
    'footer.quickLinks': 'Quick Links',
    'footer.contact': 'Contact Us',
    'footer.address': 'Oslo and surrounding region, Norway',
    'order.title': 'Book your taxi',
    'order.details': 'Trip Details',
    'order.priceEstimate': 'Price Estimate',
    'order.confirm': 'Confirm Booking',
    'order.guestInfo': 'Book as guest (no login required)',
    'driver.portal': 'Driver Portal',
    'driver.online': 'ONLINE - Ready for trips',
    'driver.offline': 'OFFLINE - Unavailable',
    'admin.portal': 'Admin Portal',
    'admin.liveTrips': 'Live Trips',
    'admin.drivers': 'Drivers'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('no');

  const t = (key: string): string => {
    return translations[lang][key] || translations['no'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
