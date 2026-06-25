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

drop policy if exists "Expense creators, owners, and editors can update expenses"
  on public.expenses;

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

drop policy if exists "Trip members can update receipt objects" on storage.objects;
drop policy if exists "Receipt object owners and editors can update receipt objects"
  on storage.objects;

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
