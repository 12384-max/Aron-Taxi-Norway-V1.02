import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { TripProvider } from './context/TripContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotificationBanner } from './components/NotificationBanner';

import { HomePage } from './pages/HomePage';
import { OrderPage } from './pages/OrderPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { ForDriversPage } from './pages/ForDriversPage';
import { LoginPage } from './pages/LoginPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { DriverLoginPage } from './pages/DriverLoginPage';
import { DriverDashboardPage } from './pages/DriverDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export function App() {
  return (
    <Router>
      <Toaster
        richColors
        position="top-right"
        theme="dark"
        closeButton
        toastOptions={{
          style: {
            background: '#121722',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#F5F2ED',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          },
        }}
      />
      <LanguageProvider>
        <AuthProvider>
          <TripProvider>
            <NotificationBanner />
            <Routes>
              {/* PUBLIC PAGES */}
              <Route path="/" element={<HomePage />} />
              <Route path="/bestill" element={<OrderPage />} />
              <Route path="/slik-fungerer-det" element={<HowItWorksPage />} />
              <Route path="/biler" element={<VehiclesPage />} />
              <Route path="/for-sjaforer" element={<ForDriversPage />} />
              
              {/* AUTH PAGES */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/driver/login" element={<DriverLoginPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* CUSTOMER AUTH & DASHBOARD */}
              <Route
                path="/konto"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'driver', 'admin']}>
                    <CustomerAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mine-turer"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'driver', 'admin']}>
                    <CustomerAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mine-turer/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'driver', 'admin']}>
                    <CustomerAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profil"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'driver', 'admin']}>
                    <CustomerAccountPage />
                  </ProtectedRoute>
                }
              />

              {/* DRIVER PORTAL - STRICT RBAC */}
              <Route
                path="/driver"
                element={
                  <ProtectedRoute allowedRoles={['driver', 'admin']} redirectTo="/driver/login">
                    <DriverDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver/*"
                element={
                  <ProtectedRoute allowedRoles={['driver', 'admin']} redirectTo="/driver/login">
                    <DriverDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* ADMIN PORTAL - STRICT RBAC */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* FALLBACK */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TripProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
