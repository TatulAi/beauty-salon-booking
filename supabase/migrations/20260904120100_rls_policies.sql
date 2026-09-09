alter table public.shop_settings enable row level security;
alter table public.shop_closures enable row level security;
alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.staff_services enable row level security;
alter table public.staff_working_hours enable row level security;
alter table public.staff_time_off enable row level security;
alter table public.appointments enable row level security;

-- Public read access: anyone (including anon/unauthenticated visitors) can
-- browse shop info, staff, services, and working hours before signing up.
create policy "shop_settings readable by everyone"
  on public.shop_settings for select using (true);

create policy "shop_closures readable by everyone"
  on public.shop_closures for select using (true);

create policy "active staff readable by everyone"
  on public.staff for select using (is_active = true);

create policy "active services readable by everyone"
  on public.services for select using (is_active = true);

create policy "staff_services readable by everyone"
  on public.staff_services for select using (true);

create policy "working hours readable by everyone"
  on public.staff_working_hours for select using (true);

-- staff_time_off deliberately has NO select policy — it would reveal why a
-- staff member is away. get_available_slots() is SECURITY DEFINER and reads
-- it directly, bypassing RLS, which is the only way it needs to be read.

-- profiles: users can only see/edit their own row. Insert happens via the
-- handle_new_user trigger (SECURITY DEFINER), never a client insert.
create policy "users read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- appointments: clients can only see their own bookings. No insert/update/
-- delete policy exists for clients at all — every write goes through the
-- create_appointment/cancel_appointment SECURITY DEFINER functions, which
-- run their own validation and bypass RLS via their elevated privileges.
create policy "clients read own appointments"
  on public.appointments for select using (auth.uid() = client_id);
