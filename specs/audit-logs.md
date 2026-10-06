# Feature Specification: Audit Logs (Web Frontend)

## 1. Overview
The Web-Frontend requires a "Logs" feature to display audit logs, mirroring the functionality of the C++ `AuditLogsWidget.cpp`. The component should fetch data from the backend API, provide real-time updates (auto-refresh), allow date-range filtering, and support exporting the data to CSV and Excel.

## 2. EARS Requirements
1. **When** the user navigates to the Audit Logs view, **the system shall** fetch the latest audit logs from `GET /api/v1/logs/audit` using JSON format.
2. **If** the user enables "Auto-Refresh (5s)", **the system shall** poll the API every 5 seconds to update the table data.
3. **While** the "Filter by Date" option is checked, **the system shall** include `from` and `to` query parameters in the API request based on the selected dates.
4. **When** the user clicks "Export CSV", **the system shall** generate and download a CSV file containing the currently displayed table data.
5. **When** the user clicks "Export Report", **the system shall** open a dialog for date range, job name, and topic, fetch the raw data, and generate a multi-sheet Excel report (Batch-Uploads, Upload-Report, and Chart). *(Note: Relies on an external library like `exceljs` or `xlsx`)*.

## 3. UI/UX Design
- **Header Actions**:
  - Refresh Button
  - Auto-Refresh Checkbox
  - Date Range Checkbox & Pickers (Start Date, End Date)
  - Export CSV Button
  - Export Report Button
- **Data Table**:
  - Columns: ID, Timestamp (Local TZ), Run ID, Component, Message
  - Spartan-NG primitive `hlm-table` with interactive headers (though sorting might be client-side).

## 4. Technical Approach & Angular v22 Constraints
- **State Management**: Use Angular Signals (`signal`, `computed`, `effect`) exclusively for component state (e.g., `logs`, `isLoading`, `autoRefresh`).
- **Data Fetching**: Use a dedicated `@Injectable({providedIn: 'root'})` service (`AuditLogsService`) to make HTTP calls to `/api/v1/logs/audit`. Use `application/json` since the backend supports Content Negotiation.
- **Components**:
  - `AuditLogsComponent` (Smart component, manages state and fetches data)
  - `AuditLogsTableComponent` (Dumb component, receives data via `input()`)
  - `ExportReportDialogComponent` (Spartan-NG Dialog for Excel report parameters)
- **Dependencies**: For Excel export, we will need to install a library such as `xlsx` (SheetJS) or `exceljs`.

## 5. Acceptance Criteria
- [ ] The table successfully displays Audit Logs fetched from the backend (JSON).
- [ ] Auto-refresh updates the table every 5 seconds without blocking the UI.
- [ ] Date range filtering correctly filters backend results.
- [ ] CSV Export generates a valid CSV file of the visible data.
- [ ] Excel Report Export generates a multi-sheet `.xlsx` file based on user dialog input.
- [ ] Code adheres to SpecDD rules (no standalone components in imports, strict signals usage).

## 6. Open Questions / Decisions
1. **Excel Export Library**: Can we add `xlsx` or `exceljs` as a dependency for the client-side Excel generation?
2. **API Endpoint**: The C++ client uses `/admin/logs/job-audit_bin` for the report and `/api/v1/logs/audit` for the table. Since we are using JSON via Content Negotiation, should we use `/api/v1/logs/audit` for both, or does `/admin/logs/job-audit_bin` provide different data?
