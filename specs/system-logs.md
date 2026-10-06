# Feature Specification: System Logs (Web Frontend)

## 1. Overview
The Web-Frontend requires a "System Logs" widget, mirroring the functionality of the C++ `SystemLogsWidget.cpp`. The component should fetch data from the backend API, provide real-time updates (auto-refresh), and support exporting the data to CSV.

## 2. EARS Requirements
1. **When** the user navigates to the System Logs view, **the system shall** fetch the latest system logs from `GET /api/v1/logs/system` using `application/x-flatbuffers` format.
2. **If** the user enables "Auto-Refresh (5s)", **the system shall** poll the API every 5 seconds to update the table data.
3. **When** the user clicks "Export CSV", **the system shall** generate and download a CSV file containing the currently displayed table data.

## 3. UI/UX Design
- **Header Actions**:
  - Refresh Button
  - Auto-Refresh Checkbox (5s)
  - Export CSV Button
- **Data Table**:
  - Columns: ID, Timestamp (Local TZ), Level, Component, Message
  - Spartan-NG primitive `hlm-table`.

## 4. Technical Approach & Angular v22 Constraints
- **State Management**: Use Angular Signals for component state.
- **Data Fetching**: Create `SystemLogsService` to fetch from `/api/v1/logs/system` with `Accept: application/x-flatbuffers`.
- **FlatBuffers Integration**: Use `flatc` to generate TypeScript classes from `system_logs.fbs` and parse the incoming binary payload.
- **Components**:
  - `SystemLogsComponent` (Smart component)
  - `SystemLogsTableComponent` (Dumb component, receives data via `input()`)

## 5. Acceptance Criteria
- [ ] The table successfully displays System Logs fetched from the backend (FlatBuffers).
- [ ] Auto-refresh updates the table every 5 seconds.
- [ ] CSV Export generates a valid CSV file of the visible data.
- [ ] FlatBuffers parsing correctly decodes the binary response.
