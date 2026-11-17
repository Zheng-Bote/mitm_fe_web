# Feature Spec: Scheduler Job Args & Restart on Exit (Issue #29)

Issue: https://github.com/Zheng-Bote/mitm_fe_web/issues/29 – builds on `specs/issue-93-api-envelope.md` (`POST /api/v1/jobs` single job, `PUT /api/v1/jobs/:name`, core-layer `mitm_http-server` 3.5.0).

## Problem
"Add Job" and "Edit Job" fail with `422`: the core-layer requires `restart_on_exit` (bool) and accepts `args` (JSON object), but the `Job` model and the job editor know neither. Without `args` a job cannot be configured from the WUI, and an edit would replace the stored `args` with `null`.

## Scope (decided 2026-11-17)
A plain JSON text field – **no** dynamically generated form, no raw/form sync, no template offer.

## Requirements
1. The `Job` model contains `args` (JSON object or `null`) and `restart_on_exit` (boolean).
2. The job editor has a "JSON Args" textarea and a "Restart on exit" checkbox.
3. Editing a job pre-fills the textarea with its current `args` (pretty-printed, `{}` for `null`) and the checkbox with `restart_on_exit`; saving without changes sends the same `args` object.
4. A new job starts with `{}` and `restart_on_exit = false`.
5. An empty textarea is sent as `{}`. Invalid JSON or a root that is not an object marks the field invalid with the parse error and disables "Save".
6. Saving sends `args` (object) and `restart_on_exit` (`POST /api/v1/jobs` / `PUT /api/v1/jobs/:name`).
7. If the server rejects a save, the dialog stays open and a toast shows the server's error `detail`.

## Tasks
- [x] T1 `models/job.model.ts`: add `args`, `restart_on_exit`.
- [x] T2 `job-editor-dialog`: textarea + JSON object validator, checkbox, pre-fill, parse on save.
- [x] T3 `scheduler.component.ts`: toast with the error detail when saving fails.
- [x] T4 Unit tests (validator, pre-fill, emitted payload); CHANGELOG, README, `specs/scheduler.md` endpoints.
