# Beauty Salon Booking

A booking web app for a unisex beauty/barber salon — pick a service, pick a stylist, pick a real
available time slot (durations vary per service, so the calendar blocks the actual time, not a fixed
slot), and confirm. Portfolio + learning project.

## Setup checklist

Everything in the repo (schema, frontend code) is already written. These are the steps that need a
browser and your own accounts — nobody else can do them for you.

### 1. Install dependencies

```bash
npm install
```

### 2. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Once created, grab from **Project Settings → API**: the **Project URL** and the **anon public key**.
3. Copy `.env.example` to `.env.local` and fill both in:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

### 3. Push the database schema

```bash
npx supabase login          # opens a browser window
npx supabase link --project-ref <your-project-ref>   # ref is in the project's dashboard URL
npx supabase db push        # applies supabase/migrations/*.sql
```

Then run `supabase/seed.sql` once via the Supabase dashboard's SQL editor (the CLI's `db push` doesn't
apply `seed.sql` automatically for a remote-linked project — paste-and-run it directly).

### 4. Enable auth providers

In the Supabase dashboard → **Authentication → Providers**:

- **Email**: enable it (confirmation email on is recommended).
- **Google**: create an OAuth Client (Web application) in
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Authorized redirect URI:
  `https://<your-project-ref>.supabase.co/auth/v1/callback`. Paste the Client ID/Secret into Supabase's
  Google provider settings and enable it.
- **GitHub**: create an OAuth App in
  [GitHub Developer Settings](https://github.com/settings/developers). Authorization callback URL: the
  same `https://<your-project-ref>.supabase.co/auth/v1/callback`. Paste Client ID/Secret into Supabase's
  GitHub provider settings and enable it.
- **Authentication → URL Configuration**: set Site URL and add to the Redirect URLs allow-list:
  `http://localhost:5173/**`, your Vercel preview pattern (`https://beauty-salon-booking-*.vercel.app/**`),
  and your production domain once you have one.

### 5. Run it

```bash
npm run dev
```

Sign up as yourself (this becomes the shop owner), then in the Supabase SQL editor:

```sql
update public.staff set user_id = '<your auth.users id — Authentication → Users in the dashboard>'
where id = '00000000-0000-0000-0000-000000000001';
```

### 6. Deploying

Deploy to Vercel as usual. Before going live, edit `vercel.json` and replace `<SUPABASE_PROJECT_REF>` in
the CSP's `connect-src` with your real project ref — otherwise the browser blocks all API calls in
production. Set `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` as Vercel env vars too.

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
