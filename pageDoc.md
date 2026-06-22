# Page documentation

## `app/layout.tsx`

- **Purpose:** Wraps the app with the React Query provider and global workspace styles.
- **Notes:** The rebuilt frontend uses a single topbar-driven shell instead of the old sidebar layout.

## `app/login/page.tsx`

- **Purpose:** OTP authentication entry point for requesting and verifying login codes.
- **APIs:** `POST /auth/request-otp`, `POST /auth/verify-otp`.
- **Guardrails:** Shows dev OTP hints when available and keeps identity fields explicit because email and GitHub identity affect verification state.

## `app/page.tsx`

- **Purpose:** Operational overview with live PR, release, verification, audit, and notification summaries.
- **APIs:** `GET /profile`, `GET /prs`, `GET /releases`, `GET /users`, `GET /audit-logs`, `GET /notifications`.
- **UX notes:** Uses the shared `AppFrame`, top navigation chips, wide cards, and permission-aware quick links instead of anchor-based single-page sections.

## `app/prs/page.tsx`

- **Purpose:** PR creation, reviewer assignment, status updates, release-mode changes, and release-link visibility.
- **APIs:** `GET /prs`, `POST /prs`, `PATCH /prs/:id/assign`, `PATCH /prs/:id/status`, `PATCH /prs/release-mode`, `GET /releases`, `GET /users/directory`.
- **Permissions:** `CAN_CREATE_PR`, `CAN_REVIEW_PR`, `CAN_ASSIGN_PR`, `CAN_VIEW_ALL_PRS`.
- **UX notes:** CRUD forms are collapsed behind disclosures and every mutation is scoped to the PR row it changes.

## `app/releases/page.tsx`

- **Purpose:** Release creation, release updates, production-date management, and contextual PR mapping.
- **APIs:** `GET /releases`, `GET /releases/:id`, `POST /releases`, `PATCH /releases/:id`, `PATCH /releases/:id/date`, `POST /releases/:id/add-pr`, `DELETE /releases/:id/remove-pr`, `DELETE /releases/:id`.
- **Permissions:** `CAN_MANAGE_RELEASE`, `CAN_SET_PROD_RELEASE_DATE`, release-note permissions for read access to release detail.
- **UX notes:** The page uses a two-column workspace with a selectable release list and a contextual detail panel instead of raw ID entry forms.

## `app/release-notes/page.tsx`

- **Purpose:** Personal and consolidated release-note authoring with structured guidance from the repository note template.
- **APIs:** `GET /releases`, `GET /release-notes/my`, `PUT /release-notes/my`, `GET /release-notes/:releaseId`, `PUT /release-notes/:releaseId`.
- **Permissions:** `CAN_GENERATE_OWN_RELEASE_NOTES`, `CAN_GENERATE_FULL_RELEASE_NOTES`.
- **UX notes:** Includes live markdown preview, additional structured sections, and release selection from the real release list.

## `app/users/page.tsx`

- **Purpose:** User creation, verification decisions, and role assignment/removal.
- **APIs:** `GET /users`, `POST /users`, `POST /users/:id/approve`, `POST /users/:id/disapprove`, `POST /users/:id/roles`, `DELETE /users/:id/roles/:roleId`, `GET /roles`.
- **Permissions:** `CAN_CREATE_USER`, `CAN_VERIFY_USERS`, `CAN_ASSIGN_ROLE`.
- **UX notes:** Verification and role changes happen inside each user card rather than in global detached admin forms.

## `app/roles/page.tsx`

- **Purpose:** Role creation, role updates, permission-set syncing, and direct permission add/remove actions.
- **APIs:** `GET /roles`, `POST /roles`, `PUT /roles/:id`, `DELETE /roles/:id`, `POST /roles/:id/permissions`, `DELETE /roles/:id/permissions/:permissionId`.
- **Permissions:** `CAN_MANAGE_ROLES`, `CAN_MANAGE_PERMISSIONS`.

## `app/email-domains/page.tsx`

- **Purpose:** Domain allowlist administration for OTP login.
- **APIs:** `GET /email-domains`, `POST /email-domains`, `PATCH /email-domains/:id/status`, `DELETE /email-domains/:id`.
- **Permissions:** `CAN_MANAGE_EMAIL_DOMAIN`.
- **UX notes:** Status changes are record-scoped and the old ID-only status form has been removed.

## `app/audit/page.tsx`

- **Purpose:** Dedicated audit and notification delivery workspace for release and RBAC governance.
- **APIs:** `GET /audit-logs`, `GET /notifications`.
- **Permissions:** `CAN_MANAGE_ROLES` or `CAN_MANAGE_RELEASE`.
- **UX notes:** Metadata is rendered inline per audit row and the page shares the same rebuilt layout as the rest of the app.

## `app/profile/page.tsx`

- **Purpose:** Profile inspection, identity updates, and session control.
- **APIs:** `GET /profile`, `PUT /profile`, `POST /auth/logout`.
- **Permissions:** Authenticated users.
- **UX notes:** Explains the backend re-verification behavior when email or GitHub identity changes, and includes a sign-out-all-sessions action.
