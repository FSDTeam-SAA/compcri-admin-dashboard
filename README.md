# Aurox Day Admin Dashboard

Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn-style Radix components, Axios, NextAuth v4, TanStack Query v5, Sonner, and Recharts.

## Run locally

1. Install dependencies with `npm install --legacy-peer-deps`.
2. Copy `.env.example` to `.env` when setting up a new environment. Preserve any existing configured values.
3. Set `NEXTPUBLICBASEURL` to the backend API prefix, normally `http://localhost:5000/api/v1`. The existing `NEXT_PUBLIC_BASE_URL` spelling is also accepted.
4. Set `NEXTAUTH_URL` and a generated `NEXTAUTH_SECRET`.
5. Start the backend from `../compcri-backend` with `npm run dev`.
6. Run `npm run dev` here and open http://localhost:3000.

Use an existing account with role `ADMIN`. The backend's `npm run seed` can create the administrator configured by its `ADMIN_EMAIL` and `ADMIN_PASSWORD`; it does not reset an existing account. Newly configured passwords require at least 10 characters. No account is automatically seeded or modified by this dashboard.

## Features

- Overview and subscription analytics from the backend, with independent period controls and currency selection where multiple currencies exist.
- Searchable, filtered, server-paginated user and coupon lists.
- User details, suspend/unblock, and account deletion scheduling with a reason.
- Influencer creation, photo upload, discount configuration, coupon details, and deletion.
- Profile updates, avatar uploads, password changes, and logout.
- Login, password recovery, six-digit OTP verification/paste, resend cooldown, and password reset.
- Desktop, tablet, and mobile layouts; responsive navigation; scrollable data tables; skeletons; error/retry and empty states; mutation feedback.

## Authentication and data

All backend request functions live in `lib/api.ts`. Component-level `useQuery` and `useMutation` calls manage cached data and refresh affected lists after mutations. Axios attaches the session access token through a request interceptor and retries an expired-token request after NextAuth refresh.

NextAuth's credentials provider calls `POST /auth/login`, rejects non-admin accounts, and stores refresh credentials only in its encrypted HTTP-only JWT cookie. The browser session exposes `accessToken`, `role`, `_id`, and `user`. The `proxy.ts` file guards dashboard paths; the backend also enforces admin authorization. Remember me allows up to 30 days; other sign-ins expire after 12 hours. Signout revokes the backend refresh token.

The backend additions provide `/admin/coupons`, `/admin/coupons/stats`, and `/admin/coupons/:id`. Coupon availability is computed from dates and usage limits. Coupon performance displays stored counters; applying discounts to App Store/Play Store purchases and attributing redemptions from billing events requires the corresponding mobile/store integration. No transaction or redemption is fabricated by the dashboard.

SMTP must be configured on the backend for recovery email delivery. Cloudinary must be configured for photo uploads. Profile email is read-only because the existing backend does not support changing it. Account deletion follows the backend grace period and does not cancel store billing.

## Verification

- `npm run build`
- `npx tsc --noEmit`
- Backend: `npm test -- tests/integration.test.js`

For disposable browser QA, run `node scripts/admin-dashboard-qa.js` in the backend. It creates an isolated in-memory database on port 5508 with synthetic fixtures and no production credentials. Temporarily run the frontend with `NEXTPUBLICBASEURL=http://localhost:5508/api/v1`, `NEXTAUTH_URL=http://localhost:3007`, and `node node_modules/next/dist/bin/next dev --port 3007`. QA sign-in: `admin@example.test` / `DashboardQA123!`. Stopping the QA server discards its data.

The supplied logo is in `public/logo.png`. Outfit is bundled locally under its [SIL Open Font License](public/fonts/OFL.txt), sourced from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/outfit).
# compcri-admin-dashboard
