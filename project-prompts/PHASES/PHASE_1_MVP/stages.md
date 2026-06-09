File: /project-prompts/PHASES/PHASE_1_MVP/stages.md

# Phase 1 — Stages

---

## STAGE 1: Setup
**REQ-IDs:** REQ-034, REQ-035
**TEST-IDs:** TEST-109, TEST-110
**Steps:**
- Initialize Git repository and create root directory structure (`backend/`, `frontend/`, `database/`)
- Run `npm init` in backend/ and install dependencies (express, sequelize, mysql2, jsonwebtoken, bcrypt, cors, dotenv) and dev dependencies (nodemon, jest, supertest)
- Create `backend/src/server.js` with Express app skeleton and `backend/src/app.js` with basic middleware (cors, json, error handler)
- Run `npx create-react-app frontend` and install frontend dependencies (react-router-dom, axios, react-hook-form)
- Create `backend/Dockerfile` (Node 18), `frontend/Dockerfile` (Node 18 build + Nginx serve), and `docker-compose.yml` (backend, frontend, mysql services)
- Create `.env.example` with DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, PORT and `.gitignore` with node_modules, .env, dist

## STAGE 2: Architecture
**REQ-IDs:** REQ-034, REQ-037
**TEST-IDs:** TEST-112
**Steps:**
- Create Express router structure in `backend/src/routes/`: auth (/api/auth), users (/api/users), bookings (/api/bookings), drivers (/api/drivers), agency (/api/agency), admin (/api/admin), search (/api/routes), dashboard (/api/dashboard)
- Create controllers directory, middleware directory (auth.js — JWT verification, rbac.js — role-based access, errorHandler.js, validator.js), services directory, validations directory, and utils directory (jwt.js, logger.js, helpers.js) with appropriate placeholder exports
- Configure Express to use all routers with /api prefix, implement standard JSON error response format `{ message, errors? }`, and configure CORS for frontend origin http://localhost:3000

## STAGE 3: Database
**REQ-IDs:** REQ-031, REQ-033, REQ-035
**TEST-IDs:** TEST-104, TEST-107, TEST-108, TEST-110
**Steps:**
- Create `backend/src/config/database.js` with Sequelize connection using environment variables
- Create Sequelize models: User (id, name, email unique, bcrypt password, phone, role enum, active, loginAttempts, lockedUntil), Agency (id, name, email unique, phone, active, createdBy FK), Driver (id, userId FK unique, agencyId FK, name, phone, vehicleType enum, vehicleReg unique, licenseNo, available), Route (id, driverId FK, source, destination, departureTime, arrivalTime, fare DECIMAL 10,2, capacity INT 1-60, available), Booking (id, userId FK, routeId FK, driverId FK, seatCount, travelDate, status enum, cancelReason, cancelledBy FK), BookingStatusHistory (id, bookingId FK, fromStatus, toStatus, changedBy FK)
- Define model associations (User↔Driver, Agency→Drivers, Driver→Routes, Driver→Bookings, Booking→StatusHistory) and initialize Sequelize with all models
<!-- - Create `database/init.sql` with CREATE DATABASE, sync models with `sequelize.sync({ alter: true })`, add indexes on routes(source, destination), routes(driverId), bookings(userId, status, travelDate), bookings(driverId, status, travelDate), booking_status_history(bookingId), users(email) unique, drivers(vehicleReg) unique, drivers(userId) unique
- Create `database/seed.sql` with 2 agencies, 4 drivers, 4 routes, 1 admin user -->

## STAGE 4: Auth
**REQ-IDs:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-028, REQ-032
**TEST-IDs:** TEST-001, TEST-002, TEST-003, TEST-004, TEST-005, TEST-006, TEST-007, TEST-008, TEST-009, TEST-010, TEST-011, TEST-012, TEST-013, TEST-014, TEST-015, TEST-016, TEST-097, TEST-098, TEST-099, TEST-105, TEST-106
**Steps:**
- Create `backend/src/utils/jwt.js` with `generateToken(user)` (returns JWT with { id, role, iat, exp }, 24h expiry) and `verifyToken(token)` (returns decoded payload or throws on invalid/expired)
- Create `backend/src/validations/authValidation.js` with registerRules (name required, email required+valid format, password required min 8 with 1 upper+1 lower+1 digit, phone required 10-15 digits) and loginRules (email required, password required)
- Create `backend/src/services/authService.js` with `register(data)` (duplicate email check, bcrypt hash cost 10, create user, return user without password) and `login(email, password)` (find user, check active, verify password, check lockout, reset/increment failed attempts, lock after 5 failures within 15 min)
- Create `backend/src/controllers/authController.js` (register returns HTTP 201, login returns HTTP 200 + JWT), middleware/auth.js (extract Bearer token, verify, attach req.user, return 401), middleware/rbac.js (`authorize(...roles)` returns 403 on mismatch), and routes/auth.js (POST /register public, POST /login public)
- Implement session timeout with JWT expiry of 60 minutes and frontend interceptor that redirects to /login?sessionExpired=true on 401

