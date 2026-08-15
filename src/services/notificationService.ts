import { AppNotification } from '../types';
import { soundService } from './sound';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { removeUndefinedFields } from '../utils/firestoreHelper';

const STORAGE_KEY = 'aron_app_notifications';

class NotificationService {
  private notifications: AppNotification[] = [];
  private listeners: ((notifications: AppNotification[]) => void)[] = [];
  private soundEnabled: boolean = true;
  private vibrationEnabled: boolean = true;

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.loadFromStorage();
        }
      });
    }
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.notifications = JSON.parse(saved);
        this.notifyListeners();
      }
    } catch (e) {
      console.warn('Failed to load notifications from storage', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
      this.notifyListeners();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('aron_notifications_updated'));
      }
    } catch (e) {
      console.warn('Failed to save notifications to storage', e);
    }
  }

  // --- BROWSER WEB NOTIFICATION API (PC & MOBILE) ---
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermissionState(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('Notification permission error', err);
      return Notification.permission;
    }
  }

  // --- MOBILE VIBRATION API ---
  triggerVibration(type: AppNotification['type']) {
    if (!this.vibrationEnabled || typeof window === 'undefined' || !('vibrate' in navigator)) {
      return;
    }

    try {
      switch (type) {
        case 'emergency':
          // Urgent pulsing vibration
          navigator.vibrate([400, 150, 400, 150, 400, 150, 600]);
          break;
        case 'trip_created':
          // 2-tone driver alert vibration
          navigator.vibrate([200, 100, 300]);
          break;
        case 'driver_arrived':
          // Double buzz for arrival
          navigator.vibrate([300, 150, 300]);
          break;
        case 'driver_assigned':
        case 'trip_started':
          // Smooth single buzz
          navigator.vibrate([250]);
          break;
        case 'trip_completed':
          // Celebration short buzzes
          navigator.vibrate([150, 100, 150, 100, 250]);
          break;
        case 'trip_cancelled':
          // Long warning vibration
          navigator.vibrate([500]);
          break;
        default:
          navigator.vibrate([200]);
          break;
      }
    } catch (e) {
      // Ignore vibration errors on unsupported devices
    }
  }

  // --- SOUND SERVICE INTEGRATION ---
  playSound(soundType?: AppNotification['soundType'], notifType?: AppNotification['type']) {
    if (!this.soundEnabled) return;

    const actualSound = soundType || (
      notifType === 'trip_created' ? 'request' :
      notifType === 'driver_assigned' ? 'accepted' :
      notifType === 'driver_arrived' ? 'arrived' :
      notifType === 'trip_started' ? 'started' :
      notifType === 'trip_completed' ? 'completed' :
      notifType === 'trip_cancelled' ? 'cancel' :
      notifType === 'emergency' ? 'emergency' : 'ping'
    );

    switch (actualSound) {
      case 'request':
        soundService.playTripRequestChime(0.85);
        break;
      case 'accepted':
        soundService.playTripAcceptedSound(0.65);
        break;
      case 'arrived':
        soundService.playDriverArrivedSound(0.85);
        break;
      case 'started':
        soundService.playTripStartedSound(0.55);
        break;
      case 'completed':
        soundService.playTripCompletedSound(0.7);
        break;
      case 'cancel':
        soundService.playCancelSound(0.6);
        break;
      case 'emergency':
        soundService.playEmergencyAlarmSound(0.95);
        break;
      case 'ping':
      default:
        soundService.playNotificationPing(0.6);
        break;
    }
  }

  // --- CORE NOTIFICATION DISPATCHER ---
  async notify(payload: {
    title: string;
    message: string;
    type: AppNotification['type'];
    targetRole?: AppNotification['targetRole'];
    targetUserId?: string;
    tripId?: string;
    actionUrl?: string;
    soundType?: AppNotification['soundType'];
    requireInteraction?: boolean;
  }): Promise<AppNotification> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const timestamp = new Date().toISOString();

    const notif: AppNotification = {
      id,
      title: payload.title,
      message: payload.message,
      timestamp,
      type: payload.type,
      targetRole: payload.targetRole || 'all',
      targetUserId: payload.targetUserId,
      tripId: payload.tripId,
      actionUrl: payload.actionUrl,
      soundType: payload.soundType,
      isRead: false
    };

    // 1. Save to state & localStorage
    this.notifications = [notif, ...this.notifications].slice(0, 100); // keep last 100
    this.saveToStorage();

    // 2. Play Audio chime
    this.playSound(payload.soundType, payload.type);

    // 3. Trigger Mobile Vibration
    this.triggerVibration(payload.type);

    // 4. Trigger Web Browser Push Notification (on PC/Mac/Linux & Mobile)
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const nativeNotif = new Notification(payload.title, {
          body: payload.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: payload.tripId ? `trip-${payload.tripId}` : id,
          requireInteraction: payload.requireInteraction ?? (payload.type === 'emergency' || payload.type === 'trip_created')
        });

        nativeNotif.onclick = () => {
          window.focus();
          if (payload.actionUrl && typeof window !== 'undefined') {
            window.location.href = payload.actionUrl;
          }
          nativeNotif.close();
        };
      } catch (err) {
        console.warn('Native notification spawn note:', err);
      }
    }

    // 5. Broadcast to custom DOM event for active UI components
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent('aron_new_notification', { detail: notif });
      window.dispatchEvent(customEvent);
    }

    // 6. Async sync to Firestore cloud collection for multi-device sync
    try {
      const cleanNotif = removeUndefinedFields(notif);
      setDoc(doc(db, 'notifications', id), cleanNotif, { merge: true }).catch(() => {});
    } catch (e) {}

    return notif;
  }

  // --- QUERY & STATE HELPERS ---
  getNotifications(role?: 'all' | 'admin' | 'driver' | 'customer', userId?: string): AppNotification[] {
    if (!role || role === 'admin') {
      return this.notifications;
    }
    return this.notifications.filter((n) => {
      if (n.targetRole === 'all') return true;
      if (n.targetRole === role) {
        if (n.targetUserId && userId && n.targetUserId !== userId) {
          return false;
        }
        return true;
      }
      return false;
    });
  }

  getUnreadCount(role?: 'all' | 'admin' | 'driver' | 'customer', userId?: string): number {
    return this.getNotifications(role, userId).filter((n) => !n.isRead).length;
  }

  markAsRead(notificationId: string) {
    this.notifications = this.notifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.saveToStorage();
  }

  markAllAsRead(role?: 'all' | 'admin' | 'driver' | 'customer', userId?: string) {
    const targetIds = new Set(this.getNotifications(role, userId).map((n) => n.id));
    this.notifications = this.notifications.map((n) =>
      targetIds.has(n.id) ? { ...n, isRead: true } : n
    );
    this.saveToStorage();
  }

  clearAll() {
    this.notifications = [];
    this.saveToStorage();
  }

  // Settings
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  setVibrationEnabled(enabled: boolean) {
    this.vibrationEnabled = enabled;
  }

  getVibrationEnabled(): boolean {
    return this.vibrationEnabled;
  }

  // Listener subscriptions
  subscribe(callback: (notifications: AppNotification[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.notifications);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.notifications));
  }
}

export const notificationService = new NotificationService();
