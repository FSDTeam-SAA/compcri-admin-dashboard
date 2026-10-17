# VPS deployment

The dashboard supports an optional build-time prefix through `NEXT_PUBLIC_BASE_PATH`. Local development defaults to the domain root.

The current VPS deployment uses:
- Source: `/var/www/compcri-admin-dashboard`
- PM2 process: `auroxday-admin`
- URL: `http://2.25.68.237/admin`
- Backend: `https://api.auroxday.com/api/v1`

Set `NEXT_PUBLIC_BASE_PATH=/admin`, `NEXTAUTH_URL=http://2.25.68.237/admin/api/auth`, and `NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3002/admin/api/auth` in the VPS-only `.env.production.local`. Generate a unique `NEXTAUTH_SECRET` on the server. Never commit or package the environment file.

Build using `npm ci --legacy-peer-deps && npm run build`. Copy `public`, `.next/static`, and the server-only production environment into `.next/standalone`. Start using `pm2 start deploy/ecosystem.config.cjs` and persist with `pm2 save`.

Verify `/admin/login`, `/admin/api/auth/session`, protected route redirects, cookie-based login, and backend queries before completing a release. The `scripts/paths.test.mjs` regression tests cover callback and base-path behavior.

The backend update is a targeted admin/coupon patch. Keep the VPS's existing `.env`, process definitions, user uploads, and unrelated application changes. Backups are stored outside the live checkout under `/var/www/auroxday-deploy/backups`.

Nginx serves /admin from its public HTTP port and proxies to the dashboard bound to 127.0.0.1:3002. The reviewed config and activation script are included here; applying them requires separately approved sudo access.
