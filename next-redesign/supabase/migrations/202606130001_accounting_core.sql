create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  base_currency text not null default 'TWD',
  expense_currency text not null default 'JPY',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_date_range_check check (end_date >= start_date),
  constraint trips_base_currency_check check (base_currency in ('TWD')),
  constraint trips_expense_currency_check check (expense_currency in ('JPY'))
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  avatar_url text,
  role text not null default 'member',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint trip_members_role_check check (role in ('owner', 'editor', 'member', 'viewer')),
  constraint trip_members_display_name_check check (length(trim(display_name)) > 0)
);

create table if not exists public.daily_exchange_rates (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  rate_date date not null,
  source_currency text not null default 'JPY',
  target_currency text not null default 'TWD',
  reference_rate numeric(18,8),
  cash_rate numeric(18,8),
  card_rate numeric(18,8),
  custom_rate numeric(18,8),
  source_name text,
  fetched_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_exchange_rates_currency_check check (
    source_currency = 'JPY' and target_currency = 'TWD'
  ),
  constraint daily_exchange_rates_positive_check check (
    coalesce(reference_rate, 0) >= 0 and
    coalesce(cash_rate, 0) >= 0 and
    coalesce(card_rate, 0) >= 0 and
    coalesce(custom_rate, 0) >= 0
  ),
  constraint daily_exchange_rates_unique unique (
    trip_id,
    rate_date,
    source_currency,
    target_currency
  )
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  expense_date date not null,
  expense_time time,
  category text not null,
  item_name text not null,
  merchant_name text,
  description text,
  original_currency text not null default 'JPY',
  original_amount numeric(18,2) not null,
  selected_rate_type text not null,
  applied_exchange_rate numeric(18,8) not null,
  converted_currency text not null default 'TWD',
  converted_amount numeric(18,2) not null,
  payer_member_id uuid references public.trip_members(id) on delete set null,
  split_method text not null default 'equal',
  location_name text,
  latitude numeric,
  longitude numeric,
  ocr_status text not null default 'not_requested',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint expenses_category_check check (length(trim(category)) > 0),
  constraint expenses_item_name_check check (length(trim(item_name)) > 0),
  constraint expenses_currency_check check (
    original_currency = 'JPY' and converted_currency = 'TWD'
  ),
  constraint expenses_amounts_positive_check check (
    original_amount > 0 and applied_exchange_rate > 0 and converted_amount > 0
  ),
  constraint expenses_rate_type_check check (
    selected_rate_type in ('reference', 'cash', 'card', 'custom', 'expense_custom')
  ),
  constraint expenses_split_method_check check (
    split_method in ('equal', 'exact_amount', 'percentage', 'shares')
  ),
  constraint expenses_ocr_status_check check (
    ocr_status in ('not_requested', 'processing', 'completed', 'failed', 'needs_review')
  )
);

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  member_id uuid not null references public.trip_members(id) on delete cascade,
  included boolean not null default true,
  share_value numeric(18,6),
  original_share_amount numeric(18,2) not null,
  converted_share_amount numeric(18,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_splits_amounts_check check (
    original_share_amount >= 0 and converted_share_amount >= 0
  ),
  constraint expense_splits_unique unique (expense_id, member_id)
);

create table if not exists public.expense_receipts (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  original_filename text,
  mime_type text,
  file_size integer,
  width integer,
  height integer,
  is_primary boolean not null default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint expense_receipts_file_size_check check (file_size is null or file_size > 0),
  constraint expense_receipts_dimensions_check check (
    (width is null or width > 0) and (height is null or height > 0)
  ),
  constraint expense_receipts_bucket_check check (storage_bucket = 'trip-receipts')
);

create table if not exists public.receipt_ocr_results (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.expense_receipts(id) on delete cascade,
  provider text not null,
  detected_merchant text,
  detected_date date,
  detected_currency text,
  detected_subtotal numeric(18,2),
  detected_tax numeric(18,2),
  detected_total numeric(18,2),
  confidence numeric(5,4),
  raw_result jsonb,
  user_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint receipt_ocr_results_provider_check check (length(trim(provider)) > 0),
  constraint receipt_ocr_results_confidence_check check (
    confidence is null or (confidence >= 0 and confidence <= 1)
  )
);

create table if not exists public.expense_audit_logs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  expense_id uuid references public.expenses(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  constraint expense_audit_logs_action_check check (length(trim(action)) > 0)
);

create unique index if not exists trip_members_trip_user_unique
  on public.trip_members(trip_id, user_id)
  where user_id is not null;

create index if not exists trip_members_trip_id_idx
  on public.trip_members(trip_id);

