# Agent Tasks: Web-Frontend Scheduler

All tasks apply to the `admin-frontend/mitm_fe_web` repository.

## Task 1: Interfaces, Models & Service Setup
- **Module:** `admin-frontend/mitm_fe_web`
- **Action:** 
  1. Create `src/app/features/scheduler/models/job.model.ts` mapping the C++ structs (ID, Name, Command, Cron Expr, Status, Next Run, Active State).
  2. Create `src/app/features/scheduler/services/scheduler.service.ts` using `@Service` / `@Injectable({providedIn: 'root'})`.
  3. Implement `HttpClient` calls for `GET`, `POST` (Add/Edit), `DELETE`, `POST /stop`, `POST /execute`.
  4. Expose the job list as a `Signal<Job[]>`.

## Task 2: Spartan-NG Setup & Base UI Components
- **Module:** `admin-frontend/mitm_fe_web`
- **Action:**
  1. Initialize/Install required Spartan-NG components via Nx or Angular CLI if not already present (Button, Checkbox, Dialog, Table, Icon).
  2. Create `src/app/features/scheduler/scheduler.component.ts` (Smart Component).
  3. Implement the header bar (Refresh button, Auto-Refresh checkbox, Add/Edit/Delete/Stop/Execute buttons) in `scheduler.component.html`.
  4. Implement the 5-second polling logic using Signals / RxJS when Auto-Refresh is active.

## Task 3: The Scheduler Table
- **Module:** `admin-frontend/mitm_fe_web`
- **Action:**
  1. Create `src/app/features/scheduler/components/scheduler-table/scheduler-table.component.ts`.
  2. Implement the Spartan-NG data table displaying all columns.
  3. Use `input<Job[]>()` to receive data and `output<Job>()` (or `model()`) for row selection.
  4. Format "Next Run" into the local timezone within the template or via a computed signal.

## Task 4: The Job Editor Dialog
- **Module:** `admin-frontend/mitm_fe_web`
- **Action:**
  1. Create `src/app/features/scheduler/components/job-editor-dialog/job-editor-dialog.component.ts`.
  2. Implement a Spartan-NG dialog with Angular Signal Forms (`@angular/forms/signals`) for Name, Command, Cron Expression, and Enabled status.
  3. Wire the dialog to the "Add Job" and "Edit Job" buttons in the main component.

## Task 5: Routing & Integration
- **Module:** `admin-frontend/mitm_fe_web`
- **Action:**
  1. Create `src/app/features/scheduler/scheduler.routes.ts`.
  2. Expose the `SchedulerComponent` as the default route.
  3. Register the feature route in the main application routing file (`src/app/app.routes.ts` or similar).

## Task 6: Permissions & Error Handling
- **Module:** `admin-frontend/mitm_fe_web`
- **Action:**
  1. Add error handling (e.g., catching `403 Forbidden` or other HTTP errors) in the `SchedulerService`.
  2. Display errors using a Spartan-NG toast/alert or basic error message handling when an action fails.
