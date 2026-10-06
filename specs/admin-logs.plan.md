# Implementation Plan: Admin Audit Logs

## 1. Schema Generation
- [ ] Run `flatc` to generate TypeScript interfaces for `admin_audit_logs.fbs`.
- [ ] Place generated files in `src/app/core/models/schematas/`.

## 2. Services
- [ ] Create `AdminLogsService` (`src/app/core/services/admin-logs.service.ts`).
  - Add method `getLogs()` fetching from `/api/v1/logs/admin-audit` with `responseType: 'arraybuffer'`.
  - Add logic to parse FlatBuffers response into a typed array of AdminAuditLog objects.

## 3. UI Components
- [ ] Create `AdminLogsComponent` (Smart) in `src/app/features/admin-logs/admin-logs.component.ts`.
  - Handle state: `logs`, `isLoading`.
  - Implement CSV export using `file-saver`.
- [ ] Create `AdminLogsTableComponent` (Dumb) in `src/app/features/admin-logs/components/admin-logs-table/admin-logs-table.component.ts`.
  - Use `hlm-table` for displaying columns: ID, Timestamp, Username, Action, Details.

## 4. Routing & Layout
- [ ] Add `AdminLogsComponent` to the application routes (`src/app/app.routes.ts`).
- [ ] Add "Admin Logs" link to the main navigation layout (`src/app/layout/layout.component.html`).

## 5. Build & Test
- [ ] Verify `ng build` completes successfully.
- [ ] Update CHANGELOG.md and README.md.
