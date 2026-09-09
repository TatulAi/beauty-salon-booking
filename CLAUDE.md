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

**Still not verified**: Google/GitHub OAuth (providers not yet enabled in the dashboard), the full
frontend booking flow against real data (only raw REST/RPC calls have been exercised, not the React app
itself), and the exclusion constraint's actual concurrency behavior (two simultaneous bookings racing
for the same slot — the single calls made so far were sequential, not concurrent). Run the rest of the
Verification section in the plan (`~/.claude/plans/noble-dreaming-fog.md`) once OAuth is wired up.

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
routes, unlike the one-page sibling sites. Its CSP's `connect-src` has a `<SUPABASE_PROJECT_REF>`
placeholder — **replace it with the real project ref once the Supabase project exists**, or the browser
will silently block every Supabase API call in production. `img-src` already allowlists both OAuth
avatar CDNs (`lh3.googleusercontent.com` for Google, `avatars.githubusercontent.com` for GitHub) in case
profile pictures get rendered later.

## Roadmap (not built)

Admin dashboard (manage working hours/time-off, view all appointments, mark completed/no-show), a real
cancellation policy (deadline/fee — right now `cancel_appointment` has no restriction beyond "must be
your own, still confirmed, in the future"), n8n-driven reminder emails/SMS, Google Calendar sync
(explicitly deferred — bookings live only in this app's own database for v1), and an AI assistant/RAG/
voice booking agent. That last one is why `get_available_slots`/`create_appointment` are RPCs rather
than raw table access in the first place — they're already the exact interface an AI tool-call would
invoke.
