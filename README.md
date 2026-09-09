# Beauty Salon Booking

A booking web app for a unisex beauty/barber salon — pick a service, pick a stylist, pick a real
available time slot (durations vary per service, so the calendar blocks the actual time, not a fixed
slot), and confirm. Portfolio + learning project.

## Setup checklist

Everything in the repo (schema, frontend code) is already written, and a live Supabase project already
exists (`eu-central-1`, ref `qowqhxuqclvfphysjiub`) with the schema and seed data pushed — `.env.local`
is set up locally with its URL/anon key. The remaining steps need a browser and your own accounts —
nobody else can do them for you.

### 1. Install dependencies

```bash
npm install
```

### 2. ~~Create the Supabase project~~ — done

Project created, linked, migrations + seed pushed. If you ever need to redo this on another machine:

```bash
npx supabase login --token <personal access token from supabase.com/dashboard/account/tokens>
npx supabase link --project-ref qowqhxuqclvfphysjiub
npx supabase db push --include-seed
```

### 3. Enable auth providers

In the Supabase dashboard → **Authentication → Providers**:

- **Email**: enable it (confirmation email on is recommended).
- **Google**: create an OAuth Client (Web application) in
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Authorized redirect URI:
  `https://qowqhxuqclvfphysjiub.supabase.co/auth/v1/callback`. Paste the Client ID/Secret into
  Supabase's Google provider settings and enable it.
- **Authentication → URL Configuration**: set Site URL and add to the Redirect URLs allow-list:
  `http://localhost:5173/**`, your Vercel preview pattern (`https://beauty-salon-booking-*.vercel.app/**`),
  and your production domain once you have one.

### 4. Run it

```bash
npm run dev
```

Sign up as yourself (this becomes the shop owner), then in the Supabase SQL editor:

```sql
update public.staff set user_id = '<your auth.users id — Authentication → Users in the dashboard>'
where id = '00000000-0000-0000-0000-000000000001';
```

### 5. Deploying

Deploy to Vercel as usual. `vercel.json`'s CSP already points at the real project ref. Set
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` as Vercel env vars too (same values as `.env.local`).

## Troubleshooting

- **Every page stuck on "Loading..." forever**: almost always `VITE_SUPABASE_URL`/
  `VITE_SUPABASE_ANON_KEY` missing or wrong in `.env.local`. Check the browser console — a red banner
  should also appear at the top of the page saying the backend connection failed.

## Commands

```bash
npm run dev      # local dev server
npm run build    # tsc -b && vite build
npm run lint      # oxlint
npm run preview  # preview the production build
```

See `CLAUDE.md` for architecture notes, the scheduling design, and known gaps.
