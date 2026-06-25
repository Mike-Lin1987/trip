alter table public.trips
  alter column owner_id drop not null;

alter table public.trips
  drop constraint if exists trips_owner_id_fkey;

alter table public.trips
  add constraint trips_owner_id_fkey
  foreign key (owner_id) references auth.users(id) on delete set null;

insert into public.trips (
  id,
  name,
  start_date,
  end_date,
  base_currency,
  expense_currency
)
values (
  '7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311',
  '北陸孝親賞楓慢旅 2026',
  '2026-11-14',
  '2026-11-21',
  'TWD',
  'JPY'
)
on conflict (id) do update
set
  name = excluded.name,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  base_currency = excluded.base_currency,
  expense_currency = excluded.expense_currency;

insert into public.trip_members (
  id,
  trip_id,
  display_name,
  role,
  sort_order,
  is_active
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311',
    '林彥旭',
    'owner',
    1,
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311',
    '林俊榕',
    'editor',
    2,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311',
    '林俊成',
    'editor',
    3,
    true
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311',
    '林仙化',
    'member',
    4,
    true
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311',
    '方錦屏',
    'member',
    5,
    true
  )
on conflict (id) do update
set
  trip_id = excluded.trip_id,
  display_name = excluded.display_name,
  role = excluded.role,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.daily_exchange_rates (
  trip_id,
  rate_date,
  source_currency,
  target_currency,
  reference_rate,
  source_name
)
values
  ('7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311', '2026-11-14', 'JPY', 'TWD', 0.215, 'manual'),
  ('7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311', '2026-11-15', 'JPY', 'TWD', 0.215, 'manual'),
  ('7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311', '2026-11-16', 'JPY', 'TWD', 0.215, 'manual'),
  ('7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311', '2026-11-17', 'JPY', 'TWD', 0.215, 'manual'),
  ('7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311', '2026-11-18', 'JPY', 'TWD', 0.215, 'manual'),
  ('7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311', '2026-11-19', 'JPY', 'TWD', 0.215, 'manual'),
  ('7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311', '2026-11-20', 'JPY', 'TWD', 0.215, 'manual'),
  ('7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311', '2026-11-21', 'JPY', 'TWD', 0.215, 'manual')
on conflict (
  trip_id,
  rate_date,
  source_currency,
  target_currency
) do update
set
  reference_rate = excluded.reference_rate,
  source_name = excluded.source_name;
