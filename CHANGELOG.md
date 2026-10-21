# Changelog

All notable changes to the `mitm_fe_web` (Angular Web Frontend) component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.6.0] - 2026-10-21

### Added
- **Transformation Errors View**: New page for `USER` and `ADMIN` listing failed transformation and validation records from `GET /api/v1/logs/transformation-errors` (FlatBuffers), with optional date-range filtering and CSV export. The table loads only when the user clicks "Refresh Transformation Errors", consistent with the other log views; there is no auto-refresh.
- **DLQ View**: New page for `USER` and `ADMIN` listing Dead Letter Queue entries from `GET /api/v1/dlq` (FlatBuffers), with CSV export. Like the other log views it loads only when the user clicks "Refresh DLQ", shows a hint until then, and has no auto-refresh.

### Changed
- **Logs Views Load on Demand**: Navigating to System Logs, Audit Logs, or Admin Audit Logs no longer fetches data automatically. The tables load only when the user clicks the respective "Refresh …" button and show a hint until then.
- **Auto-Refresh Gate**: The 5-second auto-refresh option in System Logs and Audit Logs is disabled until data has been loaded, so it cannot trigger the initial load.

## [v1.5.0] - 2026-10-19

### Added
- **User Settings Dialog**: Added a read-only User Settings modal triggered from the footer (`USER_SETTINGS`) displaying the signed-in user's Login ID (`os_user`), Name (`<Lastname>, <Firstname>`), Department, and assigned Roles.

### Changed
- **Footer Version Display**: Replaced the static `SOURCE: MCP_v2` label in the layout footer with the dynamic application version read from `package.json` (`VERSION: 1.5.0`).
- **Footer User Settings Trigger**: Replaced the static `CLEARANCE_LEVEL: 5` footer text with the `USER_SETTINGS` button.

## [v1.4.0] - 2026-10-14

### Changed
- **BREAKING – Passkey Login (WebAuthn)**: Sign-in now uses the WebAuthn passkey ceremony via `@simplewebauthn/browser` (Windows Hello, security keys, phones). The username-only login against `POST /api/v1/auth/session` (removed in core-layer `mitm_http-server` 2.0.0) is gone. Requires core-layer 2.0.0.
- **Registration**: New "Register" view (username, name, department) for passkey registration; new users stay inactive until approved. On a fresh installation the view asks for the bootstrap token (`INITIAL_ADMIN_TOKEN`) and signs the initial administrator in.
- **Login UI**: Sign-in and registration views use Spartan-NG tabs, field, label and input components.
- **Error Messages**: Cancelled passkey prompts, rate limiting (`429`), inactive accounts and other backend JSON:API errors are shown as readable messages.

### Removed
- **IPify Integration**: The client no longer requests its public IP from `api64.ipify.org` or sends `client_ip`; the backend determines the client IP.

## [v1.3.0] - 2026-10-10

### Added
- **RBAC UI**: Implemented RBAC user management view with Spartan-NG, parity with C++ frontend.
- **Session Management**: Added 30-minute background session renewal and IPify integration for `client_ip`.
- **Authentication**: Login now rejects inactive users and parses inactive account error messages.

## [0.5.0] - 2026-10-07

### Added
- **Admin Logs UI**: Implemented Admin Audit Logs view with FlatBuffers integration and CSV export, matching the C++ client.
- **System Logs UI**: Implemented System Logs view with FlatBuffers integration, CSV export, and auto-refresh, matching the C++ client's functionality.
- **Audit Logs UI**: Implemented the `AuditLogsComponent` to display job audit trails, replicating the C++ client functionality.
- **FlatBuffers Integration**: Successfully implemented native TypeScript parsing of `application/x-flatbuffers` payloads generated via `flatc`, eliminating JSON parsing overhead for large log sets.
- **Excel Report Generation**: Added `ExcelExportService` using `exceljs` to generate multi-sheet `.xlsx` reports (Batch-Uploads, Upload-Report, and Chart data) natively in the browser.
- **Audit Logs Components**: Created Spartan-NG based `AuditLogsTableComponent` and `ExportReportDialogComponent` with real-time Date Range filtering and a 5-second Auto-Refresh toggle via Angular Signals.

