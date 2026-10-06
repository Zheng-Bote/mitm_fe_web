# Implementation Plan: System Logs

## 1. Schema Generation
- [ ] Run `flatc` to generate TypeScript interfaces for `system_logs.fbs`.
- [ ] Place generated files in `src/app/core/models/system_logs_generated.ts`.

## 2. Services
- [ ] Create `SystemLogsService` (`src/app/core/services/system-logs.service.ts`).
  - Add method `getLogs()` fetching from `/api/v1/logs/system` with `responseType: 'arraybuffer'`.
  - Add logic to parse FlatBuffers response into a typed array of SystemLog objects.

## 3. UI Components
- [ ] Create `SystemLogsComponent` (Smart) in `src/app/features/system-logs/system-logs.component.ts`.
  - Handle state: `logs`, `isLoading`, `autoRefresh`.
  - Implement polling via `setInterval` or RxJS `timer` when `autoRefresh` is true.
  - Implement CSV export using `file-saver`.
- [ ] Create `SystemLogsTableComponent` (Dumb) in `src/app/features/system-logs/components/system-logs-table/system-logs-table.component.ts`.
  - Use `hlm-table` for displaying columns: ID, Timestamp, Level, Component, Message.

## 4. Routing & Layout
- [ ] Add `SystemLogsComponent` to the application routes (`src/app/app.routes.ts`).
- [ ] Add "System Logs" link to the main navigation layout (`src/app/layout/layout.component.html`).

## 5. Build & Test
- [ ] Verify `ng build` completes successfully.
- [ ] Run the app locally and verify the layout and routing.
