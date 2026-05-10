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
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Runs `prisma generate && next build` (TypeScript checked here)
npm run lint       # ESLint

npm run db:migrate # prisma migrate dev (loads .env.local via the `dotenv` binary from the dotenv-cli package)
npm run db:push    # prisma db push (loads .env.local via the `dotenv` binary from the dotenv-cli package)
npm run db:seed    # Runs prisma/seed.ts via tsx
npm run db:studio  # Opens Prisma Studio
```

`prisma generate` must run before `next build` because the generated client is gitignored — without it, TypeScript can't resolve `PrismaClient` imports. There are no tests currently.

## What this app does

**MaxGate** is a WiFi captive portal for Max Marketing Firm. When a customer connects to a business's guest WiFi, the router (running openNDS) redirects them to this portal. The customer fills in their name/email/phone, which is pushed to GoHighLevel CRM, and then they are granted internet access.

The auth flow is:

1. Router → `gate.maxmarketingfirm.com/{slug}?fas=<base64>` (splash page)
2. Customer submits form → `POST /api/connect`
3. API decodes the `fas` param, optionally verifies `gatewaymac` matches `business.router_mac`, fires GHL push (async, non-blocking), computes `tok = sha256(hid + faskey)`, returns `redirectUrl`
4. Client browser → `http://{gatewayaddress}/opennds_auth/?tok={tok}&redir={successUrl}` (grants WiFi)
5. Router redirects to `/{slug}/success`

## Architecture

**Data flow:** Supabase (read-only business config) → Next.js SSR → client form → `/api/connect` → GoHighLevel REST API + openNDS auth redirect.

Leads are **never stored in Supabase** — all lead data goes to GoHighLevel only.

### Two database paths

There are **two separate clients pointing at the same Supabase Postgres database**, used at different times for different reasons. This is intentional but easy to trip over.

**Path A — Runtime reads (Supabase JS client):**