## STAGE 5: Backend
**REQ-IDs:** REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-038, REQ-039, REQ-040, REQ-041, REQ-042, REQ-043, REQ-044
**TEST-IDs:** All integration tests from /project-prompts/TESTS/INTEGRATION_TESTS.md (76 tests)
**Steps:**
- **User APIs (REQ-005):** Implement userService with getProfile, updateProfile, changeEmail (requires re-auth); userController with getProfile, updateProfile; routes GET/PUT /users/profile
- **Search APIs (REQ-006, REQ-007, REQ-038):** Implement searchService.searchRoutes(source, destination) with LIKE query, join drivers+agencies, filter available=true; route GET /routes/search?source=&destination=
- **Booking APIs (REQ-008 to REQ-011, REQ-039 to REQ-041):** Implement bookingValidation (seatCount ≥ 1, travelDate not past, not > 6 months); bookingService with createBooking (duplicate+capacity check, status Pending), getUserBookings (paginated, DESC), getBookingById (verify ownership), cancelBooking (only Pending/Confirmed), getBookingStatus; status transition engine (Pending→Confirmed/Cancelled, Confirmed→On Trip/Cancelled, On Trip→Completed, any→Cancelled by admin); routes POST/GET /bookings, GET /bookings/:id, PUT /bookings/:id/cancel, GET /bookings/:id/status
- **Driver APIs (REQ-012 to REQ-016, REQ-042):** Implement driverService with createProfile (unique vehicleReg), updateProfile, createRoute (source≠destination, arrival>departure, capacity 1-60, fare>0), setAvailability, setOverallAvailability, acceptBooking, rejectBooking (with reason), updateTripStatus (validate transition, auto-set unavailable on On Trip, available on Completed), getDashboardData; routes POST/PUT /drivers/profile, POST /drivers/routes, PUT /drivers/routes/:id/availability, PUT /drivers/bookings/:id/accept, PUT /drivers/bookings/:id/reject, PUT /drivers/bookings/:id/status, PUT /drivers/availability
- **Agency APIs (REQ-017, REQ-018, REQ-043):** Implement agencyService with addDriver (check not in another agency), removeDriver (check active bookings, cancel pending), getDrivers (paginated), getBookings (filter by status/date/driver); routes POST/DELETE/GET /agency/drivers, GET /agency/bookings
- **Admin APIs (REQ-019 to REQ-021, REQ-044):** Implement adminService with getUsers, toggleUserStatus (log adminId), createAgency, updateAgency, deactivateAgency (auto-cancel pending), getAllBookings, cancelBooking (log adminId+reason), getDashboardData (counts + status breakdown); routes GET/PUT /admin/users, POST/PUT /admin/agencies, PUT /admin/agencies/:id/deactivate, GET /admin/bookings, PUT /admin/bookings/:id/cancel, GET /admin/dashboard
- **Dashboard APIs (REQ-022 to REQ-024):** Implement dashboardController with getUserDashboard (active+total bookings, upcoming 7 days), getDriverDashboard (pending requests, active trips, today's trips), getAdminDashboard (totalUsers, totalAgencies, activeBookings, statusBreakdown); routes GET /dashboard/user, GET /dashboard/driver, GET /dashboard/admin

## STAGE 6: Frontend
**REQ-IDs:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027, REQ-028
**TEST-IDs:** TEST-081, TEST-082, TEST-083, TEST-084, TEST-085, TEST-086, TEST-087, TEST-088, TEST-089, TEST-090, TEST-091, TEST-092, TEST-093, TEST-094, TEST-095, TEST-096
**Steps:**
- Create common components: LoadingSpinner (centered spinning animation), SkeletonLoader (pulse animation placeholder), Notification (toast with success/error variants, auto-dismiss 3s/manual), Pagination (prev/next + page numbers), Modal (overlay with backdrop click), Button (primary/secondary/danger + loading state)
- Create form components: InputField, SelectField, DatePicker, FormError — all with inline validation errors
- Create auth pages: LoginPage (email, password, submit, error display, loading state) and RegisterPage (name, email, password, phone, inline validation, link to login)
- Create traveler pages: SearchPage + SearchResultCard (search form, results list with book button), BookingPage (select route, seats, date, confirm), BookingHistoryPage (paginated list of BookingCard), BookingDetailPage (full info, status timeline, cancel button), plus BookingCard, BookingStatusBadge, BookingTimeline
- Create driver pages: DriverDashboardPage (stat cards, today's trips, availability toggle), RouteManagementPage (create/edit route, list with availability toggle), BookingRequestsPage (pending list with accept/reject)
- Create agency pages: AgencyDashboardPage (driver count, active bookings), DriverManagementPage (add/remove driver list), BookingMonitorPage (filtered booking list)
- Create admin pages: AdminDashboardPage (stat cards, status breakdown chart), UserManagementPage (user list + activate/deactivate), AgencyManagementPage (create/edit + deactivate), BookingOversightPage (all bookings + admin cancel)
- Create layouts (MainLayout, AuthLayout, DashboardLayout) and routing (AppRoutes, ProtectedRoute redirect to /login if no JWT, RoleRoute redirect if wrong role)

## STAGE 7: State
**REQ-IDs:** REQ-004, REQ-028
**TEST-IDs:** TEST-013, TEST-014, TEST-015, TEST-016, TEST-097, TEST-098, TEST-099
**Steps:**
- Create AuthContext with user, token, loading, error state; login/register/logout/updateProfile actions; localStorage persistence; session expiry check; wrapper hook useAuth
- Create BookingContext with bookings, currentBooking, pagination; searchRoutes, createBooking, getBookings, cancelBooking actions
- Create NotificationContext with notifications array; addNotification, removeNotification; auto-remove timer
- Create API service layer: api.js (Axios instance with baseURL, JWT interceptor, 401 handler), authService.js, searchService.js, bookingService.js, adminService.js
- Implement form data preservation: save to localStorage on route change/session expiry, restore on mount, clear on success

## STAGE 8: Integration
**REQ-IDs:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027, REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036, REQ-037, REQ-038, REQ-039, REQ-040, REQ-041, REQ-042, REQ-043, REQ-044
**TEST-IDs:** All E2E tests from /project-prompts/TESTS/E2E_TESTS.md (30 E2E workflows)
**Steps:**
- Start backend on port 5000 with seed data and frontend on port 3000, configure Axios baseURL to http://localhost:5000/api, verify CORS allows frontend origin
- Test traveler workflow end-to-end: Register → Login → Search → Book → View History → Cancel
- Test driver workflow end-to-end: Register → Profile → Route → Accept Booking → On Trip → Completed
- Test agency workflow end-to-end: Add driver → View/Filter bookings → Remove driver
- Test admin workflow end-to-end: View users → Deactivate → Create/Deactivate agency → Oversee bookings
- Test edge cases: Last seat booking, deactivated user login, past date booking, excess seats
- Fix integration issues (CORS, path mismatches, response format, auth tokens, pagination)

## STAGE 9: Testing
**REQ-IDs:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027, REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036, REQ-037, REQ-038, REQ-039, REQ-040, REQ-041, REQ-042, REQ-043, REQ-044
**TEST-IDs:** TEST-001, TEST-002, TEST-003, TEST-004, TEST-005, TEST-006, TEST-007, TEST-008, TEST-009, TEST-010, TEST-011, TEST-012, TEST-013, TEST-014, TEST-015, TEST-016, TEST-081, TEST-082, TEST-083, TEST-084, TEST-085, TEST-086, TEST-087, TEST-088, TEST-089, TEST-090, TEST-091, TEST-092, TEST-093, TEST-094, TEST-095, TEST-096, TEST-097, TEST-098, TEST-099, TEST-104, TEST-105, TEST-106, TEST-107, TEST-108, TEST-109, TEST-110, TEST-111, TEST-112
**Steps:**
- Run unit tests: `npm test -- --testPathPattern=unit` (authService, bookingService, validation, statusTransition, passwordHash)
- Run integration tests: `npm test -- --testPathPattern=integration` (auth, bookings, drivers, agency, admin, search, dashboard)
- Run E2E tests: `npm test -- --testPathPattern=e2e` (travelerWorkflow, driverWorkflow, agencyWorkflow, adminWorkflow, edgeCases)
- Fix failures in order: unit → integration → E2E
- Verify password validation, status transitions, capacity checks, concurrency, pagination, RBAC, error format, form validation
- Target minimum 80% code coverage with Jest --coverage

## STAGE 10: Deployment
**REQ-IDs:** REQ-034, REQ-035, REQ-036
**TEST-IDs:** TEST-109, TEST-110, TEST-111
**Steps:**
- Create backend Dockerfile (Node 18-alpine, npm ci, expose 5000) and frontend Dockerfile (Node build, serve with Nginx, proxy /api to backend)
- Create nginx.conf for serving static files, SPA fallback, and proxying /api to backend:5000
- Create docker-compose.yml with mysql:8.0 (healthcheck), backend (depends on mysql healthy), frontend (depends on backend), named volume for mysql data
- Configure .env with DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, PORT
- Verify production readiness: API endpoint verification, frontend build, docker-compose up, browser compatibility check (Chrome 122+, Firefox 123+, Safari 17+, Edge 122+)