## [v0.4.0] - 2026-10-06

### Added
- **Scheduler UI**: Implemented a comprehensive Scheduler dashboard replicating the C++ client's functionality (`admin-frontend/mitm_fe_cpp/src/SchedulerWidget.cpp`).
- **Scheduler Components**: Created `SchedulerComponent`, `SchedulerTableComponent`, and `JobEditorDialogComponent` using Spartan-NG primitives (Button, Checkbox, Table, Dialog).
- **Auto-Refresh**: Added a toggleable 5-second polling mechanism for job states utilizing Angular Signals.
- **Scheduler Routing**: Added lazy-loaded `/scheduler` route to the main layout navigation.
- **Scheduler Service**: Created `SchedulerService` (`@Injectable`) to encapsulate API interactions (`GET /api/v1/jobs`, Add/Edit, Delete, Stop, Execute) and centralize `403 Forbidden` error handling for non-ADMIN actions.

## [v0.3.0] - 2026-10-05

### Changed
- **API Migration**: Updated all frontend API calls (`/api/v1/system/dashboard`, `/api/v1/system/info`, `/api/v1/auth/session`, `/api/v1/auth/me`) to seamlessly align with the backend's new unified API v1 structure.
- **Dashboard Refactoring**: Replaced multiple individual data fetching calls (`forkJoin`) with a single unified request to `/api/v1/system/dashboard`, significantly reducing network overhead and improving performance.

### Fixed
- **API Interceptor**: Fixed a bug where the `/health` endpoint was incorrectly prefixed with the API base URL (resulting in a 404 `/api/health`). The interceptor now explicitly ignores the health check route.

## [v0.2.0] - 2026-10-03

### Added
- **Authentication**: Implemented full support for the new backend Session API (`POST /api/user/v1/session` & `GET /api/user/v1/roles`).
- **WebAuthn**: Added a client-side WebAuthn wrapper to trigger native Windows Hello / TouchID verification before submitting the login payload for local biometric security.
- **Login UI**: Created a new `LoginComponent` based on Spartan UI.
- **Routing**: Implemented Lazy Loading (`loadComponent`) for all primary routes (`/login`, `/dashboard`).
- **Route Protection**: Introduced an `AuthGuard` to protect the layout and dashboard routes.
- **Dashboard Enhancements**: The Dashboard now displays the database `size` property. DLQ Cursors and Transformation Errors metrics use dynamic color-coding (Green for `0`, Red for `>0`).
- **SpecDD Framework**: Integrated `.specdd`, `AGENTS.md`, and `.github/ISSUE_TEMPLATE` to align the web frontend with the project-wide Feature-Based Architecture and AI development workflows.

### Changed
- **API Interceptor**: Refactored `api.interceptor.ts`. The hardcoded Basic Auth has been completely removed. It now automatically injects `Authorization: Bearer <token>` and `Accept: application/json`.
- **API Interceptor**: Added global error handling (`catchError`) for `401 Unauthorized` and `403 Forbidden` to automatically clear session state and redirect to the login screen.
- **Dashboard API Paths**: Updated log fetching paths to utilize the new API v1 namespaces (`/api/admin/v1/logs/...`).

## [v0.1.0] - 2026-09-29

### Added
- Initial setup of the `mitm_fe_web` Angular application (v22.2.0).
- Spartan UI integration with basic Layout and Dashboard component scaffolding.
- Development proxy configuration (`proxy.conf.json`) to forward API requests to the Rust backend (`http://localhost:8080`).
- Base `api.interceptor.ts` setup with hardcoded dev credentials.
