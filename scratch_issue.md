## Feature Intent

Implement a Scheduler UI in the Angular v22 web frontend (`admin-frontend/mitm_fe_web`) that replicates the functionality of the existing C++ `SchedulerWidget`. It allows ADMIN users to view, create, edit, delete, execute, and stop background jobs.

## Requirements (EARS Syntax)

1. **Ubiquitous:** The system shall display a table of all registered jobs containing ID, Name, Command, Cron Expression, Status, Next Run (in local time), and Active State.
2. **State Driven:** While the "Auto-Refresh" toggle is enabled, the system shall poll the API (`GET /api/v1/jobs`) every 5 seconds for updated job states.
3. **Event Driven:** When an ADMIN user clicks "Add Job", the system shall open a dialog to input job details and send a `POST` request upon submission.
4. **Event Driven:** When an ADMIN user selects a job and clicks "Stop", the system shall send a `POST /api/v1/jobs/{jobName}/stop` request.
5. **Event Driven:** When an ADMIN user selects a job and clicks "Execute", the system shall send a `POST /api/v1/jobs/{jobName}/execute` request.
6. **Unwanted Behavior:** If a non-ADMIN user attempts modifying actions (Add, Edit, Delete, Stop, Execute), the system shall prevent the action and display a permission denied error.

## Scope

`admin-frontend/mitm_fe_web` (Frontend only, consuming existing backend API `/api/v1/jobs`).

## SpecDD Architecture Alignment (Drift Control)

Please confirm that this feature respects the global `mitm-2` constraints defined in `.sdd` files:

- [x] **Architecture:** The layered architecture is maintained (no direct bypass from Collector to Delivery).
- [ ] **Architecture:** Feature affects architecture: SpecKit feature forces update of the SpecDD .sdd
- [x] **Security:** Envelope Encryption (AES-GCM) is NOT bypassed for PII data.
- [x] **Data Model:** Core PostgreSQL schemas remain intact (feature-specific tables are allowed).
- [x] **Standards:** SPDX headers and English documentation will be maintained.

## Acceptance Criteria

- [ ] A new Scheduler route/page exists in the Angular application.
- [ ] The table displays all columns matching the C++ client.
- [ ] UI controls (Add, Edit, Delete, Stop, Execute, Refresh, Auto-Refresh) are present and functional.
- [ ] Auto-Refresh polls the API every 5 seconds when enabled.
- [ ] "Next Run" times are formatted in the user's local timezone.
- [ ] Role-based access: Actions modifying state are restricted to `ADMIN` users.
- [ ] Uses Spartan-NG components for UI elements.
- [ ] Adheres to all guidelines in `.gemini/GEMINI.md`.
- [ ] CHANGELOG.md and README.md are up-to-date
