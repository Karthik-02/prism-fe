# PRism Frontend Agent Guide

## Purpose
- Frontend mission: translate the BRD's centralized PR/release governance vision and the backend API/permissions contract into a modern, fast, and efficient Next.js experience that feels different for each user depending on their role/permissions.
- Portal must honor the permission-first rules from `prism-be/AGENTS.md`, the workflows described in `PRism_Detailed_BRD.docx`, and the technical constraints from `PRism_Detailed_Technical_Architecture_Document.docx`.
- Deliver high-performance UX (just-in-time data, caching, virtualization) while keeping every interaction auditable and permission-safe.

## References
- Business intent & personas: `PRism_Detailed_BRD.docx`
- System architecture, tech stack, permission model: `PRism_Detailed_Technical_Architecture_Document.docx`
- Backend engineering rules, immutable audit expectations, permission keys: `prism-be/AGENTS.md`
- API surface contract: `prism-be/APIDoc.md`
- Backend README for current capabilities and engineering standards: `prism-be/README.md`

## Tech Stack
- `Next.js` + `React` + `TypeScript` for the app shell and routes.
- `Tailwind CSS` for a responsive utility system plus CSS variables for gradients and elevation.
- `React Query` or `SWR` for data fetching with optimistic updates, background refetch, and permission-filtered caching.
- `Zod` for schema validation on forms (PR submission, release notes, role/activity updates).
- `JWT`/`NextAuth.js` gatekeeping aligned with the backend’s OTP/session contract.
- Developer tooling: `ESLint`, `Prettier`, and strict typing mirrors the backend’s disciplined code style.

## Brand & Visual System
- Logos: reuse `prism-be/public/assets/logo_full_b.png` for dark mode and `prism-be/public/assets/logo_full_w.png` for light mode to stay in sync with the existing backend brand assets referenced in the request.
- Palette: deep night purple (#24092f) transitioning through magenta/orange gradients, pairing neon highlights for data badges.
- Typography: expressive headings (e.g., `Space Grotesk` or `Inter var`), purposeful body text, and large, friendly button text to reinforce clarity.
- Layout: asymmetric grid, layered cards, and adaptive spacing to emphasize release telemetry and permission context while maintaining high contrast for accessibility.
- Motion: subtle entrance/transitions on dashboards and modals that follow the brand gradient streak to imply velocity.

## Role-Driven UX Mandate
1. **Developers** (`CAN_CREATE_PR`, `CAN_GENERATE_OWN_RELEASE_NOTES`): lightweight dashboard that surfaces owned PRs, ability to submit PRs, and a compact release note composer tied to active staging windows. Highlight pending reviews and deadlines before staging cutoffs.
2. **Leads/Reviewers** (`CAN_VIEW_ALL_PRS`, `CAN_REVIEW_PR`, `CAN_ASSIGN_PR`): data-rich stability board showing PR lifecycle status, reviewer workload, release readiness, and ability to reassign or escalate PRs. Show audit trails inline for approvals.
3. **Release Managers** (`CAN_MANAGE_RELEASE`, `CAN_SET_PROD_RELEASE_DATE`): release timeline view (staging vs production), cutoffs, and release-pr mapping, with emphasis on notification history and manual adds/removals. Provide schedule controls with strong confirmation flows.
4. **Administrators** (`CAN_MANAGE_ROLES`, `CAN_MANAGE_PERMISSIONS`, `CAN_MANAGE_EMAIL_DOMAIN`, `CAN_CREATE_USER`, `CAN_ASSIGN_ROLE`, `CAN_GENERATE_FULL_RELEASE_NOTES`): dedicated workbench showing RBAC trees, permission heatmaps, audit logs, and release note previewing/publishing controls. Use bold visuals (kanban-style nodes, permission badges) to convey power safely.
5. **QA/Release Note Contributors** (`CAN_GENERATE_OWN_RELEASE_NOTES` without broader rights): streamlined read-only release navigator plus rich markdown composer for personal notes, referencing `release_notes_struct.md` to ensure consistent structure in the download/export flows.

## Experience Differentiation Strategy
- Frontend must surface a unique layout or visual treatment depending on the permission set. Example: hide the release manager timeline for developer-only permission view and instead emphasize PR creation cards. Leads see a status heatmap; admins access an audit list (ordered by `audit_logs` semantics). Use conditional routing and layout wrappers keyed off the authenticated user’s effective permissions.
- All navigation sections and cards must only render actions that map to the canonical `CAN_*` permissions below; otherwise display contextual guidance. Follow `prism-be/AGENTS.md` as the single source of truth for those permission keys.
- Each major zone (PR list, Release board, RBAC controls, Release notes) must provide micro-copy that reflects the role’s objective (e.g., “Approve PRs before staging cutoff” vs “Add PRs to release before cutoffAt”).

## Data & Integration Patterns
- Always include the auth cookie/JWT when calling backend APIs listed in `prism-be/APIDoc.md`. Use incremental static regeneration or dynamic rendering as appropriate; protect all non-public routes via Next.js middleware that validates permissions through the backend session API.
- Prefer client-side fetching with stale-while-revalidate/optimistic updates for interactive flows (PR assignment, release note editing, release mapping) to keep latency low.
- Audit and notification data (from the backend’s `audit_logs` and `notification_logs`) should be surfaced in the UI contextually whenever a state change occurs (e.g., in the release management detail panel show recent notification outcomes so users trust the system).
- When any user updates profile email/GitHub ID, reflect the backend expectation by showing the `PENDING_VERIFICATION` state and an indicator that verifiers (users with `CAN_VERIFY_USERS`) need to approve changes.

## Performance & UX Guardrails
- Layouts must be responsive, use virtualization for long PR/release lists, and provide skeleton loaders to keep the experience feeling fast.
- Use Tailwind’s JIT mode, minimize custom CSS, and cache repeated queries while ensuring permission-aware invalidation (e.g., re-fetch `GET /prs` if the user gains `CAN_VIEW_ALL_PRS`).
- Provide accessible contrast focusing on the dark/light backgrounds; ensure the orange gradient text (brand) pairs with legible backgrounds.
- Release note editors should auto-save drafts and warn about optimistic concurrency conflicts by surfacing the `expectedVersion` workflow.

## Testing and Validation Expectations
- Component-level checks for permission gating: snapshots for visibility and unit tests for derived permission logic.
- Integration tests covering key flows: PR creation (developers), PR approval (leads), release creation/add PR (release managers), role creation/permission assignment (admins), release note crafting (contributors).
- UX verification steps: ensure navigation changes based on permission combinations, confirm logos swap correctly between dark/light modes, and confirm release note markdown matches `release_notes_struct.md` sections.

## Operational Notes
- Monitor frontend performance in Sentry/Vercel; log permission failures client-side before falling back to backend errors so the team can diagnose gating issues.
- Document new UI routes or data requirements inside this agent doc once added to keep the frontend vision aligned with backend expectations.
