# CLAUDE.md

Guidance for Claude Code (or any future session) working in this repository.

## Project

A booking web app for a unisex beauty/barber salon. React 19 + TypeScript + Vite + Tailwind v4
(CSS-first) + React Router v7 + Supabase (Postgres + Auth). Built as a portfolio + learning project —
see `beauty-salon-booking-project` in the author's Claude memory for the full backstory, or just read
below.

**Status as of this writing:** Phase 0 (scaffold/schema/auth) and Phase 1 (core booking flow) are
written and pass `npm run build`/`npm run lint`. A live Supabase project exists (`eu-central-1`,
ref `qowqhxuqclvfphysjiub`), linked, with all three migrations and `seed.sql` applied successfully —
this verified the exclusion constraint's opclass, the plpgsql compiles, and RLS actually restricts reads
as intended (checked via direct REST calls). `get_available_slots` was also verified against the real
data for the 120-minute coloring service on a Mon-Fri (9-12/12:30-17) day: it correctly offers 9:00 and
10:00 as start times and nothing between 10:00 and 12:30, confirming the lunch-gap "hard block" behavior
works as designed. `create_appointment` was confirmed to reject unauthenticated calls with
`AUTH_REQUIRED`.

**Also verified end-to-end in a real browser** against the live project: Google OAuth login (full
redirect round-trip through Google → Supabase → `/auth/callback`), the `profiles` row created by
`handle_new_user`, `ProtectedRoute` correctly gating `/my-appointments`, the entire booking wizard for
the 120-minute Women's Coloring service (confirmed the UI shows exactly the same lunch-gap-respecting
slots as the raw RPC test — 9:00-10:00 then a gap to 12:30), `create_appointment` actually inserting a
row, and `cancel_appointment` flipping its status. GitHub auth was dropped per project owner's choice
(not needed) — see the git history for the removal commit if it's ever wanted back.

**Also verified (2026-09-09 session), in a real browser against the live project:**
- **Booking flow for other services.** Men's Haircut (30min + 5 buffer) and Beard Trim (15min +
  5 buffer) both booked end-to-end. Confirmed the duration/buffer math differs correctly per service:
  on a Mon-Fri day the 30-min service offers a last morning slot of 11:30 (11:30+30 = 12:00, the
  window edge), while the 15-min service also offers 11:45. `get_available_slots`'s loop guard checks
  `v_candidate + duration <= v_window_end` — `duration` only, not `duration + buffer` — so a booking
  at the very last slot has its buffer hang over the window edge / into the lunch gap (read from the
  migration source; not separately confirmed by inspecting a persisted `blocked_range` at the edge).
  There is only **one** seeded staff member, so "other staff" combinations are not testable without
  adding staff.
- **Cross-service duration-aware blocking.** After booking the 30-min Men's Haircut at 14:00 (blocks
  14:00-14:35 incl. buffer), the Beard Trim availability for the same staff/day correctly dropped
  14:00 / 14:15 / 14:30 and offered 14:45 as the next slot — a 30-min booking removes three 15-min
  candidate slots from a different service, buffer respected.
