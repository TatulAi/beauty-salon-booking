-- Extension needed for the appointments exclusion constraint (GiST index on a
-- uuid equality + tstzrange overlap). Installed into its own schema per
-- Supabase convention; the exclusion constraint below schema-qualifies the
-- opclass explicitly (extensions.gist_uuid_ops) so it does not depend on
-- search_path containing "extensions" at migration-run time.
create extension if not exists "btree_gist" with schema extensions;

-- Singleton settings row (id is always `true`) so the app never has to guess
-- which row holds shop-wide config.
create table public.shop_settings (
  id boolean primary key default true check (id),
  shop_name text not null default 'My Salon',
  timezone text not null default 'Europe/Bratislava',
  slot_granularity_minutes int not null default 15,
  lead_time_minutes int not null default 60
);

-- Shop-wide closures (public holidays, the whole shop closed for a day).
-- Per-staff absences (sick day, vacation) use staff_time_off instead.
create table public.shop_closures (
  id uuid primary key default gen_random_uuid(),
  closure_date date not null unique,
  reason text
);

-- Extends auth.users with app-facing profile fields. Populated by the
-- handle_new_user trigger (see the functions migration) on signup.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- user_id is nullable and unset at seed time (the auth user doesn't exist
-- yet) — backfilled manually after the owner's first signup. See CLAUDE.md.
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id),
  display_name text not null,
  bio text,
  photo_url text,
  is_owner boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('men', 'women', 'unisex')),
  duration_minutes int not null check (duration_minutes > 0),
  buffer_minutes int not null default 0 check (buffer_minutes >= 0),
  price_cents int not null check (price_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.staff_services (
  staff_id uuid not null references public.staff(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- Weekday matches extract(dow from date): 0 = Sunday .. 6 = Saturday.
-- Multiple rows per weekday are allowed on purpose, so a lunch break is just
-- two rows (e.g. 09:00-12:00 and 12:30-17:00) rather than a special case.
create table public.staff_working_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (start_time < end_time)
);

-- One-off absences (vacation, sick day) layered on top of the recurring
-- weekly hours above.
create table public.staff_time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (starts_at < ends_at)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id),
  service_id uuid not null references public.services(id),
  client_id uuid not null references auth.users(id),
  start_time timestamptz not null,
  end_time timestamptz not null,           -- client-facing end time, NO buffer
  duration_minutes int not null,           -- denormalized from services at booking time
  buffer_minutes int not null,             -- denormalized from services at booking time
  price_cents int not null,                -- denormalized from services at booking time
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  blocked_range tstzrange not null,        -- [start_time, end_time + buffer) — set explicitly by create_appointment()
  notes text,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  check (end_time > start_time)
);

create index appointments_staff_start_idx on public.appointments (staff_id, start_time);
create index appointments_client_idx on public.appointments (client_id);

-- The correctness guarantee: two non-cancelled appointments for the same
-- staff member can never have overlapping blocked_range values. The partial
-- WHERE clause matters — without it, a cancelled appointment would keep
-- blocking its old slot forever.
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    staff_id extensions.gist_uuid_ops with =,
    blocked_range with &&
  )
  where (status <> 'cancelled');
