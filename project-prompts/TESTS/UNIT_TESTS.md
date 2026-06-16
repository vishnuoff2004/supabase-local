File: /project-prompts/TESTS/UNIT_TESTS.md

# Unit Tests — Travel Agency Services Platform

---

## TEST-001 — Register with valid data

- **REQ-ID:** REQ-001
- **Scenario:** User submits registration with all valid fields
- **Input:** `{ name: "John Doe", email: "john@example.com", password: "Password1", phone: "+911234567890" }`
- **Expected Output:** User object returned with ID, name, email, hashed password (not plaintext), HTTP 201

## TEST-002 — Register with duplicate email

- **REQ-ID:** REQ-001
- **Scenario:** User registers with an email already in the database
- **Input:** `{ name: "Jane Doe", email: "john@example.com", password: "Password1", phone: "+911234567891" }`
- **Expected Output:** HTTP 409, error message indicating email already exists

## TEST-003 — Register with weak password

- **REQ-ID:** REQ-001
- **Scenario:** User submits password with fewer than 8 characters
- **Input:** `{ name: "John Doe", email: "john@example.com", password: "Ab1", phone: "+911234567890" }`
- **Expected Output:** HTTP 400, error message indicating password must be at least 8 characters

## TEST-004 — Register with missing required fields

- **REQ-ID:** REQ-001
- **Scenario:** User submits registration without email field
- **Input:** `{ name: "John Doe", password: "Password1", phone: "+911234567890" }`
- **Expected Output:** HTTP 400, error message indicating email is required

---

## TEST-028 — Create booking with excess seats

- **REQ-ID:** REQ-008
- **Scenario:** Traveler books more seats than vehicle capacity (vehicle capacity = 4)
- **Input:** `{ routeId: 1, seatCount: 5, travelDate: "2026-07-15" }`
- **Expected Output:** HTTP 400, error message "Seat count exceeds vehicle capacity of 4"

## TEST-030 — Create booking with past date

- **REQ-ID:** REQ-008
- **Scenario:** Traveler books with a travel date in the past
- **Input:** `{ routeId: 1, seatCount: 2, travelDate: "2025-01-01" }`
- **Expected Output:** HTTP 400, error message "Travel date cannot be in the past"

## TEST-035 — Track valid status transition

- **REQ-ID:** REQ-010
- **Scenario:** Transition booking status from Pending to Confirmed
- **Input:** `{ bookingId: 1, newStatus: "Confirmed" }` (current status: "Pending")
- **Expected Output:** Status updated to Confirmed, transition timestamp recorded

## TEST-036 — Track invalid status transition

- **REQ-ID:** REQ-010
- **Scenario:** Transition booking status from Pending to Completed (skip Confirmed and On Trip)
- **Input:** `{ bookingId: 1, newStatus: "Completed" }` (current status: "Pending")
- **Expected Output:** HTTP 400, error message "Invalid status transition from Pending to Completed"

## TEST-045 — Create duplicate vehicle registration

- **REQ-ID:** REQ-012
- **Scenario:** Two drivers attempt to register with the same vehicle registration number
- **Input:** Driver A: `{ vehicleReg: "KA01AB1234" }`, Driver B: `{ vehicleReg: "KA01AB1234" }`
- **Expected Output:** Driver A succeeds (HTTP 201), Driver B receives HTTP 409 with error message "Vehicle registration number already exists"

## TEST-046 — Create profile with missing fields

- **REQ-ID:** REQ-012
- **Scenario:** Driver submits profile without license number
- **Input:** `{ name: "Driver A", phone: "+911234567890", vehicleType: "Sedan", vehicleReg: "KA01AB1234" }`
- **Expected Output:** HTTP 400, error message "License number is required"

## TEST-048 — Create route same source and destination

- **REQ-ID:** REQ-013
- **Scenario:** Driver creates route where source equals destination
- **Input:** `{ source: "Mumbai", destination: "Mumbai", departureTime: "2026-07-15T08:00:00Z", arrivalTime: "2026-07-15T10:00:00Z", fare: 500, capacity: 4 }`
- **Expected Output:** HTTP 400, error message "Source and destination cannot be the same"

## TEST-049 — Create route with past departure

- **REQ-ID:** REQ-013
- **Scenario:** Driver creates route with departure time in the past
- **Input:** `{ source: "Mumbai", destination: "Pune", departureTime: "2025-01-01T08:00:00Z", arrivalTime: "2025-01-01T10:00:00Z", fare: 500, capacity: 4 }`
- **Expected Output:** HTTP 400, error message "Departure time cannot be in the past"