create index if not exists daily_exchange_rates_trip_date_idx
  on public.daily_exchange_rates(trip_id, rate_date);

create index if not exists expenses_trip_date_idx
  on public.expenses(trip_id, expense_date desc)
  where deleted_at is null;

create index if not exists expenses_payer_member_id_idx
  on public.expenses(payer_member_id);

create index if not exists expense_splits_expense_member_idx
  on public.expense_splits(expense_id, member_id);

create index if not exists expense_receipts_expense_id_idx
  on public.expense_receipts(expense_id);

create index if not exists receipt_ocr_results_receipt_id_idx
  on public.receipt_ocr_results(receipt_id);

create index if not exists expense_audit_logs_trip_expense_idx
  on public.expense_audit_logs(trip_id, expense_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists daily_exchange_rates_set_updated_at on public.daily_exchange_rates;
create trigger daily_exchange_rates_set_updated_at
before update on public.daily_exchange_rates
for each row execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists expense_splits_set_updated_at on public.expense_splits;
create trigger expense_splits_set_updated_at
before update on public.expense_splits
for each row execute function public.set_updated_at();

create or replace function public.prevent_expense_trip_retarget()
returns trigger
language plpgsql
as $$
begin
  if new.trip_id <> old.trip_id then
    raise exception 'expenses.trip_id cannot be changed'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists expenses_prevent_trip_retarget on public.expenses;
create trigger expenses_prevent_trip_retarget
before update of trip_id on public.expenses
for each row execute function public.prevent_expense_trip_retarget();

create or replace function public.is_trip_member(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trips
    where trips.id = target_trip_id
      and trips.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.trip_members
    where trip_members.trip_id = target_trip_id
      and trip_members.user_id = auth.uid()
      and trip_members.is_active = true
  );
$$;

create or replace function public.has_trip_role(target_trip_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trips
    where trips.id = target_trip_id
      and trips.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.trip_members
    where trip_members.trip_id = target_trip_id
      and trip_members.user_id = auth.uid()
      and trip_members.is_active = true
      and trip_members.role = any(allowed_roles)
  );
$$;

create or replace function public.storage_trip_id(object_name text)
returns uuid
language plpgsql
stable
as $$
declare
  maybe_trip_id text;
begin
  maybe_trip_id := split_part(object_name, '/', 1);
  return maybe_trip_id::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.can_manage_receipt_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.expense_receipts
    join public.expenses on expenses.id = expense_receipts.expense_id
    where expense_receipts.storage_bucket = 'trip-receipts'
      and expense_receipts.storage_path = object_name
      and expenses.deleted_at is null
      and (
        public.has_trip_role(expenses.trip_id, array['owner', 'editor'])
        or expenses.created_by = auth.uid()
        or expense_receipts.uploaded_by = auth.uid()
      )
  );
$$;

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.daily_exchange_rates enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.expense_receipts enable row level security;
alter table public.receipt_ocr_results enable row level security;
alter table public.expense_audit_logs enable row level security;

create policy "Trips are visible to owners and members"
  on public.trips for select
  using (owner_id = auth.uid() or public.is_trip_member(id));

create policy "Users can create trips they own"
  on public.trips for insert
  with check (owner_id = auth.uid());

create policy "Trip owners can update trips"
  on public.trips for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Trip owners can delete trips"
  on public.trips for delete
  using (owner_id = auth.uid());

create policy "Trip members are visible within a trip"
  on public.trip_members for select
  using (public.is_trip_member(trip_id));

create policy "Owners and editors can add trip members"
  on public.trip_members for insert
  with check (public.has_trip_role(trip_id, array['owner', 'editor']));

create policy "Owners and editors can update trip members"
  on public.trip_members for update
  using (public.has_trip_role(trip_id, array['owner', 'editor']))
  with check (public.has_trip_role(trip_id, array['owner', 'editor']));

create policy "Owners and editors can delete trip members"
  on public.trip_members for delete
  using (public.has_trip_role(trip_id, array['owner', 'editor']));

create policy "Exchange rates are visible to trip members"
  on public.daily_exchange_rates for select
  using (public.is_trip_member(trip_id));

create policy "Owners and editors can manage exchange rates"
  on public.daily_exchange_rates for all
  using (public.has_trip_role(trip_id, array['owner', 'editor']))
  with check (public.has_trip_role(trip_id, array['owner', 'editor']));

create policy "Expenses are visible to trip members"
  on public.expenses for select
  using (public.is_trip_member(trip_id) and deleted_at is null);

create policy "Trip members can create expenses"
  on public.expenses for insert
  with check (
    public.is_trip_member(trip_id)
    and (created_by is null or created_by = auth.uid())
  );

