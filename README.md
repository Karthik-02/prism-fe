# PRism Frontend Portal (`prism-fe`)

This Next.js + Tailwind app is the permission-first control plane for PRism. The UI adapts to the caller’s `CAN_*` permissions and exposes dedicated dashboards for developers, leads, release managers, and administrators. The repo pairs shipping-ready Next.js tooling with `react-query` data fetching, release note markdown editing, and audit/notification surfaces wired to the backend API.

## Tech at a glance
- `Next.js` app directory with Tailwind-based styling and CSS variables for gradients.
- Prefetch + caching powered by `@tanstack/react-query`.
- Permission awareness driven by `prism-be`’s `CAN_*` keys and the new `/audit-logs` and `/notifications` endpoints.
- Release note composition with optimistic concurrency + live preview (see `release_notes_struct.md` for the template).
- Persona cards, release manager timeline, and RBAC workbench reflect role-specific instructions from `agent.md`.
- Brand assets: the dark/light logos that ship with `prism-be/public/assets/logo_full_b.png` / `logo_full_w.png` are mirrored under `prism-fe/public/assets` so both surfaces stay in sync.

## Local development
1. Run `npm install`. _Note:_ the sandbox currently cannot reach `registry.npmjs.org`; rerun the install once DNS/connectivity allow it (the rest of the stack assumes dependencies exist in `node_modules`)._
2. Ensure the backend is running (default: `http://localhost:3000/api/v1`) and set `NEXT_PUBLIC_API_URL` to that base. You can also copy `.env.example` to `.env.local` or set the variable directly:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
   ```
3. Start the dev server: `npm run dev`.
4. Validate formatting/typing with `npm run lint` (note: Next.js may prompt to reconfigure ESLint on first run; accept the recommended settings if prompted).
5. Refresh the browser once the backend issues JWT cookies (the UI assumes the auth cookie is already present in the browser).

## Production build
1. Set `NODE_ENV=production` and point `NEXT_PUBLIC_API_URL` at the deployed API (for example `https://api.example.com/api/v1`).
2. Build the standalone output: `npm run build`.
3. Launch the optimized server: `npm run start`.
4. The Next.js output is configured for `standalone` deployments, making it suitable for container platforms like Vercel/Render or as a static export when pairing with a CDN.

## API wiring
- Profile data: `GET /profile`
- PRs: `GET /prs`
- Releases: `GET /releases`
- Release notes: `GET /release-notes/my?releaseId=…` and `PUT /release-notes/my?releaseId=…`
- Audit trail: `GET /audit-logs`
- Notifications: `GET /notifications`

All requests include `credentials: include` to reuse the backend JWT cookie. Fallback data is still available when the API is offline; that data lives in `lib/api.ts`.

## Pages & documentation
- `app/login/page.tsx` drives the OTP-based entry (request + verify) and is the only public screen.
- `app/page.tsx` is the mission console overview.
- `app/prs/page.tsx`, `app/releases/page.tsx`, `app/release-notes/page.tsx`, `app/users/page.tsx`, `app/roles/page.tsx`, `app/email-domains/page.tsx`, `app/audit/page.tsx`, and `app/profile/page.tsx` deliver the full admin panels.
- See `pageDoc.md` for a breakdown of each page/zone and the APIs it touches.
