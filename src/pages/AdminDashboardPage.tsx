import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useTrips } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { PricingConfig, Trip, Driver, Vehicle, UserProfile, UserRole } from '../types';
import { LeafletMap } from '../components/LeafletMap';
import { OFFICIAL_ASSETS } from '../constants/assets';
import { soundService } from '../services/sound';
import { 
  ShieldAlert, 
  DollarSign, 
  Car, 
  Users, 
  Settings, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  Plus, 
  Receipt, 
  Printer, 
  X, 
  Navigation,
  Phone,
  Mail,
  Filter,
  Key,
  Edit2,
  Trash2,
  ShieldCheck,
  UserPlus,
  Eye,
  EyeOff,
  Search,
  Check,
  Calendar,
  RotateCcw,
  CalendarRange,
  Database,
  Download,
  Sparkles,
  Activity,
  CheckCircle2,
  Folder,
  Unlink,
  Layers,
  AlertCircle,
  Copy,
  Volume2,
  VolumeX,
  Grid,
  List,
  LayoutGrid,
  LogOut,
  Radio,
  Zap,
  Shield,
  UserCheck,
  ExternalLink,
  Tag,
  Bell,
  Building2,
  FileSpreadsheet,
  BarChart3,
  Flame,
  FileText
} from 'lucide-react';
import { queryTripsFromFirestore } from '../services/tripQueryService';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminSurgeTab } from '../components/admin/AdminSurgeTab';
import { AdminPartnersTab } from '../components/admin/AdminPartnersTab';
import { AdminInvoicesTab } from '../components/admin/AdminInvoicesTab';
import { AdminCouponsTab } from '../components/admin/AdminCouponsTab';
import { AdminNotificationsTab } from '../components/admin/AdminNotificationsTab';
import { AdminReportsTab } from '../components/admin/AdminReportsTab';
import { AdminApplicationsTab } from '../components/admin/AdminApplicationsTab';
import { Invoice, Coupon, BroadcastNotification, SurgeZone, CorporatePartner, DriverApplication } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const { 
    trips, 
    drivers, 
    vehicles, 
    customers,
    pricing, 
    updatePricing, 
    assignDriverToTrip, 
    updateTripStatus, 
    toggleDriverOnline, 
    addDriver,
    updateDriver,
    deleteDriver,
    unassignDriverVehicle,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    resetFleetToOfficial,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    emergencyAlerts,
    resolveEmergencyAlert,
    driverApplications,
    approveDriverApplication,
    rejectDriverApplication,
    deleteDriverApplication
  } = useTrips();

  const { user, logout, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'trips' | 'invoices' | 'drivers' | 'applications' | 'customers' | 'vehicles' | 'surge' | 'partners' | 'coupons' | 'reports' | 'notifications' | 'pricing'
  >('overview');
  const [overviewDateRange, setOverviewDateRange] = useState<'day' | 'week' | 'month' | 'total'>('month');
  const [tripFilter, setTripFilter] = useState<string>('all');
  const [selectedInvoiceTrip, setSelectedInvoiceTrip] = useState<Trip | null>(null);

  // 1. INVOICES STATE (Real data only, no demo cards)
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('aron_admin_invoices');
    if (saved) {
      const parsed: Invoice[] = JSON.parse(saved);
      return parsed.filter(i => !i.id.startsWith('FAKT-2026-100'));
    }
    return [];
  });

  // 2. SURGE ZONES STATE
  const [surgeZones, setSurgeZones] = useState<SurgeZone[]>(() => {
    const saved = localStorage.getItem('aron_admin_surge');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'sz1', name: 'Oslo S & Jernbanetorget', multiplier: 1.0, radiusKm: 1.5, centerLat: 59.9112, centerLng: 10.7505, lat: 59.9112, lng: 10.7505, isActive: false, category: 'Sentrum' },
      { id: 'sz2', name: 'Oslo Lufthavn Gardermoen', multiplier: 1.0, radiusKm: 4.0, centerLat: 60.1975, centerLng: 11.1004, lat: 60.1975, lng: 11.1004, isActive: false, category: 'Flyplass' },
      { id: 'sz3', name: 'Aker Brygge & Tjuvholmen', multiplier: 1.0, radiusKm: 1.2, centerLat: 59.9098, centerLng: 10.7247, lat: 59.9098, lng: 10.7247, isActive: false, category: 'Natteliv' },
      { id: 'sz4', name: 'Majorstuen & Bogstadveien', multiplier: 1.0, radiusKm: 1.5, centerLat: 59.9304, centerLng: 10.7144, lat: 59.9304, lng: 10.7144, isActive: false, category: 'Sentrum' },
      { id: 'sz5', name: 'Telenor Arena & Fornebu', multiplier: 1.0, radiusKm: 2.0, centerLat: 59.9022, centerLng: 10.6234, lat: 59.9022, lng: 10.6234, isActive: false, category: 'Arrangement' }
    ];
  });

  // 3. CORPORATE PARTNERS STATE (Real data only, no demo cards)
  const [partners, setPartners] = useState<CorporatePartner[]>(() => {
    const saved = localStorage.getItem('aron_admin_partners');
    if (saved) {
      const parsed: CorporatePartner[] = JSON.parse(saved);
      return parsed.filter(p => !['cp1', 'cp2', 'cp3'].includes(p.id));
    }
    return [];
  });

  // 4. COUPONS STATE (Real data only)
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('aron_admin_coupons');
    if (saved) {
      const parsed: Coupon[] = JSON.parse(saved);
      return parsed.filter(c => !['c1', 'c2', 'c3'].includes(c.id));
    }
    return [];
  });

  // 5. NOTIFICATIONS STATE (Real data only)
  const [notifications, setNotifications] = useState<BroadcastNotification[]>(() => {
    const saved = localStorage.getItem('aron_admin_notifications');
    if (saved) {
      const parsed: BroadcastNotification[] = JSON.parse(saved);
      return parsed.filter(n => !['n1', 'n2'].includes(n.id));
    }
    return [];
  });

  // HANDLERS FOR NEW TABS
  const handleCreateInvoice = (inv: Omit<Invoice, 'id'>) => {
    const newId = `FAKT-2026-${1000 + invoices.length + 1}`;
    const newInv: Invoice = {
      ...inv,
      id: newId
    };
    const updated = [newInv, ...invoices];
    setInvoices(updated);
    localStorage.setItem('aron_admin_invoices', JSON.stringify(updated));
    showToast(`Faktura ${newId} for ${newInv.customerName} opprettet.`, 'success');
  };

  const handleUpdateInvoiceStatus = (id: string, status: Invoice['status']) => {
    const updated = invoices.map(i => i.id === id ? { ...i, status } : i);
    setInvoices(updated);
    localStorage.setItem('aron_admin_invoices', JSON.stringify(updated));
    showToast(`Fakturastatus endret til ${status}.`, 'info');
  };

  const handleToggleSurge = (zoneId: string) => {
    const updated = surgeZones.map(z => z.id === zoneId ? { ...z, isActive: !z.isActive } : z);
    setSurgeZones(updated);
    localStorage.setItem('aron_admin_surge', JSON.stringify(updated));
    const target = updated.find(z => z.id === zoneId);
    showToast(`Surge-sone "${target?.name}" er nå ${target?.isActive ? 'AKTIVERT' : 'DEAKTIVERT'}.`, 'success');
  };

  const handleUpdateMultiplier = (zoneId: string, multiplier: number) => {
    const updated = surgeZones.map(z => z.id === zoneId ? { ...z, multiplier } : z);
    setSurgeZones(updated);
    localStorage.setItem('aron_admin_surge', JSON.stringify(updated));
    showToast(`Surgemultiplikator satt til ${multiplier}x`, 'info');
  };

  const handleCreatePartner = (p: Omit<CorporatePartner, 'id' | 'currentBalance' | 'createdAt'>) => {
    const newId = `cp_${Date.now()}`;
    const newP: CorporatePartner = {
      ...p,
      id: newId,
      email: p.contactEmail || p.email || '',
      phone: p.contactPhone || p.phone || '',
      contactEmail: p.contactEmail || p.email || '',
      contactPhone: p.contactPhone || p.phone || '',
      billingCycle: p.billingCycle || 'monthly',
      currentBalance: 0,
      createdAt: new Date().toISOString()
    };
    const updated = [newP, ...partners];
    setPartners(updated);
    localStorage.setItem('aron_admin_partners', JSON.stringify(updated));
    showToast(`Bedriftsavtale for ${newP.companyName} er lagret.`, 'success');
  };

  const handleCreateCoupon = (c: Omit<Coupon, 'id' | 'usedCount'>) => {
    const newId = `c_${Date.now()}`;
    const newC: Coupon = {
      ...c,
      id: newId,
      usedCount: 0
    };
    const updated = [newC, ...coupons];
    setCoupons(updated);
    localStorage.setItem('aron_admin_coupons', JSON.stringify(updated));
    showToast(`Rabattkode ${newC.code} er opprettet!`, 'success');
  };

  const handleToggleCoupon = (couponId: string) => {
    const updated = coupons.map(c => c.id === couponId ? { ...c, isActive: !c.isActive } : c);
    setCoupons(updated);
    localStorage.setItem('aron_admin_coupons', JSON.stringify(updated));
    showToast('Rabattkode status oppdatert.', 'info');
  };

  const handleDeleteCoupon = (couponId: string) => {
    const updated = coupons.filter(c => c.id !== couponId);
    setCoupons(updated);
    localStorage.setItem('aron_admin_coupons', JSON.stringify(updated));
    showToast('Rabattkode slettet.', 'info');
  };

  const handleSendNotification = (n: Omit<BroadcastNotification, 'id' | 'sentAt'>) => {
    const newId = `notif_${Date.now()}`;
    const newN: BroadcastNotification = {
      ...n,
      id: newId,
      sentAt: new Date().toISOString()
    };
    const updated = [newN, ...notifications];
    setNotifications(updated);
    localStorage.setItem('aron_admin_notifications', JSON.stringify(updated));
    showToast(`Varsel «${newN.title}» ble sendt ut!`, 'success');
  };

  // Search and date filters
  const [tripSearch, setTripSearch] = useState('');
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [tripDatePreset, setTripDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'this_month'>('all');

  const [driverSearch, setDriverSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerRoleFilter, setCustomerRoleFilter] = useState<'all' | 'customer' | 'driver' | 'admin'>('all');
  const [customerViewMode, setCustomerViewMode] = useState<'table' | 'cards'>('table');
  const [revealedCustomerPasswords, setRevealedCustomerPasswords] = useState<Record<string, boolean>>({});
  const [vehicleSearch, setVehicleSearch] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} kopiert til utklippstavlen!`, 'success');
    if (soundEnabled) soundService.playTripAcceptedSound(0.2);
  };

  const togglePasswordVisibility = (uid: string) => {
    setRevealedCustomerPasswords((prev) => ({ ...prev, [uid]: !prev[uid] }));
  };

  const applyTripDatePreset = (preset: 'all' | 'today' | '7days' | '30days' | 'this_month') => {
    setTripDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setTripStartDate('');
      setTripEndDate('');
    } else if (preset === 'today') {
      setTripStartDate(todayStr);
      setTripEndDate(todayStr);
    } else if (preset === '7days') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setTripStartDate(past7.toISOString().split('T')[0]);
      setTripEndDate(todayStr);
    } else if (preset === '30days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setTripStartDate(past30.toISOString().split('T')[0]);
      setTripEndDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setTripStartDate(firstDay.toISOString().split('T')[0]);
      setTripEndDate(todayStr);
    }
  };

  const handleResetTripFilters = () => {
    setTripSearch('');
    setTripFilter('all');
    setTripStartDate('');
    setTripEndDate('');
    setTripDatePreset('all');
  };

  // Direct Firestore query telemetry and state
  const [isQueryingFirestore, setIsQueryingFirestore] = useState(false);
  const [lastQueryStats, setLastQueryStats] = useState<{ durationMs: number; count: number; timestamp: string } | null>(null);

  const handleExecuteFirestoreQuery = async () => {
    setIsQueryingFirestore(true);
    try {
      const res = await queryTripsFromFirestore({
        customerName: tripSearch,
        startDate: tripStartDate,
        endDate: tripEndDate,
        status: tripFilter
      });
      setLastQueryStats({
        durationMs: res.queryDurationMs,
        count: res.totalFound,
        timestamp: new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      showToast(`Firestore-spørring fullført: ${res.totalFound} turer funnet (${res.queryDurationMs} ms)`);
    } catch (err: any) {
      showToast(`Feil ved spørring mot Firestore: ${err.message || 'Ukjent feil'}`);
    } finally {
      setIsQueryingFirestore(false);
    }
  };

  const exportTripsToCSV = () => {
    if (filteredTrips.length === 0) {
      showToast('Ingen turer å eksportere.');
      return;
    }

    const headers = ['Tur-ID', 'Dato', 'Kunde', 'Telefon', 'Hentested', 'Destinasjon', 'Sjåfør', 'Bil', 'Status', 'Beløp (NOK)', 'Tips (NOK)'];
    const rows = filteredTrips.map(t => [
      `"${t.id}"`,
      `"${new Date(t.createdAt).toLocaleString('no-NO')}"`,
      `"${(t.customerName || '').replace(/"/g, '""')}"`,
      `"${t.customerPhone || ''}"`,
      `"${(t.pickup?.address || '').replace(/"/g, '""')}"`,
      `"${(t.destination?.address || '').replace(/"/g, '""')}"`,
      `"${(t.driverName || 'Ikke tildelt').replace(/"/g, '""')}"`,
      `"${(t.vehicleLicensePlate || t.vehicleModel || '').replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.finalPrice || t.estimatedPrice || 0}"`,
      `"${t.tipAmount || 0}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AronTaxi_Turer_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Turrapport lastet ned som CSV.');
  };

  // Notification / Toast Alert State
  const [toastAlert, setToastAlert] = useState<{
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    if (type === 'success') {
      toast.success(msg);
    } else if (type === 'error') {
      toast.error(msg);
    } else if (type === 'warning') {
      toast.warning(msg);
    } else {
      toast.info(msg);
    }
    setToastAlert({ message: msg, type });
    setTimeout(() => setToastAlert(null), 4000);
  };

  // Custom In-App Confirmation Modal State (Reliable across all browsers and iframes)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // --- DRIVER MODALS & STATE ---
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showDriverPassword, setShowDriverPassword] = useState(false);

  const [newDriverForm, setNewDriverForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    licenseNumber: 'OS ',
    vehicleName: 'Tesla Model Y Juniper',
    vehiclePlate: '',
    isOnline: true
  });

  const [editDriverForm, setEditDriverForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    licenseNumber: '',
    vehicleName: '',
    vehiclePlate: '',
    isOnline: true,
    rating: 5.0
  });

  // --- CUSTOMER MODALS & STATE ---
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<UserProfile | null>(null);
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer' as UserRole,
    address: '',
    postalCode: ''
  });

  const [editCustomerForm, setEditCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer' as UserRole,
    address: '',
    postalCode: ''
  });

  // --- VEHICLE MODALS & STATE ---
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [newVehicleForm, setNewVehicleForm] = useState({
    model: 'Tesla Model Y Juniper',
    licensePlate: 'EK ',
    permitNumber: 'NO-OSLO-',
    year: 2026,
    color: 'Svart Perlemor (Midnight)',
    fuelType: 'Elektrisk' as const,
    status: 'active' as const,
    seats: 5,
    rangeKm: 550,
    assignedDriverId: '',
    assignedDriverName: ''
  });

  const [editVehicleForm, setEditVehicleForm] = useState({
    model: '',
    licensePlate: '',
    permitNumber: '',
    year: 2026,
    color: '',
    fuelType: 'Elektrisk' as any,
    status: 'active' as any,
    seats: 5,
    rangeKm: 550,
    assignedDriverId: '',
    assignedDriverName: ''
  });

  // Editable pricing state
  const [pricingForm, setPricingForm] = useState<PricingConfig>(pricing);
  const [pricingSaved, setPricingSaved] = useState(false);

  // Financial Metrics
  const completedTrips = trips.filter((t) => t.status === 'completed');
  const totalGrossRevenue = completedTrips.reduce((acc, t) => acc + (t.finalPrice || t.estimatedPrice), 0);
  const totalAronCommission = completedTrips.reduce((acc, t) => acc + (t.commissionAron || (t.finalPrice || t.estimatedPrice) * 0.15), 0);
  const totalDriverPayout = totalGrossRevenue - totalAronCommission;
  const activeOnlineDrivers = drivers.filter((d) => d.isOnline).length;
  const pendingJobs = trips.filter((t) => ['requested', 'searching_driver'].includes(t.status)).length;

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePricing(pricingForm);
    setPricingSaved(true);
    showToast('Takstene ble oppdatert og synkronisert med appen.');
    setTimeout(() => setPricingSaved(false), 3000);
  };

  // --- DRIVER HANDLERS ---
  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverForm.name || !newDriverForm.email || !newDriverForm.phone) return;

    await addDriver({
      name: newDriverForm.name,
      email: newDriverForm.email,
      phone: newDriverForm.phone,
      password: newDriverForm.password || 'aron1234',
      licenseNumber: newDriverForm.licenseNumber,
      vehicleId: newDriverForm.vehicleName.includes('Tesla') ? 'v1' : 'v2',
      vehicleName: newDriverForm.vehicleName,
      vehiclePlate: newDriverForm.vehiclePlate || 'EK 00000',
      isOnline: newDriverForm.isOnline,
      currentLocation: { lat: 59.9139, lng: 10.7522 }
    });

    setNewDriverForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      licenseNumber: 'OS ',
      vehicleName: 'Tesla Model Y Juniper',
      vehiclePlate: '',
      isOnline: true
    });
    setShowAddDriverModal(false);
    showToast(`Sjåfør ${newDriverForm.name} ble opprettet med passord.`);
  };

  const openEditDriver = (d: Driver) => {
    setEditingDriver(d);
    setEditDriverForm({
      name: d.name,
      email: d.email,
      phone: d.phone,
      password: d.password || '',
      licenseNumber: d.licenseNumber,
      vehicleName: d.vehicleName,
      vehiclePlate: d.vehiclePlate,
      isOnline: d.isOnline,
      rating: d.rating
    });
  };

  const handleSaveDriverEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;

    await updateDriver(editingDriver.id, {
      name: editDriverForm.name,
      email: editDriverForm.email,
      phone: editDriverForm.phone,
      password: editDriverForm.password,
      licenseNumber: editDriverForm.licenseNumber,
      vehicleName: editDriverForm.vehicleName,
      vehiclePlate: editDriverForm.vehiclePlate,
      isOnline: editDriverForm.isOnline,
      rating: editDriverForm.rating
    });

    setEditingDriver(null);
    showToast(`Sjåføropplysninger og passord for ${editDriverForm.name} ble oppdatert.`);
  };

  const handleDeleteDriver = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Slett sjåfør permanent',
      message: `Er du sikker på at du vil slette sjåføren "${name}"?`,
      details: 'Sjåføren vil miste tilgangen til sjåførportalen umiddelbart, og eventuell tilknyttet bil blir automatisk frigjort.',
      confirmLabel: 'Ja, slett sjåfør',
      cancelLabel: 'Avbryt',
      variant: 'danger',
      onConfirm: async () => {
        await deleteDriver(id);
        setConfirmModal(null);
        showToast(`Sjåføren "${name}" ble permanent slettet fra systemet.`, 'success');
      }
    });
  };

  // --- CUSTOMER HANDLERS ---
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.email) return;

    await addCustomer({
      name: newCustomerForm.name,
      email: newCustomerForm.email,
      phone: newCustomerForm.phone,
      password: newCustomerForm.password || 'kunde1234',
      role: newCustomerForm.role,
      address: newCustomerForm.address,
      postalCode: newCustomerForm.postalCode
    });

    setNewCustomerForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'customer',
      address: '',
      postalCode: ''
    });
    setShowAddCustomerModal(false);
    showToast(`Kunde ${newCustomerForm.name} ble opprettet.`);
  };

  const openEditCustomer = (c: UserProfile) => {
    setEditingCustomer(c);
    setEditCustomerForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      password: c.password || '',
      role: c.role || 'customer',
      address: c.address || '',
      postalCode: c.postalCode || ''
    });
  };

  const handleSaveCustomerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    await updateCustomer(editingCustomer.uid, {
      name: editCustomerForm.name,
      email: editCustomerForm.email,
      phone: editCustomerForm.phone,
      password: editCustomerForm.password,
      role: editCustomerForm.role,
      address: editCustomerForm.address,
      postalCode: editCustomerForm.postalCode
    });

    setEditingCustomer(null);
    showToast(`Kunde ${editCustomerForm.name} ble oppdatert.`);
  };

  const handleDeleteCustomer = (uid: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Slett kunde permanent',
      message: `Er du sikker på at du vil slette kunden "${name}"?`,
      details: 'Brukerkontoen og tilhørende data blir slettet.',
      confirmLabel: 'Ja, slett kunde',
      cancelLabel: 'Avbryt',
      variant: 'danger',
      onConfirm: async () => {
        await deleteCustomer(uid);
        setConfirmModal(null);
        showToast(`Kunden "${name}" ble slettet.`, 'success');
      }
    });
  };

  const handleSendResetEmail = async (email: string) => {
    const res = await resetPassword(email);
    if (res.success) {
      showToast(`Tilbakestillingslenke for passord ble sendt til ${email}`);
    } else {
      showToast(`Obs: ${res.error || 'Kunne ikke sende e-post'}`);
    }
  };

  // --- VEHICLE HANDLERS ---
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleForm.model || !newVehicleForm.licensePlate) return;

    const img = newVehicleForm.model.includes('Mercedes') 
      ? OFFICIAL_ASSETS.mercedesCars[0] 
      : OFFICIAL_ASSETS.teslaCars[0];

    await addVehicle({
      model: newVehicleForm.model,
      licensePlate: newVehicleForm.licensePlate,
      permitNumber: newVehicleForm.permitNumber,
      year: Number(newVehicleForm.year) || 2026,
      color: newVehicleForm.color,
      fuelType: newVehicleForm.fuelType,
      status: newVehicleForm.status,
      seats: Number(newVehicleForm.seats) || 5,
      rangeKm: Number(newVehicleForm.rangeKm) || 550,
      assignedDriverId: newVehicleForm.assignedDriverId,
      assignedDriverName: newVehicleForm.assignedDriverName,
      imageUrls: [img],
      features: ['Skinnseter', 'Trådløs lading', 'Premium lydanlegg', 'Panoramatak', 'AC Klimakontroll']
    });

    setNewVehicleForm({
      model: 'Tesla Model Y Juniper',
      licensePlate: 'EK ',
      permitNumber: 'NO-OSLO-',
      year: 2026,
      color: 'Svart Perlemor (Midnight)',
      fuelType: 'Elektrisk',
      status: 'active',
      seats: 5,
      rangeKm: 550,
      assignedDriverId: '',
      assignedDriverName: ''
    });
    setShowAddVehicleModal(false);
    showToast(`Bilen ${newVehicleForm.model} (${newVehicleForm.licensePlate}) ble lagt til i flåten.`);
  };

  const openEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setEditVehicleForm({
      model: v.model,
      licensePlate: v.licensePlate,
      permitNumber: v.permitNumber,
      year: v.year,
      color: v.color,
      fuelType: v.fuelType,
      status: v.status,
      seats: v.seats,
      rangeKm: v.rangeKm,
      assignedDriverId: v.assignedDriverId || '',
      assignedDriverName: v.assignedDriverName || ''
    });
  };

  const handleSaveVehicleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    await updateVehicle(editingVehicle.id, {
      model: editVehicleForm.model,
      licensePlate: editVehicleForm.licensePlate,
      permitNumber: editVehicleForm.permitNumber,
      year: Number(editVehicleForm.year) || 2026,
      color: editVehicleForm.color,
      fuelType: editVehicleForm.fuelType,
      status: editVehicleForm.status,
      seats: Number(editVehicleForm.seats) || 5,
      rangeKm: Number(editVehicleForm.rangeKm) || 550,
      assignedDriverId: editVehicleForm.assignedDriverId,
      assignedDriverName: editVehicleForm.assignedDriverName
    });

    setEditingVehicle(null);
    showToast(`Kjøretøyet ${editVehicleForm.model} (${editVehicleForm.licensePlate}) ble oppdatert.`);
  };

  const [adminLightboxImg, setAdminLightboxImg] = useState<{ url: string; title: string } | null>(null);

  const handleUnassignDriverVehicle = (driverId: string, driverName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Fjern biltildeling',
      message: `Er du sikker på at du vil fjerne bil-tildelingen for sjåfør "${driverName}"?`,
      details: 'Sjåføren vil stå uten bil i systemet til en ny bil tildeles.',
      confirmLabel: 'Fjern bil fra sjåfør',
      cancelLabel: 'Avbryt',
      variant: 'warning',
      onConfirm: async () => {
        await unassignDriverVehicle(driverId);
        setConfirmModal(null);
        showToast(`Biltildeling ble fjernet for ${driverName}.`, 'info');
      }
    });
  };

  const handleResetFleetToOfficial = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Nullstill flåte til standard',
      message: 'Er du sikker på at du vil nullstille flåten til de offisielle Aron Taxi-bilene (Tesla Model Y & Mercedes EQE)?',
      details: 'Dette vil fjerne tilpassede biler og nullstille sjåførtildelinger.',
      confirmLabel: 'Nullstill flåte',
      cancelLabel: 'Avbryt',
      variant: 'warning',
      onConfirm: async () => {
        await resetFleetToOfficial();
        setConfirmModal(null);
        showToast('Bilparken er tilbakestilt til offisielle Aron Taxi biler. Sjåfører er frigjort.', 'success');
      }
    });
  };

  const handleDeleteVehicle = (id: string, model: string, plate: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Slett bil fra flåten',
      message: `Er du sikker på at du vil slette bilen "${model} (${plate})"?`,
      details: 'Kjøretøyet slettes permanent fra databasen. Eventuell tilknyttet sjåfør blir frigjort.',
      confirmLabel: 'Ja, slett bil',
      cancelLabel: 'Avbryt',
      variant: 'danger',
      onConfirm: async () => {
        await deleteVehicle(id);
        setConfirmModal(null);
        showToast(`Kjøretøyet "${model} (${plate})" ble slettet.`, 'success');
      }
    });
  };

  const filteredTrips = trips.filter((t) => {
    // 1. Status Filter
    if (tripFilter === 'active') {
      if (['completed', 'cancelled'].includes(t.status)) return false;
    } else if (tripFilter !== 'all') {
      if (t.status !== tripFilter) return false;
    }

    // 2. Customer Name, Phone, Address, ID, Driver Search
    if (tripSearch.trim()) {
      const q = tripSearch.toLowerCase().trim();
      const matchCustomer = t.customerName ? t.customerName.toLowerCase().includes(q) : false;
      const matchPhone = t.customerPhone ? t.customerPhone.toLowerCase().includes(q) : false;
      const matchPickup = t.pickup?.address ? t.pickup.address.toLowerCase().includes(q) : false;
      const matchDest = t.destination?.address ? t.destination.address.toLowerCase().includes(q) : false;
      const matchId = t.id ? t.id.toLowerCase().includes(q) : false;
      const matchDriver = t.driverName ? t.driverName.toLowerCase().includes(q) : false;
      const matchPlate = t.vehiclePlate ? t.vehiclePlate.toLowerCase().includes(q) : false;

      if (!matchCustomer && !matchPhone && !matchPickup && !matchDest && !matchId && !matchDriver && !matchPlate) {
        return false;
      }
    }

    // 3. Date Range Filter
    if (tripStartDate) {
      const tripDateStr = new Date(t.createdAt).toISOString().split('T')[0];
      if (tripDateStr < tripStartDate) return false;
    }
    if (tripEndDate) {
      const tripDateStr = new Date(t.createdAt).toISOString().split('T')[0];
      if (tripDateStr > tripEndDate) return false;
    }

    return true;
  });

  const filteredTripsGrossRevenue = filteredTrips.reduce((acc, t) => acc + (t.finalPrice || t.estimatedPrice || 0), 0);
  const isTripFilterActive = tripSearch.trim() !== '' || tripFilter !== 'all' || tripStartDate !== '' || tripEndDate !== '' || tripDatePreset !== 'all';

  const filteredDrivers = drivers.filter((d) => {
    const q = driverSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.email && d.email.toLowerCase().includes(q)) ||
      (d.phone && d.phone.toLowerCase().includes(q)) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q)) ||
      (d.vehiclePlate && d.vehiclePlate.toLowerCase().includes(q)) ||
      (d.vehicleName && d.vehicleName.toLowerCase().includes(q))
    );
  });

  const filteredCustomers = customers.filter((c) => {
    if (customerRoleFilter !== 'all') {
      const role = c.role || 'customer';
      if (role !== customerRoleFilter) return false;
    }
    const q = customerSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.postalCode && c.postalCode.toLowerCase().includes(q)) ||
      (c.uid && c.uid.toLowerCase().includes(q))
    );
  });

  const filteredVehicles = vehicles.filter((v) => {
    const q = vehicleSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (v.model && v.model.toLowerCase().includes(q)) ||
      (v.licensePlate && v.licensePlate.toLowerCase().includes(q)) ||
      (v.permitNumber && v.permitNumber.toLowerCase().includes(q)) ||
      (v.assignedDriverName && v.assignedDriverName.toLowerCase().includes(q))
    );
  });

  const activeEmergencyAlerts = emergencyAlerts.filter((a) => a.status === 'active');

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      <Header />

      {/* TOAST ALERT POPUP / VARSEL */}
      {toastAlert && (
        <div className={`fixed top-20 right-4 sm:right-8 z-50 max-w-md w-auto p-4 rounded-2xl shadow-2xl flex items-start gap-3 text-xs border backdrop-blur-xl animate-in slide-in-from-top-4 duration-200 transition-all ${
          toastAlert.type === 'error'
            ? 'bg-rose-950/95 border-rose-500/50 text-rose-200 shadow-rose-950/50'
            : toastAlert.type === 'warning'
            ? 'bg-amber-950/95 border-amber-500/50 text-amber-200 shadow-amber-950/50'
            : toastAlert.type === 'info'
            ? 'bg-blue-950/95 border-blue-500/50 text-blue-200 shadow-blue-950/50'
            : 'bg-[#121722]/95 border-[#D4AF37]/60 text-[#F5F2ED] shadow-[#D4AF37]/15'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            toastAlert.type === 'error'
              ? 'bg-rose-500/20 text-rose-400'
              : toastAlert.type === 'warning'
              ? 'bg-amber-500/20 text-amber-400'
              : toastAlert.type === 'info'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-[#D4AF37]/20 text-[#D4AF37]'
          }`}>
            {toastAlert.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : toastAlert.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : toastAlert.type === 'info' ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <div className="font-bold text-[11px] uppercase tracking-wider text-[#D4AF37]">
              {toastAlert.type === 'error' ? 'Handlingsfeil' : toastAlert.type === 'warning' ? 'Viktig Varsel' : 'Systemvarsel'}
            </div>
            <p className="text-slate-200 font-medium leading-relaxed mt-0.5">{toastAlert.message}</p>
          </div>
          <button
            onClick={() => setToastAlert(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* ========================================================= */}
        {/* CRITICAL EMERGENCY MONITOR (DISPATCH SOS ALERT) */}
        {/* ========================================================= */}
        {activeEmergencyAlerts.length > 0 && (
          <div className="bg-rose-950/90 border-2 border-rose-500 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-full font-black text-[10px] uppercase">
                      🚨 AKUTT NØDVARSEL ({activeEmergencyAlerts.length})
                    </span>
                    <span className="text-xs text-rose-300 font-bold">Sentralovervåking aktiv</span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">
                    Sjåfør har utløst nødvarsel / SOS
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {activeEmergencyAlerts.map((alert, alertIdx) => (
                <div
                  key={`admin-alert-${alert.id || alertIdx}`}
                  className="bg-black/70 border border-rose-500/50 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        {alert.driverName}
                        <span className="text-[10px] font-mono text-slate-300 px-2 py-0.5 bg-white/10 rounded-md">
                          {alert.vehiclePlate || 'Bil ukjent'}
                        </span>
                      </h3>
                      <p className="text-xs text-rose-300 font-semibold mt-0.5">
                        {alert.reason || 'Taus alarm utløst fra sjåførkonsoll'}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Varslet: {new Date(alert.createdAt).toLocaleTimeString('no-NO')}
                      </span>
                    </div>

                    <button
                      onClick={async () => {
                        await resolveEmergencyAlert(alert.id);
                        showToast(`Nødvarsel for sjåfør ${alert.driverName} er markert som løst.`);
                      }}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-emerald-400 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Marker Løst
                    </button>
                  </div>

                  {alert.location && (
                    <div className="p-2.5 bg-white/5 rounded-xl text-xs space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Sanntidsposisjon:</span>
                      <p className="text-white font-mono text-[11px]">
                        Lat: {alert.location.lat?.toFixed(5)}, Lng: {alert.location.lng?.toFixed(5)}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${alert.location.lat},${alert.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#D4AF37] hover:underline text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3" />
                        Åpne GPS-posisjon i kart
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {alert.driverPhone && (
                      <a
                        href={`tel:${alert.driverPhone}`}
                        className="flex-1 py-2 bg-[#D4AF37] hover:bg-[#C5A028] text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Ring Sjåfør
                      </a>
                    )}
                    <a
                      href="tel:112"
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Ring Politi (112)
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* ADMIN DISPATCH HEADER (DRIVER/BOLT STYLE) */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#34D186] text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-[#34D186]/20 shrink-0">
              <Radio className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#34D186]/20 text-[#34D186] border border-[#34D186]/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#34D186] animate-pulse" />
                  LIVE DISPATCH SENTRAL
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeOnlineDrivers} aktive biler på vakt
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Aron Taxi · Admin Sentral
              </h1>
              <p className="text-xs text-slate-400">
                Full kontroll over kunder, sjåfører, biler, turer, passord og takster
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) soundService.playTripAcceptedSound(0.4);
                showToast(soundEnabled ? 'Lydvarsler slått av' : 'Lydvarsler aktivert', 'info');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                soundEnabled 
                  ? 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
              }`}
              title={soundEnabled ? 'Slå av lydvarsler' : 'Slå på lydvarsler'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#34D186]" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Lyd På' : 'Lyd Av'}</span>
            </button>

            <button
              onClick={() => setShowAddDriverModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold uppercase text-[11px] tracking-wider rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#34D186]" />
              Ny Sjåfør
            </button>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black uppercase text-[11px] tracking-wider rounded-xl transition-all shadow-lg shadow-[#34D186]/20 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Ny Kunde
            </button>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold uppercase text-[11px] tracking-wider rounded-xl transition-all cursor-pointer"
            >
              <Car className="w-3.5 h-3.5 text-[#D4AF37]" />
              Ny Bil
            </button>
          </div>
        </div>

        {/* METRICS DASHBOARD (BOLT / DRIVER STYLE) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-xs">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-xl hover:border-[#34D186]/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400">
              <span className="uppercase font-bold text-[10px] tracking-wider">Totalt Brutto</span>
              <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="block font-display text-xl sm:text-2xl font-black text-[#D4AF37]">{totalGrossRevenue} NOK</span>
            <span className="text-[10px] text-slate-500 font-medium">Samlet omsetning</span>
          </div>

          <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-xl hover:border-[#34D186]/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400">
              <span className="uppercase font-bold text-[10px] tracking-wider">Aron Provisjon</span>
              <div className="w-6 h-6 rounded-lg bg-[#34D186]/15 text-[#34D186] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="block font-display text-xl sm:text-2xl font-black text-[#34D186]">{Math.round(totalAronCommission)} NOK</span>
            <span className="text-[10px] text-slate-500 font-medium">15% sentralandel</span>
          </div>

          <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-xl hover:border-[#34D186]/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400">
              <span className="uppercase font-bold text-[10px] tracking-wider">Sjåfører På Vakt</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Car className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="block font-display text-xl sm:text-2xl font-black text-emerald-400">{activeOnlineDrivers} / {drivers.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Aktive i Oslo</span>
          </div>

          <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-xl hover:border-[#34D186]/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400">
              <span className="uppercase font-bold text-[10px] tracking-wider">Kunder</span>
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="block font-display text-xl sm:text-2xl font-black text-white">{customers.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Registrerte brukere</span>
          </div>

          <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-xl hover:border-[#34D186]/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400">
              <span className="uppercase font-bold text-[10px] tracking-wider">Biler i Flåten</span>
              <div className="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Key className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="block font-display text-xl sm:text-2xl font-black text-cyan-400">{vehicles.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Tesla & Mercedes</span>
          </div>

          <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-xl hover:border-[#34D186]/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400">
              <span className="uppercase font-bold text-[10px] tracking-wider">Ventende Jobs</span>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${pendingJobs > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'}`}>
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className={`block font-display text-xl sm:text-2xl font-black ${pendingJobs > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {pendingJobs}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Ubetjente turer</span>
          </div>
        </div>

        {/* NAVIGATION TABS (DRIVER-STYLE FLOATING PILL BAR) */}
        <div className="bg-[#111827] border border-white/10 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto shadow-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Live Dispatch & Kart
            {pendingJobs > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${
                activeTab === 'overview' ? 'bg-slate-950 text-[#34D186]' : 'bg-amber-500 text-slate-950'
              }`}>
                {pendingJobs}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'trips'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Turer ({trips.length})
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Fakturaer ({invoices.length})
          </button>

          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            Sjåfører ({drivers.length})
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Søknader ({driverApplications.length})
            {driverApplications.filter((a) => a.status === 'pending').length > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${
                activeTab === 'applications' ? 'bg-slate-950 text-[#34D186]' : 'bg-amber-500 text-slate-950 animate-pulse'
              }`}>
                {driverApplications.filter((a) => a.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Kunder ({customers.length})
          </button>

          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Flåte & Biler ({vehicles.length})
          </button>

          <button
            onClick={() => setActiveTab('surge')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'surge'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Surge & Hotspots
          </button>

          <button
            onClick={() => setActiveTab('partners')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'partners'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Bedriftsavtaler ({partners.length})
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Rabattkoder ({coupons.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Regnskap & MVA
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Varsler & SMS
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-[#34D186] text-slate-950 font-black shadow-lg shadow-[#34D186]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Takster
          </button>
        </div>

        {/* OVERVIEW / LIVE DISPATCH TAB */}
        {activeTab === 'overview' && (
          <AdminOverviewTab
            trips={trips}
            drivers={drivers}
            vehicles={vehicles}
            customers={customers}
            assignDriverToTrip={assignDriverToTrip}
            updateTripStatus={updateTripStatus}
            dateRange={overviewDateRange}
            setDateRange={setOverviewDateRange}
          />
        )}

        {/* TRIPS TAB */}
        {activeTab === 'trips' && (
          <div className="space-y-6">
            <div className="bg-[#121722]/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
              
              {/* HEADER & METRIC SUMMARY */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-white/10">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#F5F2ED] flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#D4AF37]" />
                    Turoversikt & Fakturaer
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Søk og filtrer blant alle bestillinger, sjekk statuser, sjåførtildeling og generer kvitteringer.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-[#0A0D14] border border-white/10 rounded-2xl px-4 py-2 text-xs">
                  <div className="text-left">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Treff</span>
                    <span className="font-bold text-[#D4AF37] font-mono">
                      {filteredTrips.length} <span className="text-slate-400 font-normal">/ {trips.length} turer</span>
                    </span>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="text-left">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Sum beløp</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {filteredTripsGrossRevenue.toLocaleString('no-NO')} NOK
                    </span>
                  </div>
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS COMPONENT */}
              <div className="p-5 bg-[#0D121D] border border-white/10 rounded-2xl space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Filter className="w-4 h-4 text-[#D4AF37]" />
                      Søk & Datofiltrering
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Firestore Sanntid
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleExecuteFirestoreQuery}
                      disabled={isQueryingFirestore}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1.5 rounded-xl border border-amber-400/20 transition-all font-semibold disabled:opacity-50"
                      title="Utfør direkte indekssøk mot Firestore"
                    >
                      <Database className={`w-3.5 h-3.5 ${isQueryingFirestore ? 'animate-spin' : ''}`} />
                      {isQueryingFirestore ? 'Søker i Firestore...' : 'Søk i Firestore'}
                    </button>

                    <button
                      type="button"
                      onClick={exportTripsToCSV}
                      disabled={filteredTrips.length === 0}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all font-semibold disabled:opacity-40"
                      title="Last ned filtrerte turer som CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      Eksporter CSV
                    </button>

                    {isTripFilterActive && (
                      <button
                        onClick={handleResetTripFilters}
                        className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-400/10 hover:bg-rose-400/20 px-3 py-1.5 rounded-xl border border-rose-400/20 transition-all font-semibold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Nullstill
                      </button>
                    )}
                  </div>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tripSearch}
                    onChange={(e) => setTripSearch(e.target.value)}
                    placeholder="Søk etter kundenavn, telefon, e-post, tur-ID, hentested, destinasjon, sjåfør..."
                    className="w-full pl-11 pr-10 py-3 bg-[#121722] border border-white/10 rounded-xl text-xs text-[#F5F2ED] placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition-all shadow-inner"
                  />
                  {tripSearch && (
                    <button
                      onClick={() => setTripSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                      title="Tøm søk"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* DATE RANGE & PRESETS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
                  
                  {/* Quick presets */}
                  <div className="lg:col-span-6 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                      <CalendarRange className="w-3.5 h-3.5 text-slate-500" />
                      Hurtigvalg:
                    </span>
                    {[
                      { id: 'all', label: 'Alle datoer' },
                      { id: 'today', label: 'I dag' },
                      { id: '7days', label: 'Siste 7 dager' },
                      { id: '30days', label: 'Siste 30 dager' },
                      { id: 'this_month', label: 'Denne mnd' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyTripDatePreset(p.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          tripDatePreset === p.id && !tripStartDate && !tripEndDate && p.id === 'all'
                            ? 'bg-[#D4AF37] text-slate-950 font-bold'
                            : tripDatePreset === p.id
                            ? 'bg-[#D4AF37] text-slate-950 font-bold'
                            : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Manual Date Pickers */}
                  <div className="lg:col-span-6 flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-1.5 bg-[#121722] border border-white/10 rounded-xl px-3 py-1.5 text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Fra:</span>
                      <input
                        type="date"
                        value={tripStartDate}
                        onChange={(e) => {
                          setTripStartDate(e.target.value);
                          setTripDatePreset('all');
                        }}
                        className="bg-transparent text-slate-200 text-xs focus:outline-none w-full font-mono"
                      />
                    </div>

                    <div className="flex-1 flex items-center gap-1.5 bg-[#121722] border border-white/10 rounded-xl px-3 py-1.5 text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Til:</span>
                      <input
                        type="date"
                        value={tripEndDate}
                        onChange={(e) => {
                          setTripEndDate(e.target.value);
                          setTripDatePreset('all');
                        }}
                        className="bg-transparent text-slate-200 text-xs focus:outline-none w-full font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* STATUS FILTER BUTTONS & TELEMETRY */}
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 mr-1">Status:</span>
                    {[
                      { id: 'all', label: 'Alle' },
                      { id: 'active', label: 'Aktive turer' },
                      { id: 'requested', label: 'Forespurt' },
                      { id: 'driver_arriving', label: 'Sjåfør på vei' },
                      { id: 'trip_started', label: 'Underveis' },
                      { id: 'completed', label: 'Fullførte' },
                      { id: 'cancelled', label: 'Avbrutte' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setTripFilter(f.id)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                          tripFilter === f.id
                            ? 'bg-[#D4AF37] text-slate-950 font-black'
                            : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {lastQueryStats && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                      <Activity className="w-3 h-3 text-[#D4AF37]" />
                      <span>Siste spørring kl. {lastQueryStats.timestamp}: {lastQueryStats.count} treff ({lastQueryStats.durationMs}ms)</span>
                    </div>
                  )}
                </div>

              </div>

              {/* TRIPS LIST */}
              <div className="space-y-4 text-xs">
                {filteredTrips.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-[#0D121D] rounded-2xl border border-white/5 space-y-3">
                    <Search className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300 text-sm">Ingen turer samsvarer med søket eller filteret</p>
                    <p className="text-xs text-slate-500">Prøv å endre søkeordet, justere datointervallet eller nullstille filtrene.</p>
                    {isTripFilterActive && (
                      <button
                        onClick={handleResetTripFilters}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-400 transition-all shadow-md"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Vis alle turer
                      </button>
                    )}
                  </div>
                ) : (
                  filteredTrips.map((t, tripIdx) => (
                    <div key={`admin-trip-row-${t.id || tripIdx}`} className="p-5 bg-[#0D121D] rounded-2xl border border-white/10 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-white/10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#D4AF37]">{t.id}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(t.createdAt).toLocaleString('no-NO')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedInvoiceTrip(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[#D4AF37] rounded-lg text-xs font-bold transition-all"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Faktura / Kvittering
                          </button>

                          <select
                            value={t.status}
                            onChange={(e) => updateTripStatus(t.id, e.target.value as any)}
                            className="bg-[#121722] border border-white/10 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-bold"
                          >
                            <option value="requested">requested</option>
                            <option value="searching_driver">searching_driver</option>
                            <option value="driver_assigned">driver_assigned</option>
                            <option value="driver_arriving">driver_arriving</option>
                            <option value="driver_arrived">driver_arrived</option>
                            <option value="trip_started">trip_started</option>
                            <option value="completed">completed</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                        <div><b>Kunde:</b> {t.customerName} ({t.customerPhone})</div>
                        <div><b>Sjåfør:</b> {t.driverName || 'Ikke tildelt'} ({t.vehicleModel || '–'})</div>
                        <div className="truncate"><b>Fra:</b> {t.pickup?.address || '–'}</div>
                        <div className="truncate"><b>Til:</b> {t.destination?.address || '–'}</div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="font-mono text-xs">
                          <span className="font-bold text-[#F5F2ED]">{t.finalPrice || t.estimatedPrice} NOK</span>
                          <span className="text-slate-400 ml-2">({t.distanceKm} km · {t.durationMinutes} min)</span>
                          {t.tip ? <span className="text-[#D4AF37] ml-2 font-bold">+ {t.tip} NOK tips</span> : null}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px]">Tildel sjåfør:</span>
                          {drivers.map((d, dIdx) => (
                            <button
                              key={`admin-trip-assign-${t.id || tripIdx}-${d.id || dIdx}`}
                              onClick={() => assignDriverToTrip(t.id, d.id)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                                t.driverId === d.id
                                  ? 'bg-[#D4AF37] text-slate-950 font-black'
                                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              {d.name.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* DRIVERS TAB (FULL EDIT & PASSWORD CONTROL) */}
        {activeTab === 'drivers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#F5F2ED]">
                  Sjåførstyring & Tilgang
                </h2>
                <p className="text-xs text-slate-400">
                  Endre e-post, opprett og endre passord, tildel biler og løyvenummer
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Søk sjåfør, e-post, skilt..."
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#121722] border border-white/10 rounded-xl text-xs text-[#F5F2ED] placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <button
                  onClick={() => setShowAddDriverModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Opprett Sjåfør
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDrivers.map((d, dIdx) => (
                <div key={`admin-driver-card-${d.id || dIdx}`} className="bg-[#121722]/90 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold shrink-0">
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#F5F2ED] text-base">{d.name}</h3>
                          <span className="font-mono text-[10px] text-slate-500">({d.id})</span>
                        </div>
                        <p className="text-xs text-[#D4AF37] font-semibold">{d.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleDriverOnline(d.id, !d.isOnline)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${
                        d.isOnline
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : 'bg-white/5 text-slate-500 border-white/10 hover:border-slate-400'
                      }`}
                    >
                      {d.isOnline ? 'ONLINE' : 'OFFLINE'}
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefon:</span>
                      <span className="font-semibold text-slate-200">{d.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400 flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-amber-400" /> Passord:</span>
                      <span className="font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                        {d.password ? d.password : 'Standard (aron1234)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Løyvenummer:</span>
                      <span className="font-mono font-semibold text-[#D4AF37]">{d.licenseNumber}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Tildelt Kjøretøy:</span>
                      {d.vehicleName ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{d.vehicleName} <b className="text-emerald-400">({d.vehiclePlate})</b></span>
                          <button
                            onClick={() => handleUnassignDriverVehicle(d.id, d.name)}
                            className="px-2 py-0.5 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                            title="Fjern bil fra denne sjåføren"
                          >
                            <Unlink className="w-3 h-3" />
                            Fjern bil
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-white/5 text-slate-400 rounded text-[10px] font-medium italic">
                          Ingen bil tildelt
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Dagens Inntekt:</span>
                      <span className="font-bold text-[#D4AF37]">{d.todayEarnings} NOK</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Fullførte Turer:</span>
                      <span className="font-bold text-slate-200">{d.totalTrips} turer</span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      onClick={() => openEditDriver(d)}
                      className="flex-1 py-2 px-3 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Endre Info & Passord
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(d.id, d.name)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl transition-all cursor-pointer"
                      title="Slett sjåfør"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOMERS & USERS TAB (DRIVER-STYLE MANAGEMENT) */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* TOP HEADER & STATS */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#34D186]/20 text-[#34D186] border border-[#34D186]/30">
                    Brukerdatabase
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {filteredCustomers.length} av {customers.length} brukere vist
                  </span>
                </div>
                <h2 className="font-display text-2xl font-black text-white">
                  Kunder & Brukeradministrasjon
                </h2>
                <p className="text-xs text-slate-400 max-w-xl">
                  Full frihet til å redigere navn, e-post, telefon, adresser, roller og passord, eller slette kundekontoer permanent.
                </p>
              </div>

              {/* STATS PILLS */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Kunder</span>
                  <span className="font-bold text-white font-mono">{customers.filter(c => !c.role || c.role === 'customer').length}</span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <span className="text-[10px] text-amber-400 block uppercase font-bold">Sjåførkontoer</span>
                  <span className="font-bold text-amber-300 font-mono">{customers.filter(c => c.role === 'driver').length}</span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                  <span className="text-[10px] text-rose-400 block uppercase font-bold">Admin</span>
                  <span className="font-bold text-rose-300 font-mono">{customers.filter(c => c.role === 'admin').length}</span>
                </div>
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#34D186]/20 cursor-pointer shrink-0 ml-auto lg:ml-0"
                >
                  <UserPlus className="w-4 h-4" />
                  Opprett Ny Kunde
                </button>
              </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Role filter buttons */}
              <div className="bg-[#111827] border border-white/10 p-1 rounded-xl flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setCustomerRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    customerRoleFilter === 'all'
                      ? 'bg-white/15 text-white font-extrabold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Alle ({customers.length})
                </button>
                <button
                  onClick={() => setCustomerRoleFilter('customer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    customerRoleFilter === 'customer'
                      ? 'bg-[#34D186] text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Vanlige Kunder ({customers.filter(c => !c.role || c.role === 'customer').length})
                </button>
                <button
                  onClick={() => setCustomerRoleFilter('driver')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    customerRoleFilter === 'driver'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sjåførkontoer ({customers.filter(c => c.role === 'driver').length})
                </button>
                <button
                  onClick={() => setCustomerRoleFilter('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    customerRoleFilter === 'admin'
                      ? 'bg-rose-500 text-white font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Administratorer ({customers.filter(c => c.role === 'admin').length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Search input */}
                <div className="relative flex-1 md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Søk navn, e-post, tlf, postnr..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-[#111827] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#34D186]"
                  />
                  {customerSearch && (
                    <button
                      onClick={() => setCustomerSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className="bg-[#111827] border border-white/10 p-1 rounded-xl flex items-center gap-1">
                  <button
                    onClick={() => setCustomerViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      customerViewMode === 'table' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Tabellvisning"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCustomerViewMode('cards')}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      customerViewMode === 'cards' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Kortvisning"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* CUSTOMER LIST: TABLE OR CARDS */}
            {customerViewMode === 'table' ? (
              <div className="bg-[#111827] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0B0F19] border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="py-3.5 px-4">Bruker & Navn</th>
                        <th className="py-3.5 px-4">E-postadresse</th>
                        <th className="py-3.5 px-4">Telefon</th>
                        <th className="py-3.5 px-4">Passord</th>
                        <th className="py-3.5 px-4">Rolle</th>
                        <th className="py-3.5 px-4">Adresse & Postnr</th>
                        <th className="py-3.5 px-4 text-right">Handlinger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            Ingen kunder funnet med søkekriteriene.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c, cIdx) => {
                          const isRevealed = revealedCustomerPasswords[c.uid];
                          return (
                            <tr key={`admin-customer-table-row-${c.uid || cIdx}`} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3.5 px-4 font-semibold text-white">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-xl font-black flex items-center justify-center text-xs shrink-0 border ${
                                    c.role === 'admin'
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                      : c.role === 'driver'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : 'bg-[#34D186]/20 text-[#34D186] border-[#34D186]/30'
                                  }`}>
                                    {c.name ? c.name.slice(0, 2).toUpperCase() : 'CU'}
                                  </div>
                                  <div>
                                    <span className="block font-bold text-white text-xs">{c.name || 'Uten navn'}</span>
                                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px] block">
                                      {c.uid}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white font-medium">{c.email}</span>
                                  <button
                                    onClick={() => copyToClipboard(c.email, 'E-post')}
                                    className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                                    title="Kopier e-post"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                {c.phone ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-300 font-mono">{c.phone}</span>
                                    <button
                                      onClick={() => copyToClipboard(c.phone || '', 'Telefon')}
                                      className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                                      title="Kopier telefon"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic">–</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                                    {isRevealed ? (c.password || 'kunde1234') : '••••••••'}
                                  </span>
                                  <button
                                    onClick={() => togglePasswordVisibility(c.uid)}
                                    className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    title={isRevealed ? 'Skjul passord' : 'Vis passord'}
                                  >
                                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(c.password || 'kunde1234', 'Passord')}
                                    className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    title="Kopier passord"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                  c.role === 'admin'
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : c.role === 'driver'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : 'bg-[#34D186]/15 text-[#34D186] border-[#34D186]/30'
                                }`}>
                                  {c.role === 'admin' ? 'Admin' : c.role === 'driver' ? 'Sjåfør' : 'Kunde'}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-slate-300">
                                <div className="truncate max-w-xs">
                                  {c.address ? (
                                    <span>{c.address} {c.postalCode ? `(${c.postalCode})` : ''}</span>
                                  ) : (
                                    <span className="text-slate-500 italic">Ingen adresse</span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleSendResetEmail(c.email)}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all cursor-pointer"
                                    title="Send tilbakestill passord-epost"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                                  </button>
                                  <button
                                    onClick={() => openEditCustomer(c)}
                                    className="p-2 bg-white/10 hover:bg-[#34D186] hover:text-slate-950 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
                                    title="Rediger kunde"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline text-[11px]">Rediger</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCustomer(c.uid, c.name)}
                                    className="p-2 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white rounded-xl transition-all cursor-pointer"
                                    title="Slett kunde permanent"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* CARD / GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 bg-[#111827] border border-white/10 rounded-2xl">
                    Ingen kunder funnet med søkekriteriene.
                  </div>
                ) : (
                  filteredCustomers.map((c, cIdx) => {
                    const isRevealed = revealedCustomerPasswords[c.uid];
                    return (
                      <div key={`admin-customer-card-${c.uid || cIdx}`} className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl hover:border-[#34D186]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          {/* TOP CARD BAR */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shrink-0 border ${
                                c.role === 'admin'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : c.role === 'driver'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-[#34D186]/20 text-[#34D186] border-[#34D186]/30'
                              }`}>
                                {c.name ? c.name.slice(0, 2).toUpperCase() : 'CU'}
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-sm">{c.name || 'Uten navn'}</h3>
                                <span className="text-[10px] text-slate-500 font-mono block">ID: {c.uid}</span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                              c.role === 'admin'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : c.role === 'driver'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-[#34D186]/15 text-[#34D186] border-[#34D186]/30'
                            }`}>
                              {c.role === 'admin' ? 'Admin' : c.role === 'driver' ? 'Sjåfør' : 'Kunde'}
                            </span>
                          </div>

                          {/* DETAILS */}
                          <div className="space-y-2 text-xs pt-1">
                            <div className="flex items-center justify-between py-1 border-b border-white/5">
                              <span className="text-slate-400">E-post:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white">{c.email}</span>
                                <button
                                  onClick={() => copyToClipboard(c.email, 'E-post')}
                                  className="text-slate-500 hover:text-white"
                                  title="Kopier"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-white/5">
                              <span className="text-slate-400">Telefon:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-slate-200">{c.phone || '–'}</span>
                                {c.phone && (
                                  <button
                                    onClick={() => copyToClipboard(c.phone || '', 'Telefon')}
                                    className="text-slate-500 hover:text-white"
                                    title="Kopier"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-white/5">
                              <span className="text-slate-400">Passord:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                                  {isRevealed ? (c.password || 'kunde1234') : '••••••••'}
                                </span>
                                <button
                                  onClick={() => togglePasswordVisibility(c.uid)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(c.password || 'kunde1234', 'Passord')}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between py-1">
                              <span className="text-slate-400">Adresse:</span>
                              <span className="text-slate-200 truncate max-w-[180px]">
                                {c.address || '–'} {c.postalCode ? `(${c.postalCode})` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                          <button
                            onClick={() => openEditCustomer(c)}
                            className="flex-1 py-2 px-3 bg-[#34D186]/15 hover:bg-[#34D186] text-[#34D186] hover:text-slate-950 border border-[#34D186]/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Rediger Kunde
                          </button>
                          <button
                            onClick={() => handleSendResetEmail(c.email)}
                            className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all cursor-pointer"
                            title="Send tilbakestill passord-epost"
                          >
                            <Mail className="w-4 h-4 text-amber-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c.uid, c.name)}
                            className="p-2 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white rounded-xl transition-all cursor-pointer"
                            title="Slett kunde permanent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* FLEET & VEHICLES TAB */}
        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            {/* LARGE FLEET FOLDER BANNER */}
            <div className="bg-gradient-to-r from-[#121722] via-[#1a2130] to-[#121722] border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10 text-[#D4AF37] pointer-events-none">
                <Folder className="w-64 h-64" />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase">
                    <Folder className="w-3.5 h-3.5" />
                    Offisiell Flåtemappe · Aron Taxi Oslo
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F2ED]">
                    Kjøretøyarkiv & Flåtestyring
                  </h2>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Komplett oversikt over godkjente elektriske drosjer i Oslo. Håndter kjennemerker, drosjeløyver, sjåførtildelinger og bilarkiv.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleResetFleetToOfficial}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                    title="Fjerner alle admin-lagde biler og unassigner sjåfører 1 og 2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Nullstill Flåte til Offisiell
                  </button>

                  <button
                    onClick={() => setShowAddVehicleModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:brightness-110 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#D4AF37]/20 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Legg til Kjøretøy
                  </button>
                </div>
              </div>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-slate-400">
                Totalt registrert: <b className="text-[#F5F2ED]">{vehicles.length} kjøretøy</b>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Søk modell, skilt, løyve, sjåfør..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#121722] border border-white/10 rounded-xl text-xs text-[#F5F2ED] placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* VEHICLE CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVehicles.map((v, vIdx) => (
                <div key={`admin-vehicle-card-${v.id || vIdx}`} className="bg-[#121722]/90 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-xl hover:border-[#D4AF37]/30 transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#F5F2ED] text-base">{v.model}</h3>
                          <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-md">
                            {v.year}
                          </span>
                        </div>
                        {v.licensePlate ? (
                          <span className="text-xs font-mono font-bold text-[#D4AF37] bg-white/5 px-2 py-0.5 rounded inline-block mt-1">
                            Skilt: {v.licensePlate}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded inline-block mt-1">
                            100% Elektrisk
                          </span>
                        )}
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        v.status === 'active' 
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : v.status === 'service'
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-rose-950 text-rose-400 border-rose-800'
                      }`}>
                        {v.status === 'active' ? 'AKTIV I DRIFT' : v.status === 'service' ? 'PÅ SERVICE' : 'INAKTIV'}
                      </span>
                    </div>

                    {/* PHOTO THUMBNAILS (IF ANY) */}
                    {v.imageUrls && v.imageUrls.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Bilder i bilmappen ({v.imageUrls.length})
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {v.imageUrls.map((img, i) => (
                            <div
                              key={`admin-v-${v.id || vIdx}-thumb-${i}`}
                              onClick={() => setAdminLightboxImg({ url: img, title: `${v.model} (${v.licensePlate})` })}
                              className="h-20 rounded-xl overflow-hidden border border-white/10 hover:border-[#D4AF37] cursor-pointer relative group transition-all"
                            >
                              <img src={img} alt={`Car ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-4 h-4 text-[#D4AF37]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div className="bg-[#0D121D] p-2.5 rounded-xl border border-white/5">
                        <span className="text-slate-500 text-[10px] block">Løyvenummer:</span>
                        <span className="font-mono font-semibold text-slate-200">{v.permitNumber || 'Ikke oppgitt'}</span>
                      </div>
                      <div className="bg-[#0D121D] p-2.5 rounded-xl border border-white/5">
                        <span className="text-slate-500 text-[10px] block">Drivstoff / Rekkevidde:</span>
                        <span className="font-semibold text-emerald-400">{v.fuelType} · {v.rangeKm} km</span>
                      </div>
                      <div className="bg-[#0D121D] p-2.5 rounded-xl border border-white/5">
                        <span className="text-slate-500 text-[10px] block">Farge / Seter:</span>
                        <span className="font-semibold text-slate-200">{v.color} · {v.seats} seter</span>
                      </div>
                      <div className="bg-[#0D121D] p-2.5 rounded-xl border border-white/5">
                        <span className="text-slate-500 text-[10px] block">Tilknyttet Sjåfør:</span>
                        {v.assignedDriverName ? (
                          <span className="font-semibold text-[#D4AF37] truncate block">{v.assignedDriverName}</span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Ingen sjåfør tildelt</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                    <button
                      onClick={() => openEditVehicle(v)}
                      className="flex-1 py-2 px-3 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Rediger Bil & Løyve
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(v.id, v.model, v.licensePlate)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl transition-all cursor-pointer"
                      title="Slett bil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <AdminInvoicesTab
            trips={trips}
            invoices={invoices}
            onCreateInvoice={handleCreateInvoice}
            onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
            showToast={showToast}
          />
        )}

        {/* DRIVER APPLICATIONS & REGISTRATION TAB */}
        {activeTab === 'applications' && (
          <AdminApplicationsTab
            applications={driverApplications}
            vehicles={vehicles}
            onApproveApplication={approveDriverApplication}
            onRejectApplication={rejectDriverApplication}
            onDeleteApplication={deleteDriverApplication}
            showToast={showToast}
          />
        )}

        {/* SURGE & HOTSPOTS TAB */}
        {activeTab === 'surge' && (
          <AdminSurgeTab
            surgeZones={surgeZones}
            onToggleSurge={handleToggleSurge}
            onUpdateMultiplier={handleUpdateMultiplier}
            showToast={showToast}
          />
        )}

        {/* CORPORATE PARTNERS TAB */}
        {activeTab === 'partners' && (
          <AdminPartnersTab
            partners={partners}
            onCreatePartner={handleCreatePartner}
            showToast={showToast}
          />
        )}

        {/* COUPONS & PROMOS TAB */}
        {activeTab === 'coupons' && (
          <AdminCouponsTab
            coupons={coupons}
            onCreateCoupon={handleCreateCoupon}
            onToggleCoupon={handleToggleCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            showToast={showToast}
          />
        )}

        {/* REPORTS & ACCOUNTING TAB */}
        {activeTab === 'reports' && (
          <AdminReportsTab
            trips={trips}
            drivers={drivers}
            showToast={showToast}
          />
        )}

        {/* NOTIFICATIONS & BROADCASTS TAB */}
        {activeTab === 'notifications' && (
          <AdminNotificationsTab
            notifications={notifications}
            onSendNotification={handleSendNotification}
            showToast={showToast}
          />
        )}

        {/* PRICING CONFIGURATION TAB */}
        {activeTab === 'pricing' && (
          <form onSubmit={handlePricingSubmit} className="bg-[#121722]/90 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-xl max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-[#F5F2ED] flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#D4AF37]" />
              Takst- og Priskonfigurasjon
            </h2>

            {pricingSaved && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Takster ble oppdatert og lagret i Firestore!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Startgebyr (NOK)</label>
                <input
                  type="number"
                  value={pricingForm.baseStartFee}
                  onChange={(e) => setPricingForm({ ...pricingForm, baseStartFee: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Kilometersats Dag (NOK/km)</label>
                <input
                  type="number"
                  value={pricingForm.dayRateKm}
                  onChange={(e) => setPricingForm({ ...pricingForm, dayRateKm: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Kilometersats Kveld/Natt (NOK/km)</label>
                <input
                  type="number"
                  value={pricingForm.nightRateKm}
                  onChange={(e) => setPricingForm({ ...pricingForm, nightRateKm: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Flyplasstillegg Gardermoen (NOK)</label>
                <input
                  type="number"
                  value={pricingForm.airportAddition}
                  onChange={(e) => setPricingForm({ ...pricingForm, airportAddition: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Aron Taxi Provisjon (0.15 = 15%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={pricingForm.commissionRate}
                  onChange={(e) => setPricingForm({ ...pricingForm, commissionRate: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">MVA Sats Drosje (0.12 = 12%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={pricingForm.vatRate}
                  onChange={(e) => setPricingForm({ ...pricingForm, vatRate: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C5A028] hover:brightness-110 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lagre nye takster
            </button>
          </form>
        )}

      </main>

      {/* ================= MODALS ================= */}

      {/* 1. ADD DRIVER MODAL */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="font-display text-xl font-bold text-[#F5F2ED] flex items-center gap-2">
                <Car className="w-5 h-5 text-[#D4AF37]" />
                Registrer Ny Sjåfør
              </h3>
              <button onClick={() => setShowAddDriverModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Fullt Navn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Eks. Omar Hassan"
                    value={newDriverForm.name}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">E-post *</label>
                  <input
                    type="email"
                    required
                    placeholder="sjafor@arontaxi.no"
                    value={newDriverForm.email}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Telefon *</label>
                  <input
                    type="text"
                    required
                    placeholder="+47 900 00 000"
                    value={newDriverForm.phone}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Passord for innlogging *</label>
                  <div className="relative">
                    <input
                      type={showDriverPassword ? 'text' : 'password'}
                      required
                      placeholder="Passord for sjåfør..."
                      value={newDriverForm.password}
                      onChange={(e) => setNewDriverForm({ ...newDriverForm, password: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDriverPassword(!showDriverPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400"
                    >
                      {showDriverPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Løyvenummer</label>
                  <input
                    type="text"
                    placeholder="OS 1234"
                    value={newDriverForm.licenseNumber}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Kjøretøymodell</label>
                  <select
                    value={newDriverForm.vehicleName}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, vehicleName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  >
                    <option value="Tesla Model Y Juniper">Tesla Model Y Juniper</option>
                    <option value="Mercedes EQE">Mercedes EQE</option>
                    <option value="Tesla Model S Plaid">Tesla Model S Plaid</option>
                    <option value="Mercedes EQS">Mercedes EQS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Bil Skiltnummer (Kjennemerke)</label>
                <input
                  type="text"
                  placeholder="EK 88201"
                  value={newDriverForm.vehiclePlate}
                  onChange={(e) => setNewDriverForm({ ...newDriverForm, vehiclePlate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono uppercase"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg mt-4 cursor-pointer"
              >
                Opprett Sjåfør & Lagre Passord
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT DRIVER MODAL (PASSWORD, EMAIL, VEHICLE) */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <h3 className="font-display text-xl font-bold text-[#F5F2ED] flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#D4AF37]" />
                  Rediger Sjåfør & Passord
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {editingDriver.id}</span>
              </div>
              <button onClick={() => setEditingDriver(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriverEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Navn</label>
                  <input
                    type="text"
                    required
                    value={editDriverForm.name}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">E-post (Innlogging)</label>
                  <input
                    type="email"
                    required
                    value={editDriverForm.email}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Telefon</label>
                  <input
                    type="text"
                    required
                    value={editDriverForm.phone}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Endre Passord / PIN</label>
                  <div className="relative">
                    <input
                      type={showDriverPassword ? 'text' : 'password'}
                      placeholder="Skriv nytt passord..."
                      value={editDriverForm.password}
                      onChange={(e) => setEditDriverForm({ ...editDriverForm, password: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDriverPassword(!showDriverPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400"
                    >
                      {showDriverPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Løyvenummer</label>
                  <input
                    type="text"
                    value={editDriverForm.licenseNumber}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Kjøretøymodell</label>
                  <input
                    type="text"
                    value={editDriverForm.vehicleName}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, vehicleName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Skiltnummer</label>
                  <input
                    type="text"
                    value={editDriverForm.vehiclePlate}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, vehiclePlate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Vaktstatus</label>
                  <select
                    value={editDriverForm.isOnline ? 'true' : 'false'}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, isOnline: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  >
                    <option value="true">ONLINE (På vakt)</option>
                    <option value="false">OFFLINE (Av vakt)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg mt-4 cursor-pointer"
              >
                Lagre Endringer for Sjåfør
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD CUSTOMER MODAL (DRIVER STYLE) */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="font-display text-xl font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#34D186]" />
                Registrer Ny Kunde
              </h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Navn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ola Nordmann"
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">E-post *</label>
                  <input
                    type="email"
                    required
                    placeholder="kunde@bedrift.no"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="+47 400 00 000"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Passord *</label>
                  <div className="relative">
                    <input
                      type={showCustomerPassword ? 'text' : 'password'}
                      required
                      placeholder="Passord..."
                      value={newCustomerForm.password}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, password: e.target.value })}
                      className="w-full pl-3 pr-9 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-white"
                    >
                      {showCustomerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Brukertype / Rolle</label>
                  <select
                    value={newCustomerForm.role}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                  >
                    <option value="customer">Kunde (Standard)</option>
                    <option value="driver">Sjåfør</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 uppercase mb-1">Adresse</label>
                  <input
                    type="text"
                    placeholder="Gateadresse"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Postnummer / Poststed</label>
                <input
                  type="text"
                  placeholder="0150 Oslo"
                  value={newCustomerForm.postalCode}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, postalCode: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#34D186]/20 cursor-pointer"
                >
                  Opprett Brukerkonto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT CUSTOMER MODAL (DRIVER STYLE) */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <h3 className="font-display text-xl font-black text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#34D186]" />
                  Rediger Kunde / Bruker
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">UID: {editingCustomer.uid}</span>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Navn</label>
                  <input
                    type="text"
                    required
                    value={editCustomerForm.name}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">E-post</label>
                  <input
                    type="email"
                    required
                    value={editCustomerForm.email}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Telefon</label>
                  <input
                    type="text"
                    value={editCustomerForm.phone}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Endre Passord</label>
                  <div className="relative">
                    <input
                      type={showCustomerPassword ? 'text' : 'password'}
                      placeholder="Skriv nytt passord..."
                      value={editCustomerForm.password}
                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, password: e.target.value })}
                      className="w-full pl-3 pr-9 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-white"
                    >
                      {showCustomerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Rolle</label>
                  <select
                    value={editCustomerForm.role}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                  >
                    <option value="customer">Kunde</option>
                    <option value="driver">Sjåfør</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 uppercase mb-1">Adresse</label>
                  <input
                    type="text"
                    value={editCustomerForm.address}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, address: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Postnummer / Poststed</label>
                <input
                  type="text"
                  placeholder="0150 Oslo"
                  value={editCustomerForm.postalCode}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, postalCode: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#34D186]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#34D186]/20 cursor-pointer"
                >
                  Lagre Kundeendringer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ADD VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="font-display text-xl font-bold text-[#F5F2ED] flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-400" />
                Legg til Ny Bil i Flåten
              </h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Modellnavn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Tesla Model Y Juniper"
                    value={newVehicleForm.model}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, model: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Skiltnummer (Kjennemerke) *</label>
                  <input
                    type="text"
                    required
                    placeholder="EK 88201"
                    value={newVehicleForm.licensePlate}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, licensePlate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Løyvenummer</label>
                  <input
                    type="text"
                    placeholder="NO-OSLO-2026-9"
                    value={newVehicleForm.permitNumber}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, permitNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Årsmodell</label>
                  <input
                    type="number"
                    value={newVehicleForm.year}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Farge</label>
                  <input
                    type="text"
                    value={newVehicleForm.color}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, color: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Drivstoff</label>
                  <select
                    value={newVehicleForm.fuelType}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, fuelType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  >
                    <option value="Elektrisk">Elektrisk</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Bensin">Bensin</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Antall Seter</label>
                  <input
                    type="number"
                    value={newVehicleForm.seats}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, seats: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Rekkevidde (km)</label>
                  <input
                    type="number"
                    value={newVehicleForm.rangeKm}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, rangeKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg mt-4 cursor-pointer"
              >
                Legg til Kjøretøy
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT VEHICLE MODAL */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <h3 className="font-display text-xl font-bold text-[#F5F2ED] flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#D4AF37]" />
                  Rediger Kjøretøy & Skilt
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {editingVehicle.id}</span>
              </div>
              <button onClick={() => setEditingVehicle(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicleEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Modellnavn</label>
                  <input
                    type="text"
                    required
                    value={editVehicleForm.model}
                    onChange={(e) => setEditVehicleForm({ ...editVehicleForm, model: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Skiltnummer (Kjennemerke)</label>
                  <input
                    type="text"
                    required
                    value={editVehicleForm.licensePlate}
                    onChange={(e) => setEditVehicleForm({ ...editVehicleForm, licensePlate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Løyvenummer</label>
                  <input
                    type="text"
                    value={editVehicleForm.permitNumber}
                    onChange={(e) => setEditVehicleForm({ ...editVehicleForm, permitNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Årsmodell</label>
                  <input
                    type="number"
                    value={editVehicleForm.year}
                    onChange={(e) => setEditVehicleForm({ ...editVehicleForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Farge</label>
                  <input
                    type="text"
                    value={editVehicleForm.color}
                    onChange={(e) => setEditVehicleForm({ ...editVehicleForm, color: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={editVehicleForm.status}
                    onChange={(e) => setEditVehicleForm({ ...editVehicleForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  >
                    <option value="active">Aktiv i drift</option>
                    <option value="service">På service / verksted</option>
                    <option value="inactive">Inaktiv</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Antall Seter</label>
                  <input
                    type="number"
                    value={editVehicleForm.seats}
                    onChange={(e) => setEditVehicleForm({ ...editVehicleForm, seats: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Rekkevidde (km)</label>
                  <input
                    type="number"
                    value={editVehicleForm.rangeKm}
                    onChange={(e) => setEditVehicleForm({ ...editVehicleForm, rangeKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0D121D] border border-white/10 rounded-xl text-[#F5F2ED]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg mt-4 cursor-pointer"
              >
                Lagre Kjøretøyopplysninger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. INVOICE / RECEIPT MODAL */}
      {selectedInvoiceTrip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <h3 className="font-display text-xl font-bold text-[#F5F2ED]">
                  Offisiell Drosjekvittering / Faktura
                </h3>
                <span className="text-[10px] text-[#D4AF37] font-mono font-bold">
                  TUR ID: {selectedInvoiceTrip.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedInvoiceTrip(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white text-slate-900 p-6 rounded-2xl space-y-4 font-mono text-xs shadow-inner">
              <div className="text-center pb-3 border-b border-slate-200">
                <h4 className="font-black text-sm uppercase tracking-wider">Aron Taxi Norway AS</h4>
                <p className="text-[10px] text-slate-500">Org.nr: 987 654 321 MVA · Oslo, Norge</p>
                <p className="text-[10px] text-slate-500">Tlf: +47 22 00 00 00 · post@arontaxi.no</p>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dato & Tid:</span>
                  <span>{new Date(selectedInvoiceTrip.createdAt).toLocaleString('no-NO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kunde:</span>
                  <span>{selectedInvoiceTrip.customerName} ({selectedInvoiceTrip.customerPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sjåfør:</span>
                  <span>{selectedInvoiceTrip.driverName || 'Aron Taxi Sjåfør'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kjøretøy & Skilt:</span>
                  <span>{selectedInvoiceTrip.vehicleModel || 'Tesla Model Y'} ({selectedInvoiceTrip.vehicleLicensePlate || 'EK 88201'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fra:</span>
                  <span className="text-right truncate max-w-[200px]">{selectedInvoiceTrip.pickup?.address || '–'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Til:</span>
                  <span className="text-right truncate max-w-[200px]">{selectedInvoiceTrip.destination?.address || '–'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Distanse / Varighet:</span>
                  <span>{selectedInvoiceTrip.distanceKm} km / {selectedInvoiceTrip.durationMinutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Betalingsmetode:</span>
                  <span className="uppercase font-bold text-emerald-700">{selectedInvoiceTrip.paymentMethod}</span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-slate-300 space-y-1 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Netto beløp:</span>
                  <span>{Math.round((selectedInvoiceTrip.finalPrice || selectedInvoiceTrip.estimatedPrice) / 1.12)} NOK</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>MVA (12% persontransport):</span>
                  <span>{Math.round((selectedInvoiceTrip.finalPrice || selectedInvoiceTrip.estimatedPrice) - (selectedInvoiceTrip.finalPrice || selectedInvoiceTrip.estimatedPrice) / 1.12)} NOK</span>
                </div>
                {selectedInvoiceTrip.tip ? (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Sjåførtips:</span>
                    <span>+{selectedInvoiceTrip.tip} NOK</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-300">
                  <span>TOTALT BETALT:</span>
                  <span>{(selectedInvoiceTrip.finalPrice || selectedInvoiceTrip.estimatedPrice) + (selectedInvoiceTrip.tip || 0)} NOK</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Skriv ut
              </button>
              <button
                onClick={() => setSelectedInvoiceTrip(null)}
                className="px-5 py-2.5 bg-[#D4AF37] hover:brightness-110 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ADMIN FLEET PHOTO LIGHTBOX */}
      {adminLightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-[#121722] border border-white/15 rounded-3xl p-4 sm:p-6 overflow-hidden shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div>
                <h4 className="font-display text-lg font-bold text-[#F5F2ED]">{adminLightboxImg.title}</h4>
                <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Aron Taxi Flåtearkiv</span>
              </div>
              <button
                onClick={() => setAdminLightboxImg(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-[60vh] sm:h-[70vh] w-full flex items-center justify-center bg-black/80 rounded-2xl overflow-hidden border border-white/10">
              <img
                src={adminLightboxImg.url}
                alt={adminLightboxImg.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* 9. IN-APP CONFIRMATION MODAL (VARSEL/BEKREFTELSE) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative max-w-md w-full bg-[#121722] border border-white/20 rounded-3xl p-6 sm:p-7 overflow-hidden shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                confirmModal.variant === 'danger'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : confirmModal.variant === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
              }`}>
                {confirmModal.variant === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmModal.variant === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-[#F5F2ED]">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {confirmModal.message}
                </p>
                {confirmModal.details && (
                  <p className="text-[11px] text-slate-400 font-light mt-1">
                    {confirmModal.details}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {confirmModal.cancelLabel || 'Avbryt'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmModal.onConfirm) {
                    await confirmModal.onConfirm();
                  }
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg cursor-pointer ${
                  confirmModal.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                    : confirmModal.variant === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/40'
                    : 'bg-[#D4AF37] hover:brightness-110 text-slate-950 shadow-[#D4AF37]/30'
                }`}
              >
                {confirmModal.confirmLabel || 'Bekreft'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
