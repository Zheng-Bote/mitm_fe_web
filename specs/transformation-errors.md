# Feature Specification: Transformation Errors (Web Frontend)

## 1. Overview
The Web-Frontend requires a "Transformation Errors" view, mirroring the functionality of the C++ `TransformationErrorsWidget.cpp`. The component lists failed transformation and validation records (the DLQ audit trail) from the backend API, allows date-range filtering, and supports exporting the data to CSV.

## 2. EARS Requirements
1. **When** the user selects "Transformation Errors" in the navigation, **the system shall** show the view without fetching any errors.
2. **When** the user clicks "Refresh Transformation Errors", **the system shall** fetch the errors from `GET /api/v1/logs/transformation-errors` using `application/x-flatbuffers` format.
3. **While** the "Filter by Date" option is checked, **the system shall** send the selected dates as RFC3339 `from`/`to` query parameters (`T00:00:00Z` / `T23:59:59Z`). Changing the filter or the dates immediately refetches, independent of the Refresh button.
4. **When** the user clicks "Export CSV", **the system shall** generate and download a CSV file containing the currently displayed table data.
5. **While** no data has been loaded yet, **the system shall** show a hint in the table that errors are not loaded and a refresh is required instead of "No transformation errors found".
6. The view is available to the roles `USER` and `ADMIN`; there is no auto-refresh.

## 3. UI/UX Design
- **Header Actions**:
  - Refresh Button
  - Date Range Checkbox & Pickers (Start Date, End Date)
  - Export CSV Button
- **Data Table**:
  - Columns: ID, Correlation ID, Failed Field, Rule Name, Error Message, Created At (Local TZ)
  - Spartan-NG primitive `hlm-table`.
  - The `topic` field of the FlatBuffers payload is not displayed: the backend never populates it.

## 4. Technical Approach & Angular v22 Constraints
- **State Management**: Use Angular Signals (`errors`, `isLoading`, `hasLoaded`, `useDateRange`, `startDateStr`, `endDateStr`).
- **Data Fetching**: Use a dedicated `@Injectable({providedIn: 'root'})` service (`TransformationErrorsService`) to call `/api/v1/logs/transformation-errors` with `Accept: application/x-flatbuffers`.
- **FlatBuffers Integration**: Generate the TypeScript classes from `core-layer/mitm_http-server/schematas/transformation_errors.fbs` with `flatc --ts` into `src/app/core/models/schematas`.
- **Components**:
  - `TransformationErrorsComponent` (Smart component, manages state and fetches data)
  - `TransformationErrorsTableComponent` (Dumb component, receives data via `input()`)

## 5. Acceptance Criteria
- [ ] The table displays transformation errors fetched from the backend (FlatBuffers).
- [ ] Selecting the view does not trigger a backend request; only "Refresh Transformation Errors" or a date-filter change does.
- [ ] Date range filtering sends RFC3339 parameters and filters backend results.
- [ ] CSV Export generates a valid CSV file of the visible data.
- [ ] The navigation entry is visible to `USER` and `ADMIN`.
