# Changelog

All notable changes to the `mitm_fe_web` (Angular Web Frontend) component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
