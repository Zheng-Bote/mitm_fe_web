---
name: Feature Specification (Spec Kit)
about: Propose a new feature or rule.
title: "Feature: RBAC Enhancements and Session Management"
labels: "feature, spec-kit"
assignees: ""
---

## Feature Intent

Implement the same RBAC and authentication UI extensions in the Angular web frontend that were recently added to the C++ frontend. This includes extending user management with first name, last name, active status, remote session termination, and background session renewal.

## Requirements (EARS Syntax)

1. The system shall allow an admin to edit a user, modifying their first name, last name, and `is_active` status.
2. The system shall allow an admin to provide first name, last name, and `is_active` status when adding a new user.
3. The system shall display the first name and last name columns in the RBAC User table.
4. The system shall provide a "Terminate Session" action for the admin to kill the selected user's session.
5. The system shall automatically renew the user's session in the background (every 30 minutes) to prevent idle timeouts.
6. The system shall explicitly reject login attempts for inactive users and display a clear error message.
7. The system shall resolve and append the `client_ip` to the authentication payload.

## Scope

- Affects the Angular Web-Frontend (`admin-frontend/mitm_fe_web`) specifically:
  - RBAC UI components (User Table, Add User Dialog, Edit User Dialog)
  - Auth Service (Login payload, session renewal timer, error handling)

## SpecDD Architecture Alignment (Drift Control)

Please confirm that this feature respects the global `mitm-2` constraints defined in `.sdd` files:

- [x] **Architecture:** The layered architecture is maintained (no direct bypass from Collector to Delivery).
- [ ] **Architecture:** Feature affects architecture: SpecKit feature forces update of the SpecDD .sdd
- [x] **Security:** Envelope Encryption (AES-GCM) is NOT bypassed for PII data.
- [x] **Data Model:** Core PostgreSQL schemas remain intact (feature-specific tables are allowed).
- [x] **Standards:** SPDX headers and English documentation will be maintained.
- [x] **Standards:** Angular v22 defaults (Signals, Signal Forms, no `standalone: true`) will be strictly adhered to.

## Acceptance Criteria

- [ ] "Edit User" dialog supports `first_name`, `last_name`, and `is_active`.
- [ ] "Add User" dialog supports `first_name`, `last_name`, and `is_active`.
- [ ] RBAC User table shows `First Name` and `Last Name`.
- [ ] Admins can terminate a selected user's session via a UI button/action.
- [ ] Auth Service implements a 30-minute session renewal loop.
- [ ] Inactive users are clearly rejected at login with a descriptive error.
- [ ] Client IP is passed in the `/api/v1/auth/session` request payload.
- [ ] CHANGELOG.md is up-to-date.
