# Tasks: API Response Envelope & RMM Level 2 (core-layer #93)

Backend: `core-layer/mitm_http-server` 3.5.0 (branch `feature/issue-93-api-standardization`), contract in `core-layer/mitm_http-server/docs/api/api_v1.md` ("Response Envelope").
Issue: https://github.com/Zheng-Bote/mitm_core-layer/issues/93 – cross-layer spec: `mitm-2/specs/features/issue-93-api-standardization/`.

Every JSON response under `/api/v1/*` is `{id, status, code, title, detail, meta, data}`; payload in `data`, errors with `data: null`. FlatBuffers `200` responses stay binary. Removed routes: `POST /iam/assign-role`, `POST`/`DELETE /config/transformations/topic-dependencies`, bulk `POST /jobs`.

- [ ] **T4 – Web Frontend Envelope Adaptation (`admin-frontend/mitm_fe_web`)**: Add envelope unwrapping / error handling in `mitm_fe_web` and update endpoint calls to the RMM Level 2 paths. Detailed tasks: `admin-frontend/mitm_fe_web/specs/issue-93-api-envelope.md` (branch `feature/issue-93-api-envelope`).
  - [ ] T4.1 `core/interceptors/api.interceptor.ts`: unwrap `data` for 2xx JSON envelopes (not for `responseType: 'arraybuffer'`); map error envelopes (`code`, `title`, `detail`, `id`).
  - [ ] T4.2 Error texts: `auth/auth-error-message.ts:20` and `features/rbac/rbac.component.ts:356` read `errors[0]`; `scheduler.service.ts` `formatError` reads `error.message` → use `detail`. FlatBuffers requests receive JSON errors as `ArrayBuffer` → decode.
  - [ ] T4.3 `core/services/rbac.service.ts:31`: `POST /iam/assign-role` → `PUT /iam/users/:id/roles` with `{role_ids}`.
  - [ ] T4.4 `features/scheduler/services/scheduler.service.ts`: `addJob` → `POST /jobs` with a single object (409 = exists); `editJob` → `PUT /jobs/:name` with `{command, args, cron_expr, enabled, restart_on_exit}`; show 422 details (related: fe_web issue #29).
  - [ ] T4.5 Check 403 handling: the interceptor logs out on every 403, including `RBAC_FORBIDDEN`; only `401`/`USER_INACTIVE` should log out.
  - [ ] T4.6 Update unit-test mocks (`*.spec.ts`) to the envelope.
