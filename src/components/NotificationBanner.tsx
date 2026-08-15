import React, { useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Car,
  MapPin,
  X,
  Radio,
  ExternalLink,
  Volume2,
  Smartphone,
  Laptop,
  Check
} from 'lucide-react';

export const NotificationBanner: React.FC = () => {
  const { user, role } = useAuth();
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check browser notification permission status
  useEffect(() => {
    if (notificationService.isSupported()) {
      const state = notificationService.getPermissionState();
      if (state === 'default') {
        // Show subtle permission prompt after 2 seconds
        const t = setTimeout(() => setShowPermissionPrompt(true), 2500);
        return () => clearTimeout(t);
      } else if (state === 'granted') {
        setPermissionGranted(true);
      }
    }
  }, []);

  // Listen to new real-time notifications
  useEffect(() => {
    const handleNewNotif = (e: any) => {
      const notif: AppNotification = e.detail;
      if (!notif) return;

      // Filter: only show if relevant to current user role
      const userRole = role || 'customer';
      if (
        notif.targetRole === 'all' ||
        notif.targetRole === userRole ||
        (userRole === 'admin') || // Admin sees all system notifications
        (notif.targetUserId && user?.uid === notif.targetUserId)
      ) {
        setActiveToast(notif);
      }
    };

    window.addEventListener('aron_new_notification', handleNewNotif);
    return () => {
      window.removeEventListener('aron_new_notification', handleNewNotif);
    };
  }, [role, user?.uid]);

  // Auto-dismiss active toast after 6 seconds (or 10 seconds for emergency)
  useEffect(() => {
    if (!activeToast) return;
    const duration = activeToast.type === 'emergency' ? 12000 : 6000;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, duration);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const handleEnablePermissions = async () => {
    const res = await notificationService.requestPermission();
    if (res === 'granted') {
      setPermissionGranted(true);
      setShowPermissionPrompt(false);
      // Play confirmation ping
      notificationService.notify({
        title: '🔔 Varsler aktivert!',
        message: 'Du vil nå motta sanntidsvarsler på denne enheten (mobil og PC).',
        type: 'info',
        soundType: 'ping'
      });
    } else {
      setShowPermissionPrompt(false);
    }
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />;
      case 'trip_created':
        return <Car className="w-5 h-5 text-[#34D186]" />;
      case 'driver_assigned':
        return <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />;
      case 'driver_arrived':
        return <MapPin className="w-5 h-5 text-[#34D186] animate-pulse" />;
      case 'trip_completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'trip_cancelled':
        return <X className="w-5 h-5 text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-[#D4AF37]" />;
    }
  };

  const getBorderColor = (type: AppNotification['type']) => {
    if (type === 'emergency') return 'border-red-500/80 bg-red-950/90 shadow-red-900/50';
    if (type === 'trip_created') return 'border-[#34D186]/50 bg-[#0E1726]/95 shadow-[#34D186]/20';
    if (type === 'driver_arrived') return 'border-[#34D186]/70 bg-[#0A1A12]/95 shadow-[#34D186]/30';
    if (type === 'driver_assigned') return 'border-[#D4AF37]/60 bg-[#14120B]/95 shadow-[#D4AF37]/20';
    return 'border-white/20 bg-[#0F1420]/95 shadow-black/60';
  };

  return (
    <>
      {/* 1. PERMISSION PROMPT BANNER (FOR MOBIL & PC) */}
      {showPermissionPrompt && !permissionGranted && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#0D121F]/95 backdrop-blur-xl border border-[#D4AF37]/40 rounded-2xl p-4 shadow-2xl shadow-black/80 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Aktiver sanntidsvarsler
                    <span className="flex items-center gap-1 text-[10px] font-normal text-slate-400">
                      <Smartphone className="w-3 h-3 text-slate-400" />
                      <Laptop className="w-3 h-3 text-slate-400" />
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Få oppdateringer når sjåføren er på vei eller fremme, selv med lukket fane.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPermissionPrompt(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleEnablePermissions}
                className="flex-1 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] hover:brightness-110 text-slate-950 text-xs font-black uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Tillat varsler på enhet
              </button>
              <button
                onClick={() => setShowPermissionPrompt(false)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Senere
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REAL-TIME FLOATING NOTIFICATION TOAST */}
      {activeToast && (
        <div className="fixed top-22 right-4 sm:right-6 max-w-md w-[calc(100vw-2rem)] sm:w-[420px] z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`border rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 transition-all ${getBorderColor(
              activeToast.type
            )}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                  {getNotifIcon(activeToast.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white tracking-wide">
                      {activeToast.title}
                    </h4>
                    {activeToast.targetRole && activeToast.targetRole !== 'all' && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-white/10 text-[#D4AF37] border border-white/10">
                        {activeToast.targetRole === 'admin' ? 'Admin' : activeToast.targetRole === 'driver' ? 'Sjåfør' : 'Kunde'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    {activeToast.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ACTION FOOTER IF URL EXISTS */}
            {activeToast.actionUrl && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(activeToast.timestamp).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <a
                  href={activeToast.actionUrl}
                  onClick={() => setActiveToast(null)}
                  className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
                >
                  Vis detaljer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
