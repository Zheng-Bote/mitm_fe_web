# Feature Specification: System Logs (Web Frontend)

## 1. Overview
The Web-Frontend requires a "System Logs" widget, mirroring the functionality of the C++ `SystemLogsWidget.cpp`. The component should fetch data from the backend API, provide real-time updates (auto-refresh), and support exporting the data to CSV.

## 2. EARS Requirements
1. **When** the user selects "System Logs" in the navigation, **the system shall** show the view without fetching any logs.
2. **When** the user clicks "Refresh System Logs", **the system shall** fetch the latest system logs from `GET /api/v1/logs/system` using `application/x-flatbuffers` format.
3. **If** the user enables "Auto-Refresh (5s)", **the system shall** poll the API every 5 seconds to update the table data. The checkbox stays disabled until the first manual refresh has succeeded, so auto-refresh never causes the initial load.
4. **When** the user clicks "Export CSV", **the system shall** generate and download a CSV file containing the currently displayed table data.
5. **While** no data has been loaded yet, **the system shall** show a hint in the table that logs are not loaded and a refresh is required instead of "No logs found".

## 3. UI/UX Design
- **Header Actions**:
  - Refresh Button
  - Auto-Refresh Checkbox (5s, disabled until the first manual refresh)
  - Export CSV Button
- **Data Table**:
  - Columns: ID, Timestamp (Local TZ), Level, Component, Message
  - Spartan-NG primitive `hlm-table`.
  - Empty state distinguishes "not loaded yet" (hint to click Refresh) from "No logs found".

## 4. Technical Approach & Angular v22 Constraints
- **State Management**: Use Angular Signals for component state.
- **Data Fetching**: Create `SystemLogsService` to fetch from `/api/v1/logs/system` with `Accept: application/x-flatbuffers`.
- **FlatBuffers Integration**: Use `flatc` to generate TypeScript classes from `system_logs.fbs` and parse the incoming binary payload.
- **Components**:
  - `SystemLogsComponent` (Smart component)
  - `SystemLogsTableComponent` (Dumb component, receives data via `input()`)

## 5. Acceptance Criteria
- [ ] The table successfully displays System Logs fetched from the backend (FlatBuffers).
- [ ] Selecting the view does not trigger a backend request; only "Refresh System Logs" does.
- [ ] Auto-refresh updates the table every 5 seconds and is unavailable before the first manual refresh.
- [ ] CSV Export generates a valid CSV file of the visible data.
- [ ] FlatBuffers parsing correctly decodes the binary response.