## TEST-050 — Create route arrival before departure

- **REQ-ID:** REQ-013
- **Scenario:** Driver creates route where arrival time is before departure time
- **Input:** `{ source: "Mumbai", destination: "Pune", departureTime: "2026-07-15T10:00:00Z", arrivalTime: "2026-07-15T08:00:00Z", fare: 500, capacity: 4 }`
- **Expected Output:** HTTP 400, error message "Arrival time must be after departure time"

## TEST-057 — Auto-reject after 30 minutes

- **REQ-ID:** REQ-015
- **Scenario:** System processes expired pending bookings after 30-minute window
- **Input:** System time = booking.createdAt + 31 minutes
- **Expected Output:** Booking status changed to Cancelled with reason "Auto-cancelled: driver did not respond within 30 minutes"

## TEST-061 — Update to On Trip from Pending (invalid)

- **REQ-ID:** REQ-016
- **Scenario:** Attempt to set booking status to On Trip when current status is Pending
- **Input:** `{ bookingId: 1, newStatus: "On Trip" }` (current status: "Pending")
- **Expected Output:** HTTP 400, error message "Cannot transition to On Trip from Pending"

## TEST-062 — Update to Completed from Confirmed (invalid)

- **REQ-ID:** REQ-016
- **Scenario:** Attempt to set booking status to Completed when current status is Confirmed
- **Input:** `{ bookingId: 1, newStatus: "Completed" }` (current status: "Confirmed")
- **Expected Output:** HTTP 400, error message "Cannot transition to Completed from Confirmed"

## TEST-065 — Add driver already in another agency

- **REQ-ID:** REQ-017
- **Scenario:** Agency A tries to add a driver who already belongs to Agency B
- **Input:** `{ driverId: 5 }` (driver currently assigned to agencyId: 2)
- **Expected Output:** HTTP 409, error message "Driver already belongs to another agency"

## TEST-087 — Required field validation

- **REQ-ID:** REQ-025
- **Scenario:** Submit form with all optional fields empty
- **Input:** `{}` (empty object)
- **Expected Output:** Validation errors for all required fields, each with message format "Field [fieldName] is required"

## TEST-088 — Email format validation

- **REQ-ID:** REQ-025
- **Scenario:** Submit form with invalid email formats
- **Input:** `{ email: "notanemail" }`
- **Expected Output:** HTTP 400, error message "Invalid email format"

## TEST-089 — Password rule validation

- **REQ-ID:** REQ-025
- **Scenario:** Submit password without uppercase letter
- **Input:** `{ password: "password1" }`
- **Expected Output:** HTTP 400, error message "Password must contain at least one uppercase letter"

## TEST-090 — Phone number format validation

- **REQ-ID:** REQ-025
- **Scenario:** Submit phone number with invalid format (too short)
- **Input:** `{ phone: "123" }`
- **Expected Output:** HTTP 400, error message "Phone number must be 10-15 digits"

## TEST-104 — Query execution under 500ms

- **REQ-ID:** REQ-031
- **Scenario:** Execute route search query with 10,000+ seeded rows
- **Input:** SQL query: `SELECT * FROM Routes WHERE source LIKE '%Mumbai%' AND destination LIKE '%Pune%'`
- **Expected Output:** Query execution time < 500ms

## TEST-105 — Password hashed with bcrypt

- **REQ-ID:** REQ-032
- **Scenario:** Verify password is stored as bcrypt hash
- **Input:** `{ password: "Password1" }`
- **Expected Output:** Stored password starts with "$2b$10$" (bcrypt cost factor 10), is not equal to "Password1"

## TEST-107 — Atomic status transition

- **REQ-ID:** REQ-033
- **Scenario:** Two concurrent requests to change booking 1 from Pending to different statuses
- **Input:** Request A: status = "Confirmed", Request B: status = "Cancelled"
- **Expected Output:** Exactly one request succeeds (HTTP 200), the other receives HTTP 409 with message "Booking status has already been updated"

## TEST-108 — Concurrent status update conflict

- **REQ-ID:** REQ-033
- **Scenario:** Two concurrent seat booking requests for the last seat
- **Input:** Route capacity = 1, two simultaneous booking requests with seatCount = 1
- **Expected Output:** First request returns HTTP 201, second returns HTTP 409 "Insufficient capacity"

