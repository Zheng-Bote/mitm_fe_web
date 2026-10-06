# Feature Spec: Web-Frontend Scheduler

## 1. Problem & Scope
The C++ frontend (`admin-frontend/mitm_fe_cpp`) has a `SchedulerWidget` that allows `ADMIN` users to manage, monitor, and control background jobs. This functionality needs to be replicated in the Angular v22 web frontend (`admin-frontend/mitm_fe_web`).

**Target Component:** `admin-frontend/mitm_fe_web` (Isolated)

## 2. User Goals
As an ADMIN user, I want to:
- View all registered jobs in a table (ID, Name, Command, Cron Expression, Status, Next Run, Active State).
- Enable "Auto-Refresh" to automatically poll job states every 5 seconds.
- Create new jobs.
- Edit existing jobs.
- Delete jobs.
- Trigger jobs manually (Execute).
- Stop currently running jobs.

## 3. Non-Goals
- Backend implementation (endpoints already exist under `/api/v1/jobs`).
- Real-time WebSocket updates (polling is explicitly sufficient, as in the C++ client).

## 4. API Endpoints to consume
- `GET /api/v1/jobs` - List jobs
- `POST /api/v1/jobs` - Add/Edit job(s)
- `DELETE /api/v1/jobs/{jobName}` - Delete job
- `POST /api/v1/jobs/{jobName}/stop` - Stop running job
- `POST /api/v1/jobs/{jobName}/execute` - Trigger job immediately

## 5. Acceptance Criteria
- [ ] A new Scheduler route/page exists in the Angular application.
- [ ] The table displays all columns matching the C++ client.
- [ ] UI controls (Add, Edit, Delete, Stop, Execute, Refresh, Auto-Refresh) are present and functional.
- [ ] Auto-Refresh polls the API every 5 seconds when enabled.
- [ ] "Next Run" times are formatted in the user's local timezone.
- [ ] Role-based access: Actions modifying state (Add, Edit, Delete, Stop, Execute) are restricted to `ADMIN` users (or handled appropriately with error messages if unauthorized).
- [ ] Uses Spartan-NG components for UI elements (e.g., Table, Button, Dialog/Modal for the Job Editor).
- [ ] Adheres to all guidelines in `.gemini/GEMINI.md` (Standalone Components, Signals, new Control Flow, etc.).
