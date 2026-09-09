-- Seed data for local dev / initial project setup.
--
-- staff.user_id is intentionally left unset here — the auth user for the
-- owner doesn't exist yet at seed time. After the owner signs up in the
-- running app, backfill it manually:
--   update public.staff set user_id = '<auth.users id>'
--   where id = '00000000-0000-0000-0000-000000000001';

insert into public.shop_settings (id, shop_name, timezone)
values (true, 'My Salon', 'Europe/Bratislava');

insert into public.staff (id, display_name, is_owner) values
  ('00000000-0000-0000-0000-000000000001', 'Owner Name', true);

insert into public.services (id, name, category, duration_minutes, buffer_minutes, price_cents) values
  ('00000000-0000-0000-0000-000000000101', 'Men''s Haircut', 'men', 30, 5, 1800),
  ('00000000-0000-0000-0000-000000000102', 'Women''s Haircut', 'women', 60, 10, 3500),
  ('00000000-0000-0000-0000-000000000103', 'Women''s Coloring', 'women', 120, 15, 7000),
  ('00000000-0000-0000-0000-000000000104', 'Beard Trim', 'unisex', 15, 5, 1000);

insert into public.staff_services (staff_id, service_id)
  select '00000000-0000-0000-0000-000000000001', id from public.services;

-- Mon-Fri 09:00-12:00 / 12:30-17:00 (30-minute lunch), Sat 09:00-14:00
-- (no lunch gap), closed Sunday (no row = closed, per get_available_slots).
insert into public.staff_working_hours (staff_id, weekday, start_time, end_time) values
  ('00000000-0000-0000-0000-000000000001', 1, '09:00', '12:00'),
  ('00000000-0000-0000-0000-000000000001', 1, '12:30', '17:00'),
  ('00000000-0000-0000-0000-000000000001', 2, '09:00', '12:00'),
  ('00000000-0000-0000-0000-000000000001', 2, '12:30', '17:00'),
  ('00000000-0000-0000-0000-000000000001', 3, '09:00', '12:00'),
  ('00000000-0000-0000-0000-000000000001', 3, '12:30', '17:00'),
  ('00000000-0000-0000-0000-000000000001', 4, '09:00', '12:00'),
  ('00000000-0000-0000-0000-000000000001', 4, '12:30', '17:00'),
  ('00000000-0000-0000-0000-000000000001', 5, '09:00', '12:00'),
  ('00000000-0000-0000-0000-000000000001', 5, '12:30', '17:00'),
  ('00000000-0000-0000-0000-000000000001', 6, '09:00', '14:00');
