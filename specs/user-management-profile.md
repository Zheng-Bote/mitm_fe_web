# Feature Spec: User Management Department and eMail

## 1. Problem & Scope
The User Management (RBAC) page lists only ID, Username, First Name, Last Name and Active, and the Add/Edit User dialog cannot maintain department and e-mail address, although the IAM API already provides them.

**Target Component:** `admin-frontend/mitm_fe_web` (Isolated)

## 2. User Goals
As an ADMIN user, I want to:
- See department and e-mail address of every user in the users table.
- Set and change department and e-mail address when adding or editing a user.

## 3. Non-Goals
- Backend changes: `GET /api/v1/iam/users` already returns `department` and `email`; `POST /api/v1/iam/users` and `PUT /api/v1/iam/users/:id` accept both (an empty `email` is stored as `null`).

## 4. Acceptance Criteria
- [x] The users table shows the columns **Department** and **eMail** after Last Name; unset values show `-`.
- [x] The Add User and Edit User dialog has **Department** and **eMail** fields, prefilled when editing, and sends both on save.
- [x] An invalid e-mail address blocks saving and shows an error message.
