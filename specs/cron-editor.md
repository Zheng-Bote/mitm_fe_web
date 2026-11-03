# Feature Spec: Cron Editor for Scheduler Jobs

## 1. Problem & Scope
The "Add Job" and "Edit Job" dialogs of the Scheduler page ask for a raw cron expression (e.g. `55 */8 * * *`), which is hard to read and easy to get wrong.

**Target Component:** `admin-frontend/mitm_fe_web` (Isolated)

## 2. User Goals
As an ADMIN user, I want to:
- Build common schedules (every N minutes, hourly, daily, weekly, monthly) without knowing cron syntax.
- Still enter any cron expression by hand.
- See in plain English when a job runs and the next run times before saving.

## 3. Non-Goals
- Backend changes. `cron_expr` stays a 5-field expression (`minute hour day-of-month month day-of-week`); `mitm_scheduler-server` evaluates it in UTC.
- Third-party cron editor widgets (e.g. `ngx-cron-editor`: Angular ≤ 18 only, requires Angular Material).

## 4. Scheduler Constraints
- `mitm_scheduler-server` (Rust crate `cron` 0.12) numbers weekdays `1 = SUN … 7 = SAT`, unlike Unix cron (`0 = SUN`). The editor therefore writes weekday names (`MON`–`SUN`) and rejects numeric weekdays.
- All times are UTC.

## 5. Acceptance Criteria
- [x] A reusable `app-cron-editor` form control (ControlValueAccessor) built with Spartan-NG components replaces the cron text input in the job editor dialog.
- [x] Tabs: **Minutes** (every N minutes, N = 1–59), **Hourly** (minute), **Daily** (time), **Weekly** (weekdays + time), **Monthly** (day 1–31 + time), **Advanced** (raw expression).
- [x] Editing an existing job opens the tab that matches its expression; expressions without a matching tab open in **Advanced** unchanged.
- [x] The editor shows a plain-English description (`cronstrue`) and the next 3 run times in UTC (`cron-parser`).
- [x] An expression that does not have exactly 5 fields, cannot be parsed, or uses numeric weekdays is invalid and blocks saving with an error message.
- [x] UI language is English.
