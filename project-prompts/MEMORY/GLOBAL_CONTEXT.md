File: /project-prompts/MEMORY/GLOBAL_CONTEXT.md

# Global Context — Travel Agency Services Platform

---

## Project Name

Travel Agency Services Platform

## Objective

Build a centralized web-based booking and trip management platform connecting travelers, travel agencies, drivers, and administrators.

## Current Phase

All Phases (1–4) Completed & Verified. The platform is fully operational, optimized, and monitored.

## Completed Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Requirements | /project-prompts/REQUIREMENTS.md | Completed |
| Requirement Test Map | /project-prompts/TESTS/REQUIREMENT_TEST_MAP.md | Completed |
| Unit Tests | /project-prompts/TESTS/UNIT_TESTS.md | Completed |
| Integration Tests | /project-prompts/TESTS/INTEGRATION_TESTS.md | Completed |
| E2E Tests | /project-prompts/TESTS/E2E_TESTS.md | Completed |
| System Design | /project-prompts/SYSTEM_DESIGN.md | Completed |
| Global Context | /project-prompts/MEMORY/GLOBAL_CONTEXT.md | Active |
| Decisions | /project-prompts/MEMORY/DECISIONS.md | Active |
| Requirements State | /project-prompts/MEMORY/REQUIREMENTS_STATE.md | Active |
| Test State | /project-prompts/MEMORY/TEST_STATE.md | Active |
| Implementation State | /project-prompts/MEMORY/IMPLEMENTATION_STATE.md | Active |

## Requirement Coverage

Total Requirements: 44 (REQ-001 to REQ-044)
- Functional: REQ-001 to REQ-028
- Non-Functional: REQ-029 to REQ-034
- Constraints: REQ-035 to REQ-037
- Edge Cases: REQ-038 to REQ-044
- Assumptions: ASSUMPTION-001 to ASSUMPTION-008

## Test Coverage

Total Tests: 185 (TEST-001 to TEST-186, TEST-118 omitted)
- Unit Tests: 38
- Integration Tests: 75
- E2E Tests: 75

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, React Router DOM 6, Tailwind CSS 3, Context API, React Hook Form 7, Axios |
| Backend | Node.js 18, Express.js 4, JWT, bcrypt 5 |
| Database | MySQL 8.0, Sequelize ORM 6, mysql2 |
| Deployment | Docker, Docker Compose |

## Architecture

Three-tier monolith: React.js SPA → Express.js REST API → MySQL database

## User Roles

- Traveler: Search destinations, create bookings, track/cancel bookings
- Driver: Manage profile, create routes, manage availability, accept/reject bookings, update trip status
- Agency: Manage drivers, monitor bookings
- Admin: Manage users, agencies, bookings, platform oversight
