-- ═══════════════════════════════════════════════════════════════
-- SEED DATA — Travel Agency PWA
-- Auto-generated from running database: 2026-06-23
-- ═══════════════════════════════════════════════════════════════

-- Users

INSERT INTO public."Users" (id, name, email, password, phone, role, active, "loginAttempts", "lockedUntil", "otpCode", "otpExpiry", "isVerified", "supabaseUid", "createdAt", "updatedAt") VALUES
(1, 'Admin User', 'admin123@gmail.com', NULL, '9999999999', 'admin', true, 0, NULL, NULL, NULL, true, NULL, '2026-06-23 01:50:54.051+00', '2026-06-23 01:50:54.051+00'),
(2, 'Agency Admin', 'agency@example.com', NULL, '9999999998', 'agency_admin', true, 0, NULL, NULL, NULL, true, NULL, '2026-06-23 01:50:54.051+00', '2026-06-23 01:50:54.051+00'),
(3, 'Driver User', 'driver@example.com', NULL, '9999999997', 'driver', true, 0, NULL, NULL, NULL, true, NULL, '2026-06-23 01:50:54.051+00', '2026-06-23 01:50:54.051+00'),
(4, 'Traveler One', 'traveler@example.com', NULL, '9999999996', 'traveler', true, 0, NULL, NULL, NULL, true, NULL, '2026-06-23 01:50:54.051+00', '2026-06-23 01:50:54.051+00'),
(5, 'Traveler Two', 'traveler2@example.com', NULL, '9999999995', 'traveler', true, 0, NULL, NULL, NULL, true, NULL, '2026-06-23 01:50:54.051+00', '2026-06-23 01:50:54.051+00'),
(6, 'Ramesh Kumar', 'ramesh@example.com', NULL, '8888888881', 'driver', true, 0, NULL, NULL, NULL, true, NULL, '2026-06-23 01:50:54.051+00', '2026-06-23 01:50:54.051+00');

-- Agencies

INSERT INTO public."Agencies" (id, name, email, phone, active, "createdBy", "createdAt", "updatedAt", "adminId") VALUES
(1, 'City Travels Pvt Ltd', 'citytravels@example.com', '8888888888', true, 1, '2026-06-23 01:50:54.153+00', '2026-06-23 01:50:54.153+00', 2),
(2, 'Highway Express', 'highway@example.com', '8888888887', true, 1, '2026-06-23 01:50:54.153+00', '2026-06-23 01:50:54.153+00', 2);

-- Drivers

INSERT INTO public."Drivers" (id, "userId", "agencyId", name, phone, "vehicleType", "vehicleReg", "licenseNo", available, "createdAt", "updatedAt", "licenseDocUrl", "vehicleRcUrl") VALUES
(1, 3, 1, 'Driver User', '9999999997', 'Sedan', 'KA-01-AB-1234', 'DL-123456789', true, '2026-06-23 01:50:54.188+00', '2026-06-23 01:50:54.188+00', NULL, NULL),
(2, 6, 2, 'Ramesh Kumar', '8888888881', 'SUV', 'KA-02-CD-5678', 'DL-987654321', true, '2026-06-23 01:50:54.188+00', '2026-06-23 01:50:54.188+00', NULL, NULL);

-- Routes

INSERT INTO public."Routes" (id, "driverId", source, destination, "departureTime", "arrivalTime", fare, capacity, available, "createdAt", "updatedAt", status) VALUES
(1, 1, 'Bangalore', 'Mysore', '2026-06-24 02:30:00+00', '2026-06-24 06:30:00+00', 500.00, 4, true, '2026-06-23 01:50:54.222+00', '2026-06-23 01:50:54.222+00', 'active'),
(2, 1, 'Bangalore', 'Chennai', '2026-06-24 08:30:00+00', '2026-06-24 12:30:00+00', 1200.00, 4, true, '2026-06-23 01:50:54.222+00', '2026-06-23 01:50:54.222+00', 'active'),
(3, 2, 'Mumbai', 'Pune', '2026-06-24 02:30:00+00', '2026-06-24 06:30:00+00', 800.00, 6, true, '2026-06-23 01:50:54.222+00', '2026-06-23 01:50:54.222+00', 'active');

-- Bookings

INSERT INTO public."Bookings" (id, "userId", "routeId", "driverId", "seatCount", "travelDate", status, "cancelReason", "cancelledBy", "createdAt", "updatedAt") VALUES
(1, 4, 1, 1, 2, '2026-06-25', 'Confirmed', NULL, NULL, '2026-06-23 01:50:54.251+00', '2026-06-23 01:50:54.251+00'),
(2, 5, 1, 1, 1, '2026-06-25', 'Pending', NULL, NULL, '2026-06-23 01:50:54.251+00', '2026-06-23 01:50:54.251+00'),
(3, 4, 2, 1, 3, '2026-06-25', 'Completed', NULL, NULL, '2026-06-16 01:50:54.251+00', '2026-06-23 01:50:54.251+00'),
(4, 5, 3, 2, 2, '2026-06-25', 'Cancelled', 'Change of plans', 5, '2026-06-20 01:50:54.251+00', '2026-06-23 01:50:54.251+00');

-- Announcements

INSERT INTO public."Announcements" (id, title, body, type, active, "createdBy", "createdAt", "updatedAt") VALUES
(1, 'Welcome to Travel Agency Platform', 'We are excited to launch our new booking platform. Enjoy seamless travel booking!', 'info', true, 1, '2026-06-23 01:50:54.285+00', '2026-06-23 01:50:54.285+00'),
(2, 'Holiday Schedule', 'Services will be limited during the upcoming holiday weekend. Please plan accordingly.', 'warning', true, 1, '2026-06-23 01:50:54.285+00', '2026-06-23 01:50:54.285+00');

-- Events

INSERT INTO public."Events" (id, title, description, "startDate", "endDate", location, "organizerId", "createdAt", "updatedAt") VALUES
(1, 'Travel Expo 2026', 'Annual travel exhibition with special discounts on bookings.', '2026-06-30 01:50:54.318+00', '2026-07-02 01:50:54.318+00', 'Bangalore Convention Center', 1, '2026-06-23 01:50:54.318+00', '2026-06-23 01:50:54.318+00'),
(2, 'Safety Workshop', 'Mandatory safety training for all drivers and agency staff.', '2026-07-23 01:50:54.318+00', '2026-07-24 01:50:54.318+00', 'City Travels Office, Bangalore', 2, '2026-06-23 01:50:54.318+00', '2026-06-23 01:50:54.318+00');

-- Reset sequences to match inserted data

SELECT pg_catalog.setval('public."Agencies_id_seq"', 2, true);
SELECT pg_catalog.setval('public."Announcements_id_seq"', 2, true);
SELECT pg_catalog.setval('public."BookingStatusHistories_id_seq"', 1, true);
SELECT pg_catalog.setval('public."Bookings_id_seq"', 4, true);
SELECT pg_catalog.setval('public."DriverAgencyRequests_id_seq"', 1, true);
SELECT pg_catalog.setval('public."Drivers_id_seq"', 2, true);
SELECT pg_catalog.setval('public."Events_id_seq"', 2, true);
SELECT pg_catalog.setval('public."Routes_id_seq"', 3, true);
SELECT pg_catalog.setval('public."Users_id_seq"', 10, true);
SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);
