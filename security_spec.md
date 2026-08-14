# Aron Taxi Norway - Firebase Security Specification

## 1. Role-Based Access Control (RBAC) Architecture

- **Customer**: Access to book trips, manage personal profile in `/users/{userId}`, review their own trip history, and submit ratings.
- **Driver**: Access to shift dashboard, real-time trip accept/reject/status workflow, customer contact details during active trips, vehicle odometer & daily earnings metrics.
- **Admin / Dispatch**: Full read/write access to live dispatch, fleet management, rate & tariff adjustments, driver approvals, financial reports, and system settings.

## 2. Invariants & Security Rules

1. **Default Deny**: All unspecified paths are closed by default (`match /{document=**} { allow read, write: if false; }`).
2. **User Profiles**: Profiles under `/users/{userId}` can only be modified by the authenticated user themselves or an administrator.
3. **Trip Security**: Trips can be requested by customers/guests, updated by assigned drivers and dispatchers, and deleted only by administrators.
4. **Driver Fleets**: Drivers manage their online availability and location telemetry under `/drivers/{driverId}`.
5. **Pricing Tariffs**: Tariff adjustments under `/pricing/{configId}` are restricted strictly to administrators.