- Client: `@supabase/supabase-js` configured in [src/lib/supabase.ts](src/lib/supabase.ts) with the service-role `SUPABASE_SECRET_KEY`.
- Transport: HTTPS to Supabase's PostgREST API (`NEXT_PUBLIC_SUPABASE_URL`). No raw Postgres connection.
- RLS: bypassed because the service-role key is used (never exposed to the browser — it's only read in server code).
- Used by: [src/app/[slug]/page.tsx](src/app/[slug]/page.tsx) (SSR) and [src/app/api/connect/route.ts](src/app/api/connect/route.ts) — both call `getBusinessBySlug(slug)`.
- Why this for runtime: HTTP-based, stateless, no Postgres connection pooling to manage in serverless functions, and works on edge runtimes if needed.
- Result shape: cast to the hand-written `Business` type in `@/types/business` — Supabase JS returns untyped rows, so this type is the source of truth for runtime code.

**Path B — Schema management & seeding (Prisma + pg adapter):**

- Client: `@prisma/client` v7 with `@prisma/adapter-pg`. Generated client lives at [src/generated/prisma/](src/generated/prisma/).
- Transport: direct Postgres TCP connection via the `pg` driver, using `SUPABASE_DATABASE_URL` (a full `postgres://...` connection string, not the Supabase REST URL).
- RLS: bypassed by design — direct DB connections aren't subject to PostgREST's RLS enforcement.
- Used by: [prisma/seed.ts](prisma/seed.ts), `prisma migrate`, `prisma db push`, `prisma studio`. **Not imported anywhere in `src/`** at runtime today.
- Why this for schema/seed: code-first schema evolution (`schema.prisma`), generated types, and `prisma migrate` for tracked migrations. This work doesn't fit cleanly into the Supabase JS client.

**Implications you'll keep running into:**

1. **The schema lives in two places that must stay in sync.** [prisma/schema.prisma](prisma/schema.prisma) describes the `Business` model on the Prisma side; the actual columns live in Supabase; and the runtime `Business` type in `@/types/business` is what the app code sees. Changing one doesn't change the others. If you add a column, plan all three: schema → push to DB → update the runtime type (and `getBusinessBySlug` if needed).
2. **The Prisma client is generated to a custom path.** `output = "../src/generated/prisma"` in `schema.prisma` puts it inside `src/`, not `node_modules/.prisma/client`. Imports look like `import { PrismaClient } from "@/generated/prisma/client"`. The directory should be gitignored — `prisma generate` recreates it on every build.
3. **Edge-runtime caveat.** `@prisma/adapter-pg` uses the `pg` driver, which is Node-only. If runtime code ever switches to Prisma, route handlers using it must run on the Node runtime, not Edge. The Supabase JS client has no such constraint.
4. **Seed env is `.env.local`.** Prisma CLI commands need `SUPABASE_DATABASE_URL`, which only lives in `.env.local`. That's why every `db:*` script is wrapped in `dotenv-cli`. Running raw `prisma migrate dev` without it will fail.
5. **If you migrate runtime to Prisma**, follow the seed-script pattern: create a singleton `PrismaClient` with `PrismaPg` adapter, replace `getBusinessBySlug` to call `prisma.business.findUnique({ where: { slug, is_active: true } })`, and confirm the route stays on the Node runtime.

**`src/lib/`** — all server-side logic:

- `supabase.ts` — service role client (bypasses RLS); `getBusinessBySlug(slug)` is the only query
- `opennds.ts` — `decodeFASParams(fas)` base64-decodes the FAS string and parses key=value pairs; `computeTok(hid, faskey)` computes `sha256(hid+faskey)` using Node.js `crypto` — this is security-critical for WiFi grant; `normalizeMac(mac)` strips separators and lowercases for safe MAC comparison in the router-verification check
- `ghl.ts` — `pushToGHL()` upserts a GHL contact via the V2 API and is called fire-and-forget from the API route. The optional workflow-trigger step is currently commented out and not used
- `utils.ts` — `normalizePhone()` (→ E.164), `isValidEmail()`, `safeColor()`

**`src/app/[slug]/page.tsx`** — SSR server component; fetches business by slug, renders `PortalLayout` + `CaptureForm`. Returns 404 if slug not found or inactive.

**`src/app/api/connect/route.ts`** — The critical POST handler. Order of operations: decode FAS → load business → (if `business.router_mac` is set) verify `gatewaymac` match else 403 → fire-and-forget GHL push → compute `tok` → return `{ redirectUrl }`. WiFi grant must never be blocked by GHL failures, but it MUST be blocked by a `router_mac` mismatch — that check runs before any GHL or token work for exactly this reason.

**`src/components/CaptureForm.tsx`** — Client component (`"use client"`). Handles phone formatting, loading spinner, and the fetch to `/api/connect`. On success, does `window.location.href = data.redirectUrl`.

## Environment variables

| Variable                   | Used in                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts`                                                                                                  |
| `SUPABASE_SECRET_KEY`      | `lib/supabase.ts` — server only                                                                                    |
| `GHL_API_KEY`              | `lib/ghl.ts` — server only; Private Integration token with `contacts.write` and `contacts/workflow.write` scopes   |
| `SUPABASE_DATABASE_URL`    | `prisma/seed.ts` and Prisma CLI commands (`db:migrate`, `db:push`, `db:studio`); direct Postgres connection string |

Copy `.env.local` and fill in real values. The `businesses` table in Supabase has RLS enabled; the secret key bypasses it. Prisma talks to Postgres directly via `SUPABASE_DATABASE_URL` and bypasses RLS by design.

## Business schema (reference only)

The `businesses` table columns that matter most:

- `slug` — URL identifier, used to look up portal config
- `faskey` — combined with `hid` to compute the openNDS `tok`; must match the value configured on the router
- `ghl_location_id` — required for GHL contact creation
- `router_mac` — optional; when set, the connect route requires the FAS-supplied `gatewaymac` to match (case- and separator-insensitive). Use the `br-lan` MAC of the router (not WAN). Leave NULL to disable verification for businesses you haven't onboarded yet.
- `address` — optional free-form text; documentation only (where the router is physically installed). Not read by any runtime code.

Note: the `Business` runtime type in `@/types/business` still includes `ghl_workflow_id`, but the column was dropped from `schema.prisma` and the workflow-trigger code in [src/lib/ghl.ts](src/lib/ghl.ts) is commented out. Treat workflow triggering as removed; clean up the runtime type next time you touch the file.

Seed data for testing: [prisma/seed.ts](prisma/seed.ts) (run via `npm run db:seed`).

## Testing the auth flow locally

Generate a fake FAS param:

```bash
node -e "console.log(Buffer.from('hid=testhid123, clientip=192.168.8.100, clientmac=AA:BB:CC:DD:EE:FF, gatewayname=TestGW, gatewayaddress=192.168.8.1, gatewaymac=11:22:33:44:55:66, authdir=opennds_auth, originurl=http://example.com, clientif=br-lan').toString('base64'))"
```

Then visit: `http://localhost:3000/test-business?fas=<output>`

If the test business has `router_mac` set in the DB, the `gatewaymac` value above must match it (after normalization) or the request will 403. The seeded `test-business` row has `router_mac` NULL, so verification is skipped and any `gatewaymac` value works.

## Captive portal constraints

- The splash page loads **before the customer has internet access**. External resources (fonts, images, CDNs) must be in the router's walled garden or bundled. Inter font is loaded via `next/font/google` which self-hosts it at build time — safe.
- Captive portal popup browsers (iOS WebKit, Android mini-browser) are limited. Keep client-side JS minimal.
- The `PORTAL_BASE` constant in `api/connect/route.ts` is hardcoded to `https://gate.maxmarketingfirm.com` — update if the domain changes.