- **The `SLOT_TAKEN` chain, under a real race.** Two browser tabs (same logged-in user) both driven
  to the confirm step for the identical slot before either booked. Tab A confirmed → success. Tab B
  confirmed → the exclusion constraint fired, `create_appointment` re-raised `SLOT_TAKEN`, supabase-js
  surfaced it as `P0001` with message `SLOT_TAKEN`, and `BookingSummary.tsx`'s
  `error.message.includes('SLOT_TAKEN')` matched: it showed the friendly Slovak error ("Tento termín
  si práve niekto rezervoval — vyberte prosím iný.") **and** bounced the user back to the date/time
  step with a freshly-refetched slot list (10:00 and the adjacent overlapping starts now gone). Not
  just the error path — automatic recovery works too.

**Minor note:** "My Appointments" shows every appointment (past, upcoming, cancelled) with no
filtering, ordered `start_time` descending (`MyAppointmentsPage.tsx:22`) — newest appointment time
first, so a cancelled far-future booking sorts above a sooner confirmed one. Intentional and
consistent; whether "next upcoming first" would be a better default is a v2 UX call. The 2026-09-09
test run left ~3 confirmed test bookings (Thu 2026-09-10: Men's Haircut 10:00 + 14:00, Beard Trim
15:00) in the live DB; harmless, cancel via the UI if unwanted.

**Still not verified**: nothing from the original list remains. Genuinely-parallel (same-millisecond)
racing was not attempted — the two-tab test above is "concurrent sessions, sequential commits", which
exercises the whole app-level chain but not simultaneous row-lock contention. Postgres semantics make
the latter a non-question, so this is left alone deliberately.

## The core problem this app solves

Services have very different durations — a men's haircut is 30-45min, a women's haircut 50-60min,
coloring 90-120min. The calendar has to block the *actual* duration per booking (start_time → start_time
+ duration + buffer, as a Postgres range), not fixed time slots. A 9:00 coloring appointment must show
the stylist as busy well past 10:00 to every other client browsing that day. This is why `appointments`
has a `blocked_range tstzrange` column and a GiST exclusion constraint, rather than a naive "is this
half-hour slot taken" check.

## Commands

```bash
npm run dev      # local dev server
npm run build    # tsc -b && vite build
npm run lint      # oxlint
npm run preview  # preview the production build

npx supabase login                        # interactive browser flow — run this yourself, not via an agent
npx supabase link --project-ref <ref>     # after creating the Supabase project in the dashboard
npx supabase db push                      # applies supabase/migrations/*.sql to the linked project
```

The project is already linked (`supabase/config.toml`'s `project_id` + the CLI's saved link point at
ref `qowqhxuqclvfphysjiub`). `npx supabase login --token <token>` (non-interactive, needs a personal
access token from https://supabase.com/dashboard/account/tokens — the normal browser-based
`supabase login` needs a real TTY and won't work from an agent shell) is a one-time step per machine;
after that, `db push` just works.

## Design system

The visual identity is deliberate, not a default Tailwind skin — see `src/index.css` for the full
token set and `frontend-design` skill notes on why:

- **Palette** is the client-supplied stone/sage set (Dust Grey `#DDD5D0`, Silver `#CFC0BD`, Ash Grey
  `#B8B8AA`, Grey Olive `#7F9183`, Granite `#586F6B`), not an invented one. Light mode uses Dust Grey as
  the ground with darkened-Granite ink; dark mode inverts to a darkened-Granite ground with Dust Grey
  ink and Grey Olive as the accent. **Silver stays constant across both themes** as `--signature` — it's
  the one color that identifies the ticket motif specifically, not a mode-dependent UI color.
- **Type**: Fraunces (display/headings, soft optical sizing) + Instrument Sans (UI/body, same type
  foundry as Fraunces, a real pairing) + IBM Plex Mono (times, prices, dates — anywhere precision
  matters). Loaded via Google Fonts `<link>` in `index.html`, not self-hosted.
- **Signature element**: `src/components/ui/Ticket.tsx` — a punch-ticket card with a solid swatch tab
  (`.ticket-tab`, colored `--signature`) clipped to the top-left corner at a slight angle, and a
  perforated tear-line (`.ticket-tear`, `TicketDivider`) separating date/service from price/status. Used
  for the booking confirmation, the post-booking success screen, and every row in "My Appointments" — it
  is the one place this app spends visual boldness; everything else (buttons, service/staff cards, form
  inputs) stays quiet and disciplined around it. A cancelled appointment renders the same ticket with
  `muted` set, fading the tab to grey rather than using a different component.
- **Numbered step breadcrumb** in `BookingPage.tsx` (`01 Služba / 02 Kaderník/čka / ...`) uses numbers
  because the booking flow genuinely is a fixed 4-step sequence — not a decorative default applied
  without reason.
- Motion is a single restrained moment: the hero's illustrative ticket has a slow idle sway
  (`.ticket-idle`, `@keyframes ticket-sway`), disabled entirely under `prefers-reduced-motion: reduce`.
  Nothing else in the app animates.
- No manual light/dark toggle exists (`prefers-color-scheme` only) — this was an intentional v1 scope
  cut made earlier in the project, not an oversight; see the Phase 0 plan.

## Architecture

- `src/lib/supabase.ts` — lazily loaded Supabase client (dynamic `import('@supabase/supabase-js')`,
  memoized), so the ~200KB dependency isn't in the main bundle. Pattern copied from
  `../LVG-engineering/src/lib/supabase.js`, adapted so `AuthContext` can `await` it at boot (LVG never
  needed that since it has no user auth).
- `src/context/AuthContext.tsx` — restores the session on mount, subscribes to
  `onAuthStateChange`, exposes `{ user, session, loading, signOut }`.
- `src/routes.tsx` — React Router v7 **library mode** (`createBrowserRouter`/`RouterProvider`), not
  framework mode. `/book` is intentionally public (browsing availability shouldn't require login);
  `/my-appointments` is wrapped in `ProtectedRoute`, which waits for `loading` to resolve before
  redirecting — redirecting while still loading would bounce an already-logged-in visitor to `/login`.
- `src/i18n/` — hand-rolled context (no library), typed via `Translations` interface in `types.ts`
  (pattern copied from `../CarscopeAI/src/i18n/`). `en.ts`/`sk.ts` implement it. Locale persisted to
  `localStorage`. Add new UI copy to **both** files or TypeScript will complain about the missing key.
- `src/lib/time.ts` — every date/time function here exists because `get_available_slots(p_date date)`
  needs the shop's own calendar date, not the browser's. Always derive `p_date` via
  `shopLocalDateKey()`/`nextShopLocalDates()` (which use `Intl.DateTimeFormat('en-CA', { timeZone })`),
  never `new Date().toISOString().slice(0, 10)` — that gives the UTC date and is wrong near midnight in
  any other timezone.
- `src/hooks/useAvailableSlots.ts` — thin wrapper around the `get_available_slots` RPC.
- `src/components/booking/` + `src/pages/BookingPage.tsx` — the booking wizard
  (service → staff → date/time → confirm), all client-side step state, one route. Not one route per
  step, so the shared selection state doesn't have to round-trip through the URL.
- `src/types/booking.ts` — `PendingBooking` + `sessionStorage` key used to carry a visitor's in-progress
  selection through a login/signup redirect. `BookingSummary.tsx` stashes it and redirects to
  `/login?redirect=/book`; `BookingPage.tsx` restores it once `user` becomes truthy and jumps straight
  back to the confirm step — it never auto-books, the visitor still has to hit Confirm again.

## Database (all in `supabase/migrations/`)

- **All writes go through `SECURITY DEFINER` RPCs** (`get_available_slots`, `create_appointment`,
  `cancel_appointment`) — there is no client-side `insert`/`update` on `appointments` anywhere, and RLS
  has no insert/update policy for it either. The server computes `end_time`/`blocked_range`/price;
  never trust a client-supplied value for any of those.
- **Double-booking is prevented at the database level**: `appointments_no_overlap` is a
  `EXCLUDE USING gist (staff_id extensions.gist_uuid_ops WITH =, blocked_range WITH &&) WHERE (status <>
  'cancelled')` constraint. The `WHERE` clause matters — without it, a cancelled appointment would keep
  blocking its old slot forever. The opclass is explicitly schema-qualified
  (`extensions.gist_uuid_ops`) rather than relying on `search_path` containing `extensions` at
  migration-run time — if `db push` ever fails with `data type uuid has no default operator class for
  access method "gist"`, that's the thing to check first.
- `create_appointment` catches the constraint's `exclusion_violation` and re-raises it as a plain
  `raise exception 'SLOT_TAKEN'`. supabase-js surfaces this as a Postgres `P0001` error whose
  **message text** is exactly `SLOT_TAKEN` — match on `error.message.includes('SLOT_TAKEN')`
  (see `BookingSummary.tsx`), there's no structured error code to check instead.
- **Lunch-gap handling is "hard block," not "span through it."** `staff_working_hours` allows multiple
  rows per weekday (seeded as `09:00-12:00` + `12:30-17:00`, Mon-Fri), and `get_available_slots` only
  offers a start time if the *entire* service duration fits within one row. A 120-minute coloring on a
  9-12/12:30-17 day can only start at 9:00 or later-in-the-afternoon slots — never at 11:00, because that
  would run into the 12:00-12:30 gap. This was a deliberate choice, confirmed with the project owner,
  not a bug — if it ever needs to change to "services may span a break," that's a change to the
  `while` loop in `get_available_slots`, not a quick tweak.
- `staff.user_id` is **nullable and unseeded** — the seeded owner's `auth.users` row doesn't exist until
  they actually sign up. After first signup, run in the SQL editor:
  ```sql
  update public.staff set user_id = '<the auth.users id>'
  where id = '00000000-0000-0000-0000-000000000001';
  ```
- `staff_time_off` has no `select` RLS policy on purpose — it would reveal *why* a staff member is away
  to anyone browsing. `get_available_slots` is `SECURITY DEFINER` and reads it directly, which is the
  only place it needs to be readable.
- Account linking: Supabase's actual behavior when the same email signs up via password and later logs
  in via Google (or vice versa) has **not been verified for this project**. Don't assume it silently
  merges — check the dashboard/docs for the current behavior before relying on it, and use
  `supabase.auth.linkIdentity()` from an authenticated session as the explicit path if it turns out
  manual linking is needed.

## Env vars

Client-safe only, so far — no server-side code exists yet (no admin dashboard, no Vercel Functions):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Safe to expose the anon key: everything it can do is constrained by RLS policies and the
`SECURITY DEFINER` RPC grants above, not by keeping the key secret.

## Deployment

`vercel.json` has a SPA catch-all rewrite (`/((?!api/).*)` → `/index.html`) since this app has real
routes, unlike the one-page sibling sites. Its CSP's `connect-src` already points at the real project
(`https://qowqhxuqclvfphysjiub.supabase.co`) — the old `<SUPABASE_PROJECT_REF>` placeholder was
replaced when the project was wired up. `img-src` allowlists the OAuth avatar CDN
(`lh3.googleusercontent.com`) in case profile pictures get rendered later.

**Deployed 2026-09-09.** Vercel project `beauty-salon-booking` (team `tatul1`, id
`prj_LypOOkNlLe0AOQ0YhrEsAvxOTVdY`), git-linked to `TatulAi/beauty-salon-booking`, production branch
`master`. Live URLs (both 200): `https://beauty-salon-booking-tatul1.vercel.app` (canonical) and
`https://beauty-salon-booking-liart.vercel.app`. `beauty-salon-booking.vercel.app` (no suffix) is
**not** assigned — 404s. `.vercel/project.json` is written locally (gitignored).

- **Env vars** `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set in Vercel for **both** Preview
  and Production (via `vercel env add`). Vite inlines `VITE_*` at build time, so they must exist
  before the build — a build without them ships `undefined` and every Supabase call fails silently.
  Values live in `.env.local`.
- **Vercel Authentication (SSO deployment protection)** was ON by team default at project creation;
  turned **off** (all `*.vercel.app` URLs were behind a login wall). Re-enable via Project Settings →
  Deployment Protection or `update_project_deployment_protection` if ever wanted.
- The **first `vercel deploy` auto-promoted to Production** — Vercel forces a project's first
  deployment to production regardless of `--prod`. Subsequent `vercel deploy` (no flag) are previews;
  a push to `master` is a production deploy.
- **Verified on the live URL:** landing page + design system render, `/book` loads all four services
  from Supabase (so CSP `connect-src`, the inlined env vars, and anon RLS read all work in prod).
- **Supabase Auth → URL Configuration** still needs the deployed origins (do this in the dashboard —
  `supabase config push` risks clobbering unrelated remote auth settings). As of deploy the remote
  had `site_url = http://localhost:5183` and `additional_redirect_urls = [http://localhost:5183/**]`.
  Add: Site URL → `https://beauty-salon-booking-tatul1.vercel.app`; Redirect URLs →
  `https://beauty-salon-booking-tatul1.vercel.app/**`, `https://beauty-salon-booking-liart.vercel.app/**`,
  `https://beauty-salon-booking-*-tatul1.vercel.app/**` (future previews), keep `http://localhost:5183/**`.
  Until then, Google OAuth on the deployed site bounces back to localhost. The **Google Cloud console**
  redirect URI does *not* need touching — it points at Supabase's own callback
  (`https://qowqhxuqclvfphysjiub.supabase.co/auth/v1/callback`), which is deployment-agnostic.

## Roadmap (not built)

Admin dashboard (manage working hours/time-off, view all appointments, mark completed/no-show), a real
cancellation policy (deadline/fee — right now `cancel_appointment` has no restriction beyond "must be
your own, still confirmed, in the future"), n8n-driven reminder emails/SMS, Google Calendar sync
(explicitly deferred — bookings live only in this app's own database for v1), and an AI assistant/RAG/
voice booking agent. That last one is why `get_available_slots`/`create_appointment` are RPCs rather
than raw table access in the first place — they're already the exact interface an AI tool-call would
invoke.
