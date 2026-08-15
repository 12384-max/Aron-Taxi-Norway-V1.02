import React, { useState, useEffect, useRef } from 'react';
import { AppNotification } from '../types';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  Smartphone,
  Laptop,
  CheckCircle2,
  MapPin,
  Car,
  AlertTriangle,
  Radio,
  ExternalLink,
  X
} from 'lucide-react';

export const NotificationBell: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { user, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(notificationService.getSoundEnabled());
  const [permissionState, setPermissionState] = useState(notificationService.getPermissionState());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRole = role || 'customer';

  // Subscribe to notifications updates
  useEffect(() => {
    const update = () => {
      const list = notificationService.getNotifications(currentRole, user?.uid);
      setNotifications(list);
      setUnreadCount(notificationService.getUnreadCount(currentRole, user?.uid));
      setPermissionState(notificationService.getPermissionState());
    };

    update();
    const unsubscribe = notificationService.subscribe(() => {
      update();
    });

    const handleCustom = () => update();
    window.addEventListener('aron_notifications_updated', handleCustom);
    window.addEventListener('aron_new_notification', handleCustom);

    return () => {
      unsubscribe();
      window.removeEventListener('aron_notifications_updated', handleCustom);
      window.removeEventListener('aron_new_notification', handleCustom);
    };
  }, [currentRole, user?.uid]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    notificationService.setSoundEnabled(next);
    if (next) {
      notificationService.playSound('ping');
    }
  };

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermissionState(res);
    if (res === 'granted') {
      notificationService.notify({
        title: '🔔 Enhetsvarsler er på!',
        message: 'Systemvarsler sendes til denne PC-en / mobilen.',
        type: 'info',
        soundType: 'ping'
      });
    }
  };

  const handleTestNotification = () => {
    notificationService.notify({
      title: '🚕 Testvarsel fra Aron Taxi',
      message: 'Lyd, vibrasjon og push-varsel fungerer perfekt på denne enheten!',
      type: 'trip_created',
      targetRole: currentRole,
      soundType: 'request'
    });
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(currentRole, user?.uid);
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'trip_created':
        return <Car className="w-4 h-4 text-[#34D186] shrink-0" />;
      case 'driver_assigned':
        return <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />;
      case 'driver_arrived':
        return <MapPin className="w-4 h-4 text-[#34D186] shrink-0" />;
      case 'trip_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'trip_cancelled':
        return <X className="w-4 h-4 text-red-400 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-[#D4AF37] shrink-0" />;
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* BELL BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all focus:outline-none cursor-pointer flex items-center justify-center"
        title="Varselsenter (Mobil & PC)"
      >
        <Bell className="w-4 h-4 text-[#D4AF37]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0B0F19] border border-white/15 rounded-3xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
          
          {/* HEADER */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Varsler & Oppdateringer
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  {unreadCount} nye
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  soundEnabled
                    ? 'text-[#34D186] bg-[#34D186]/10 border-[#34D186]/20'
                    : 'text-slate-400 bg-white/5 border-white/10'
                }`}
                title={soundEnabled ? 'Lyd er på (klikk for å slå av)' : 'Lyd er av (klikk for å slå på)'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-40 cursor-pointer"
                title="Marker alle som lest"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg disabled:opacity-40 cursor-pointer"
                title="Tøm alle varsler"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PERMISSION / QUICK TEST BANNER */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37]/10 to-transparent border-b border-white/5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <Laptop className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                {permissionState === 'granted'
                  ? 'Push-varsler: Aktiv på enhet'
                  : 'Push-varsler: Ikke aktivert'}
              </span>
            </div>

            {permissionState !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="px-2 py-0.5 bg-[#D4AF37] hover:brightness-110 text-slate-950 font-bold rounded-md text-[10px] cursor-pointer"
              >
                Slå på
              </button>
            ) : (
              <button
                onClick={handleTestNotification}
                className="text-[#D4AF37] hover:underline font-bold text-[10px] cursor-pointer"
              >
                Test varsel
              </button>
            )}
          </div>

          {/* NOTIFICATION LIST */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                Ingen nye varsler for øyeblikket.
                <div className="mt-3">
                  <button
                    onClick={handleTestNotification}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs rounded-xl font-medium cursor-pointer"
                  >
                    Send et testvarsel
                  </button>
                </div>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => notificationService.markAsRead(n.id)}
                  className={`p-3.5 transition-all flex items-start gap-3 hover:bg-white/5 cursor-pointer ${
                    !n.isRead ? 'bg-[#D4AF37]/[0.03]' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mt-0.5 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs truncate ${
                          !n.isRead ? 'font-bold text-white' : 'font-medium text-slate-300'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {new Date(n.timestamp).toLocaleTimeString('no-NO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    {n.actionUrl && (
                      <a
                        href={n.actionUrl}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D4AF37] hover:underline mt-1.5"
                      >
                        Gå til side
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0 mt-1.5 shadow-sm" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div className="p-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[10px] text-slate-500 px-4">
            <span>Rolle: {currentRole.toUpperCase()}</span>
            <span className="flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-[#34D186] animate-pulse" />
              Live Sanntidskobling
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
