# Feature Specification: Dead Letter Queue (Web Frontend)

## 1. Overview
The Web-Frontend requires a "DLQ" view, mirroring the read-only part of the C++ `DlqWidget.cpp`. It lists the entries of the Dead Letter Queue from the backend API and supports exporting the data to CSV. Requeueing is not part of this view.

## 2. EARS Requirements
1. **When** the user selects "DLQ" in the navigation, **the system shall** show the view without fetching any entries.
2. **When** the user clicks "Refresh DLQ", **the system shall** fetch the entries from `GET /api/v1/dlq` using `application/x-flatbuffers` format.
3. **When** the user clicks "Export CSV", **the system shall** generate and download a CSV file containing the currently displayed table data.
4. **While** no data has been loaded yet, **the system shall** show a hint in the table that entries are not loaded and a refresh is required instead of "No DLQ entries found".
5. The view is available to the roles `USER` and `ADMIN`; there is no auto-refresh and no date filter.

## 3. UI/UX Design
- **Header Actions**:
  - Refresh Button
  - Export CSV Button
- **Data Table**:
  - Columns: ID, Failed At (Local TZ), Error Code, Error Message, Payload
  - Spartan-NG primitive `hlm-table`.
  - `package_id` and `resolved`/`resolved_at` are part of the payload but not displayed.

## 4. Technical Approach & Angular v22 Constraints
- **State Management**: Use Angular Signals (`entries`, `isLoading`, `hasLoaded`).
- **Data Fetching**: Use a dedicated `@Injectable({providedIn: 'root'})` service (`DlqService`) to call `/api/v1/dlq` with `Accept: application/x-flatbuffers`.
- **FlatBuffers Integration**: Generate the TypeScript classes from `core-layer/mitm_http-server/schematas/dlq.fbs` with `flatc --ts`. `flatc` names the files after the table names (`dlqentry.ts`, `dlqentry-list.ts`); they are renamed to `dlq-entry.ts` / `dlq-entry-list.ts` to match the other generated schemas, which requires fixing the import path inside `dlq-entry-list.ts`.
- **Components**:
  - `DlqComponent` (Smart component, manages state and fetches data)
  - `DlqTableComponent` (Dumb component, receives data via `input()`)

## 5. Acceptance Criteria
- [ ] The table displays DLQ entries fetched from the backend (FlatBuffers).
- [ ] Selecting the view does not trigger a backend request; only "Refresh DLQ" does.
- [ ] CSV Export generates a valid CSV file of the visible data.
- [ ] The navigation entry is visible to `USER` and `ADMIN`.
