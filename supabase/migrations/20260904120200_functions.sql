-- Populates profiles from signup metadata. Google and GitHub put the display
-- name under different keys ('name' vs 'full_name'), so check both.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Returns free start times for a given staff+service+shop-local calendar
-- date. p_date MUST be the shop-local date (see useAvailableSlots.ts) — this
-- function has no way to know the caller's timezone otherwise.
--
-- A service can only start if it fits entirely within one working-hours
-- window (see staff_working_hours) — it will never be offered a start time
-- that would run through a gap like a lunch break. That's a deliberate
-- choice, not a bug: see CLAUDE.md's "lunch-gap handling" note.
--
-- Granted to anon + authenticated: browsing availability never requires
-- login, only booking does.
create or replace function public.get_available_slots(
  p_staff_id uuid,
  p_service_id uuid,
  p_date date
)
returns table (slot_start timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_slot_minutes int;
  v_lead_minutes int;
  v_duration int;
  v_buffer int;
  v_weekday int;
  v_window record;
  v_candidate timestamptz;
  v_window_end timestamptz;
begin
  select timezone, slot_granularity_minutes, lead_time_minutes
    into v_tz, v_slot_minutes, v_lead_minutes
  from public.shop_settings
  limit 1;

  select duration_minutes, buffer_minutes into v_duration, v_buffer
  from public.services
  where id = p_service_id and is_active = true;

  if v_duration is null then
    return; -- unknown or inactive service
  end if;

  if exists (select 1 from public.shop_closures where closure_date = p_date) then
    return; -- shop-wide holiday
  end if;

  v_weekday := extract(dow from p_date);

  for v_window in
    select start_time, end_time
    from public.staff_working_hours
    where staff_id = p_staff_id and weekday = v_weekday
    order by start_time
  loop
    v_candidate := (p_date::text || ' ' || v_window.start_time::text)::timestamp at time zone v_tz;
    v_window_end := (p_date::text || ' ' || v_window.end_time::text)::timestamp at time zone v_tz;

    while v_candidate + make_interval(mins => v_duration) <= v_window_end loop
      if v_candidate >= now() + make_interval(mins => v_lead_minutes)
        and not exists (
          select 1 from public.appointments a
          where a.staff_id = p_staff_id
            and a.status <> 'cancelled'
            and a.blocked_range && tstzrange(
                  v_candidate, v_candidate + make_interval(mins => v_duration + v_buffer), '[)')
        )
        and not exists (
          select 1 from public.staff_time_off t
          where t.staff_id = p_staff_id
            and tstzrange(t.starts_at, t.ends_at, '[)') && tstzrange(
                  v_candidate, v_candidate + make_interval(mins => v_duration + v_buffer), '[)')
        )
      then
        slot_start := v_candidate;
        return next;
      end if;

      v_candidate := v_candidate + make_interval(mins => v_slot_minutes);
    end loop;
  end loop;
end;
$$;

grant execute on function public.get_available_slots(uuid, uuid, date) to anon, authenticated;

-- Creates a booking. The server computes end_time/blocked_range/price —
-- never trust the client for these. The exclusion constraint on appointments
-- is the actual race-condition backstop; the checks here are the
-- friendly-error layer for the common (non-racing) case.
create or replace function public.create_appointment(
  p_staff_id uuid,
  p_service_id uuid,
  p_start_time timestamptz
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duration int;
  v_buffer int;
  v_price int;
  v_lead_minutes int;
  v_end timestamptz;
  v_blocked tstzrange;
  v_row public.appointments;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select duration_minutes, buffer_minutes, price_cents
    into v_duration, v_buffer, v_price
  from public.services
  where id = p_service_id and is_active = true;

  if v_duration is null then
    raise exception 'INVALID_SERVICE';
  end if;

  if not exists (
    select 1 from public.staff_services
    where staff_id = p_staff_id and service_id = p_service_id
  ) then
    raise exception 'STAFF_DOES_NOT_OFFER_SERVICE';
  end if;

  select lead_time_minutes into v_lead_minutes from public.shop_settings limit 1;
  if p_start_time < now() + make_interval(mins => v_lead_minutes) then
    raise exception 'TOO_SOON';
  end if;

  v_end := p_start_time + make_interval(mins => v_duration);
  v_blocked := tstzrange(p_start_time, v_end + make_interval(mins => v_buffer), '[)');

  begin
    insert into public.appointments (
      staff_id, service_id, client_id, start_time, end_time,
      duration_minutes, buffer_minutes, price_cents, blocked_range, status
    ) values (
      p_staff_id, p_service_id, auth.uid(), p_start_time, v_end,
      v_duration, v_buffer, v_price, v_blocked, 'confirmed'
    )
    returning * into v_row;
  exception
    when exclusion_violation then
      raise exception 'SLOT_TAKEN';
  end;

  return v_row;
end;
$$;

-- Postgres grants EXECUTE to PUBLIC by default, which would silently let
-- anon call this too (it would just bounce off the auth.uid() check below,
-- but the grant itself should say what it means).
revoke execute on function public.create_appointment(uuid, uuid, timestamptz) from public;
grant execute on function public.create_appointment(uuid, uuid, timestamptz) to authenticated;

-- Minimal cancel — no cancellation-deadline/fee policy yet (Phase 2).
create or replace function public.cancel_appointment(p_appointment_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.appointments;
begin
  update public.appointments
  set status = 'cancelled', cancelled_at = now()
  where id = p_appointment_id and client_id = auth.uid() and status = 'confirmed'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'NOT_FOUND_OR_NOT_CANCELLABLE';
  end if;

  return v_row;
end;
$$;

revoke execute on function public.cancel_appointment(uuid) from public;
grant execute on function public.cancel_appointment(uuid) to authenticated;