create policy "Expense creators, owners, and editors can update expenses"
  on public.expenses for update
  using (
    public.is_trip_member(trip_id)
    and (
      public.has_trip_role(trip_id, array['owner', 'editor'])
      or created_by = auth.uid()
    )
  )
  with check (
    public.is_trip_member(trip_id)
    and (
      public.has_trip_role(trip_id, array['owner', 'editor'])
      or created_by = auth.uid()
    )
  );

create policy "Owners and editors can hard delete expenses"
  on public.expenses for delete
  using (public.has_trip_role(trip_id, array['owner', 'editor']));

create policy "Expense splits are visible to trip members"
  on public.expense_splits for select
  using (
    exists (
      select 1
      from public.expenses
      where expenses.id = expense_splits.expense_id
        and public.is_trip_member(expenses.trip_id)
        and expenses.deleted_at is null
    )
  );

create policy "Expense splits can be managed with their expense"
  on public.expense_splits for all
  using (
    exists (
      select 1
      from public.expenses
      where expenses.id = expense_splits.expense_id
        and (
          public.has_trip_role(expenses.trip_id, array['owner', 'editor'])
          or expenses.created_by = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.expenses
      where expenses.id = expense_splits.expense_id
        and (
          public.has_trip_role(expenses.trip_id, array['owner', 'editor'])
          or expenses.created_by = auth.uid()
        )
    )
  );

create policy "Expense receipts are visible to trip members"
  on public.expense_receipts for select
  using (
    exists (
      select 1
      from public.expenses
      where expenses.id = expense_receipts.expense_id
        and public.is_trip_member(expenses.trip_id)
        and expenses.deleted_at is null
    )
  );

create policy "Expense receipts can be managed with their expense"
  on public.expense_receipts for all
  using (
    exists (
      select 1
      from public.expenses
      where expenses.id = expense_receipts.expense_id
        and (
          public.has_trip_role(expenses.trip_id, array['owner', 'editor'])
          or expenses.created_by = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.expenses
      where expenses.id = expense_receipts.expense_id
        and (
          public.has_trip_role(expenses.trip_id, array['owner', 'editor'])
          or expenses.created_by = auth.uid()
        )
    )
  );

create policy "OCR results are visible to trip members"
  on public.receipt_ocr_results for select
  using (
    exists (
      select 1
      from public.expense_receipts
      join public.expenses on expenses.id = expense_receipts.expense_id
      where expense_receipts.id = receipt_ocr_results.receipt_id
        and public.is_trip_member(expenses.trip_id)
        and expenses.deleted_at is null
    )
  );

create policy "OCR results can be managed with their expense"
  on public.receipt_ocr_results for all
  using (
    exists (
      select 1
      from public.expense_receipts
      join public.expenses on expenses.id = expense_receipts.expense_id
      where expense_receipts.id = receipt_ocr_results.receipt_id
        and (
          public.has_trip_role(expenses.trip_id, array['owner', 'editor'])
          or expenses.created_by = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.expense_receipts
      join public.expenses on expenses.id = expense_receipts.expense_id
      where expense_receipts.id = receipt_ocr_results.receipt_id
        and (
          public.has_trip_role(expenses.trip_id, array['owner', 'editor'])
          or expenses.created_by = auth.uid()
        )
    )
  );

create policy "Audit logs are visible to trip members"
  on public.expense_audit_logs for select
  using (public.is_trip_member(trip_id));

create policy "Trip members can append audit logs"
  on public.expense_audit_logs for insert
  with check (
    public.is_trip_member(trip_id)
    and (actor_user_id is null or actor_user_id = auth.uid())
  );

insert into storage.buckets (id, name, public)
values ('trip-receipts', 'trip-receipts', false)
on conflict (id) do update set public = excluded.public;

create policy "Trip members can read receipt objects"
  on storage.objects for select
  using (
    bucket_id = 'trip-receipts'
    and public.is_trip_member(public.storage_trip_id(name))
  );

create policy "Trip members can upload receipt objects"
  on storage.objects for insert
  with check (
    bucket_id = 'trip-receipts'
    and public.is_trip_member(public.storage_trip_id(name))
  );

create policy "Receipt object owners and editors can update receipt objects"
  on storage.objects for update
  using (
    bucket_id = 'trip-receipts'
    and public.can_manage_receipt_object(name)
  )
  with check (
    bucket_id = 'trip-receipts'
    and public.can_manage_receipt_object(name)
  );

create policy "Owners and editors can delete receipt objects"
  on storage.objects for delete
  using (
    bucket_id = 'trip-receipts'
    and public.has_trip_role(public.storage_trip_id(name), array['owner', 'editor'])
  );
