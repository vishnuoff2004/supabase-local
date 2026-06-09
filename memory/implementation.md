# Implementation Changes

## 1. BookingStatusHistory.fromStatus notNull Violation

**Problem:** `createBooking()` passed `fromStatus: null` for new bookings (no previous status), but the column was `allowNull: false`.

**Fix — Model:** `backend/src/models/BookingStatusHistory.js:14`
- `fromStatus: { type: DataTypes.STRING, allowNull: false }` → `allowNull: true`

**Fix — Migration:** `backend/migrations/20260609000006-create-booking-status-history.js:24`
- `allowNull: false` → `allowNull: true`

**Fix — Code:** `backend/src/services/bookingService.js:70`
- `fromStatus: null` → `fromStatus: 'Pending'`

---

## 2. BookingRequestsPage — `requests.map is not a function`

**Problem:** Backend `getDriverDashboard()` returned `Booking.count()` (a number) for `pendingRequests`, but the frontend called `.map()` on it.

**Fix — Controller:** `backend/src/controllers/dashboardController.js`
- Added `Route` to model imports (line 1)
- Changed `pendingRequests` from `Booking.count()` to `Booking.findAll()` with `User` and `Route` includes (lines 30-36)
- Added response mapping for `pendingRequests` (count) and `pendingRequestsList` (array with `id`, `travelerName`, `route`) (lines 43-51)

**Fix — Frontend:** `frontend/src/pages/driver/BookingRequestsPage.js:14`
- `res.data.pendingRequests` → `res.data.pendingRequestsList`

---

## 3. Driver Dashboard Stats Not Showing

**Problem:** Stat cards had `className="stat-card animate-fade-up"` but `animate-fade-up` sets `opacity: 0` (revealed only by `ScrollReveal` IntersectionObserver which wasn't used on stat cards).

**Fix — Frontend:** `frontend/src/components/DashboardStats.js:58`
- Removed `animate-fade-up` class from stat card div

---

## 4. Agency Dashboard 404 Errors

**Problem:** `getDrivers()` and `getBookings()` threw 404 when no agency existed for the user, causing silent frontend errors and 0 stats.

**Fix — Service:** `backend/src/services/agencyService.js`
- `getDrivers()` (lines 57-71): Return `{ data: [], page, limit, totalPages: 0, totalItems: 0 }` instead of throwing 404
- `getBookings()` (lines 73-101): Return `{ data: [] }` instead of throwing 404

**Fix — Controller:** `backend/src/controllers/agencyController.js`
- Removed 404 catch block from `getDrivers()` (error is now handled generically)
