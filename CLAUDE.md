# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Warning: Next.js version

This project runs Next.js 16 with React 19. APIs, conventions, and file structure may differ from training data. Before writing any code involving Next.js APIs, read the relevant guide in `node_modules/next/dist/docs/`.

Key differences from older Next.js:

- `params` and `searchParams` in page components are **Promises** and must be `await`ed
- Tailwind CSS v4 uses `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- `--no-src-dir` was NOT used — all source lives under `src/`

## Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build (also runs tsc)
npm run lint     # ESLint
```

There are no tests currently. TypeScript is checked as part of `npm run build`.

## What this app does

**MaxGate** is a WiFi captive portal for Max Marketing Firm. When a customer connects to a business's guest WiFi, the router (running openNDS) redirects them to this portal. The customer fills in their name/email/phone, which is pushed to GoHighLevel CRM, and then they are granted internet access.

The auth flow is:

1. Router → `portal.maxmarketingfirm.com/{slug}?fas=<base64>` (splash page)
2. Customer submits form → `POST /api/connect`
3. API decodes the `fas` param, fires GHL push (async, non-blocking), computes `rhid = sha256(hid + faskey)`, returns `redirectUrl`
4. Client browser → `http://{gatewayaddress}/{authdir}?rhid={rhid}&redir={successUrl}` (grants WiFi)
5. Router redirects to `/{slug}/success`

## Architecture

**Data flow:** Supabase (read-only business config) → Next.js SSR → client form → `/api/connect` → GoHighLevel REST API + openNDS auth redirect.

Leads are **never stored in Supabase** — all lead data goes to GoHighLevel only.

**`src/lib/`** — all server-side logic:

- `supabase.ts` — service role client (bypasses RLS); `getBusinessBySlug(slug)` is the only query
- `opennds.ts` — `decodeFASParams(fas)` base64-decodes the FAS string and parses key=value pairs; `computeRHID(hid, faskey)` computes `sha256(hid+faskey)` using Node.js `crypto` — this is security-critical for WiFi grant
- `ghl.ts` — `pushToGHL()` upserts a GHL contact then optionally triggers a workflow; called fire-and-forget from the API route
- `utils.ts` — `normalizePhone()` (→ E.164), `isValidEmail()`, `safeColor()`

**`src/app/[slug]/page.tsx`** — SSR server component; fetches business by slug, renders `PortalLayout` + `CaptureForm`. Returns 404 if slug not found or inactive.

**`src/app/api/connect/route.ts`** — The critical POST handler. Order of operations: decode FAS → load business → fire-and-forget GHL push → compute rhid → return `{ redirectUrl }`. WiFi grant must never be blocked by GHL failures.

**`src/components/CaptureForm.tsx`** — Client component (`"use client"`). Handles phone formatting, loading spinner, and the fetch to `/api/connect`. On success, does `window.location.href = data.redirectUrl`.

## Environment variables

| Variable                               | Used in                                     |
| -------------------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `lib/supabase.ts`                           |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | (available client-side, not currently used) |
| `SUPABASE_SECRET_KEY`                  | `lib/supabase.ts` — server only             |
| `GHL_AGENCY_API_KEY`                   | `lib/ghl.ts` — server only                  |

Copy `.env.local` and fill in real values. The `businesses` table in Supabase has RLS enabled; the secret key bypasses it.

## Supabase schema (reference only — do not create migrations)

The `businesses` table columns that matter most:

- `slug` — URL identifier, used to look up portal config
- `faskey` — combined with `hid` to compute `rhid`; must match the value configured on the router
- `ghl_location_id` — required for GHL contact creation
- `ghl_workflow_id` — optional; if set, triggers a GHL workflow after contact upsert

Seed data for testing: `seed.sql` (run in Supabase SQL editor).

## Testing the auth flow locally

Generate a fake FAS param:

```bash
node -e "console.log(Buffer.from('hid=testhid123, clientip=192.168.8.100, clientmac=AA:BB:CC:DD:EE:FF, gatewayname=TestGW, gatewayaddress=192.168.8.1, authdir=opennds_auth, originurl=http://example.com, clientif=br-lan').toString('base64'))"
```

Then visit: `http://localhost:3000/test-business?fas=<output>`

## Captive portal constraints

- The splash page loads **before the customer has internet access**. External resources (fonts, images, CDNs) must be in the router's walled garden or bundled. Inter font is loaded via `next/font/google` which self-hosts it at build time — safe.
- Captive portal popup browsers (iOS WebKit, Android mini-browser) are limited. Keep client-side JS minimal.
- The `PORTAL_BASE` constant in `api/connect/route.ts` is hardcoded to `https://portal.maxmarketingfirm.com` — update if the domain changes.
