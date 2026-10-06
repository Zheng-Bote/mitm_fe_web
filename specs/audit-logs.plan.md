# Implementation Plan: Audit Logs

## 1. Dependencies
- Install `flatbuffers` for parsing the API payloads.
- Install `exceljs` and `file-saver` (or handle download natively) for generating Excel reports.
- Install `@types/file-saver` if needed.
- `flatc` TS generated schemas are placed in `src/app/schematas`.

## 2. Services
- **AuditLogsService** (`src/app/features/audit-logs/services/audit-logs.service.ts`):
  - Injected at the root level (`@Injectable({providedIn: 'root'})`).
  - Methods: `getLogs(from?: string, to?: string): Observable<JobAuditLog[]>`
  - The HTTP request must set `{ responseType: 'arraybuffer', headers: { 'Accept': 'application/x-flatbuffers' } }`.
  - Maps the incoming `ArrayBuffer` via `flatbuffers.ByteBuffer` and the generated TS classes (`schematas.JobAuditLogList.getRootAsJobAuditLogList(...)`) to a clean TS interface.

- **ExcelExportService** (`src/app/features/audit-logs/services/excel-export.service.ts`):
  - Dedicated service to handle the ExcelJS logic.
  - Takes raw log data, creates the Workbook, adds "Batch-Uploads", "Upload-Report", and "Chart" (summary stats) sheets.
  - Uses native browser capabilities (`Blob` and `URL.createObjectURL` / `a.download`) to save the file.

## 3. UI Components
- **AuditLogsComponent** (`src/app/features/audit-logs/audit-logs.component.ts`):
  - Smart component managing Signals for state: `logs`, `isLoading`, `autoRefresh`, `startDate`, `endDate`.
  - Uses `effect()` to manage the polling `setInterval` for the 5-second auto-refresh.
  - Calls `AuditLogsService` to fetch data.
  - Handles the dialog opening for the Excel Export.

- **AuditLogsTableComponent** (`src/app/features/audit-logs/components/audit-logs-table/audit-logs-table.component.ts`):
  - Dumb component using Spartan-NG primitives (e.g. `hlmTable`).
  - Displays the dataset passed via `input<JobAuditLog[]>()`.

- **ExportReportDialogComponent** (`src/app/features/audit-logs/components/export-report-dialog/export-report-dialog.component.ts`):
  - Dialog containing form fields: `startDate`, `endDate`, `jobName`, and `topic`.
  - Returns the filter criteria to the smart component upon closing.

## 4. Work Breakdown (Tasks)
1. **Setup**: Run `npm install flatbuffers exceljs file-saver` and commit generated schemas.
2. **Services**: Implement `AuditLogsService` and `ExcelExportService`.
3. **Dumb Components**: Implement `AuditLogsTableComponent` and `ExportReportDialogComponent`.
4. **Smart Component**: Implement `AuditLogsComponent` (routing, state management, auto-refresh).
5. **Integration**: Add route to app-routing.