## TEST-115 — Booking exceeds vehicle capacity

- **REQ-ID:** REQ-039
- **Scenario:** Traveler books seats exceeding vehicle capacity
- **Input:** `{ routeId: 1, seatCount: 10, travelDate: "2026-07-15" }` (vehicle capacity = 4)
- **Expected Output:** HTTP 400, error message "Seat count exceeds vehicle capacity of 4"

## TEST-116 — Booking with zero seats

- **REQ-ID:** REQ-039
- **Scenario:** Traveler submits booking with seat count of zero
- **Input:** `{ routeId: 1, seatCount: 0, travelDate: "2026-07-15" }`
- **Expected Output:** HTTP 400, error message "Seat count must be at least 1"

## TEST-117 — Booking with negative seats

- **REQ-ID:** REQ-039
- **Scenario:** Traveler submits booking with negative seat count
- **Input:** `{ routeId: 1, seatCount: -1, travelDate: "2026-07-15" }`
- **Expected Output:** HTTP 400, error message "Seat count must be at least 1"

<!-- ## TEST-118 — Last seat concurrent booking

- **REQ-ID:** REQ-040
- **Scenario:** Two travelers simultaneously book the last available seat (capacity = 1)
- **Input:** Traveler A seatCount=1, Traveler B seatCount=1 at same time
- **Expected Output:** Traveler A receives HTTP 201, Traveler B receives HTTP 409 "Insufficient capacity" -->

## TEST-120 — Booking with past date

- **REQ-ID:** REQ-041
- **Scenario:** Traveler books with date before current date
- **Input:** `{ routeId: 1, seatCount: 1, travelDate: "2025-06-01" }`
- **Expected Output:** HTTP 400, error message "Travel date cannot be in the past"

## TEST-121 — Booking beyond 6 months

- **REQ-ID:** REQ-041
- **Scenario:** Traveler books with date more than 6 months in the future
- **Input:** `{ routeId: 1, seatCount: 1, travelDate: "2027-06-01" }` (current date: 2026-06-08)
- **Expected Output:** HTTP 400, error message "Travel date cannot be more than 6 months in the future"

## TEST-122 — Booking on today's date

- **REQ-ID:** REQ-041
- **Scenario:** Traveler books with today's date
- **Input:** `{ routeId: 1, seatCount: 1, travelDate: "2026-06-08" }`
- **Expected Output:** HTTP 201, booking created successfully

## TEST-123 — Driver auto-unavailable on trip

- **REQ-ID:** REQ-042
- **Scenario:** Driver sets booking status to On Trip, system auto-marks driver unavailable
- **Input:** `{ bookingId: 1, newStatus: "On Trip" }` (driverId: 5)
- **Expected Output:** Driver 5 availability set to false in database automatically

## TEST-125 — Pending booking cancelled on driver removal

- **REQ-ID:** REQ-043
- **Scenario:** Agency removes a driver who has pending bookings, system auto-cancels them
- **Input:** `DELETE /api/agency/drivers/3` (driver has bookings with status "Pending")
- **Expected Output:** All pending bookings for driver 3 changed to "Cancelled" with reason "Driver removed from agency"

---

## Password Utility Tests

### TEST-106 — Password not in API response

- **REQ-ID:** REQ-032
- **Scenario:** Call GET user profile endpoint
- **Input:** `GET /api/users/profile` with valid JWT
- **Expected Output:** Response body does NOT contain any field named "password" or "passwordHash"

## Booking Status Validation Tests

### TEST-037 — Track status with timestamp

- **REQ-ID:** REQ-010
- **Scenario:** Query status change history for a booking
- **Input:** `GET /api/bookings/1/status-history`
- **Expected Output:** Array of status changes, each with `{ fromStatus, toStatus, changedAt }` where `changedAt` is ISO 8601 timestamp

### TEST-162 — Status transition Pending → Confirmed → On Trip → Completed (full valid chain)

- **REQ-ID:** REQ-010
- **Scenario:** Execute full valid status transition chain
- **Input:** Steps: Pending → Confirmed → On Trip → Completed
- **Expected Output:** Each transition succeeds (HTTP 200), final status is Completed

### TEST-163 — Cancel booking after status Cancelled

- **REQ-ID:** REQ-011
- **Scenario:** Attempt to cancel a booking that is already Cancelled
- **Input:** `{ bookingId: 1 }` (current status: "Cancelled")
- **Expected Output:** HTTP 400, error message "Booking is already cancelled"
