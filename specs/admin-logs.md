# Feature Specification: Admin Audit Logs (Web Frontend)

## 1. Overview
The Web-Frontend requires an "Admin Audit Logs" widget, mirroring the functionality of the C++ `AdminLogsWidget.cpp`. The component should fetch data from the backend API and support exporting the data to CSV. Unlike System Logs, there is no Auto-Refresh feature.

## 2. EARS Requirements
1. **When** the user selects "Admin Audit Logs" in the navigation, **the system shall** show the view without fetching any logs.
2. **When** the user clicks "Refresh Admin Logs", **the system shall** fetch the latest admin logs from `GET /api/v1/logs/admin-audit` using `application/x-flatbuffers` format.
3. **When** the user clicks "Export CSV", **the system shall** generate and download a CSV file containing the currently displayed table data.
4. **While** no data has been loaded yet, **the system shall** show a hint in the table that logs are not loaded and a refresh is required instead of "No logs found".

## 3. UI/UX Design
- **Header Actions**:
  - Refresh Button
  - Export CSV Button
- **Data Table**:
  - Columns: ID, Timestamp (Local TZ), Username, Action, Details
  - Spartan-NG primitive `hlm-table`.
  - Empty state distinguishes "not loaded yet" (hint to click Refresh) from "No logs found".

## 4. Technical Approach & Angular v22 Constraints
- **State Management**: Use Angular Signals for component state (`logs`, `isLoading`).
- **Data Fetching**: Create `AdminLogsService` to fetch from `/api/v1/logs/admin-audit` with `Accept: application/x-flatbuffers`.
- **FlatBuffers Integration**: Use `flatc` to generate TypeScript classes from `admin_audit_logs.fbs` and parse the incoming binary payload.
- **Components**:
  - `AdminLogsComponent` (Smart component)
  - `AdminLogsTableComponent` (Dumb component, receives data via `input()`)

## 5. Acceptance Criteria
- [ ] The table successfully displays Admin Audit Logs fetched from the backend (FlatBuffers).
- [ ] Selecting the view does not trigger a backend request; only "Refresh Admin Logs" does.
- [ ] CSV Export generates a valid CSV file of the visible data.
- [ ] FlatBuffers parsing correctly decodes the binary response.
