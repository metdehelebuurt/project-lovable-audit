
create or replace function public.admin_lijst_sales_affiliates()
returns table (id uuid, voornaam text, achternaam text, email text, partner_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.voornaam, u.achternaam, u.email, u.partner_id
  from public.users u
  where u.rol = 'affiliate'
    and u.status = 'actief'
    and public.is_superadmin(auth.uid())
  order by u.voornaam nulls last, u.email
$$;

grant execute on function public.admin_lijst_sales_affiliates() to authenticated;

create or replace function public.admin_bulk_update_sales_fase(_lead_ids uuid[], _fase sales_fase)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  if not public.is_superadmin(auth.uid()) then
    raise exception 'Alleen superadmin';
  end if;
  update public.affiliate_leads
     set sales_fase = _fase, updated_at = now()
   where id = any(_lead_ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.admin_bulk_update_sales_fase(uuid[], sales_fase) to authenticated;

create or replace function public.admin_bulk_delete_sales_leads(_lead_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  if not public.is_superadmin(auth.uid()) then
    raise exception 'Alleen superadmin';
  end if;
  delete from public.affiliate_leads where id = any(_lead_ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.admin_bulk_delete_sales_leads(uuid[]) to authenticated;
