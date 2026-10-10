# Tasks: RBAC Enhancements and Session Management

## Task 1: Auth Service Updates
- Update `AuthService` to include `client_ip` in the login payload. (Note: Getting local IP in a pure browser environment is restricted; we might need to rely on a basic fallback or external service, or if this app runs in a context where IP is provided, use that. Actually, standard web apps just send the IP via the network request itself, but if the spec explicitly demands sending it in the payload, we will mock it or fetch it via a simple WebRTC trick / external API if required).
- Add session renewal logic (`setInterval` or RxJS `interval` mapped to a signal effect or standard service logic) that pings `/api/v1/auth/me` every 30 minutes.
- Update login error handling to explicitly catch and display the inactive account error.

## Task 2: RBAC Component & Model Updates
- Update User interface/model to include `first_name`, `last_name`, and `is_active`.
- Add `First Name` and `Last Name` columns to the user table view.

## Task 3: Add/Edit User Forms (Signal Forms)
- Refactor or update the Add User dialog to use `@angular/forms/signals` (if applicable) and include the new fields.
- Create or update the Edit User dialog to allow updating `first_name`, `last_name`, and `is_active`.
- Wire up the UI to call `PUT /api/v1/iam/users/:id`.

## Task 4: Terminate Session Action
- Add a "Terminate Session" button/action for the selected user in the RBAC view.
- Wire it up to call `DELETE /api/v1/iam/users/:id/session`.

## Task 5: QA & Finalization
- Verify Angular v22 standards are met (Signals, no `standalone: true`, etc.).
- Update `CHANGELOG.md`.
