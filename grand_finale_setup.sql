-- ============================================================
-- 🏆 GB MARKETPLACE - GRAND FINALE DB SETUP
-- ============================================================

-- 1. ADD BANNED COLUMN
alter table public.profiles add column if not exists is_banned boolean default false;
comment on column public.profiles.is_banned is 'Whether the user is banned from using the marketplace.';

-- 2. HARDEN RLS FOR BANNED USERS
-- ป้องกัน user ที่โดนแบนไม่ให้สั่งซื้อหรือเติมเงิน
drop policy if exists "Banned users cannot purchase" on public.invoices;
create policy "Banned users cannot purchase" on public.invoices 
  for insert with check (
    not exists (select 1 from public.profiles where id = auth.uid() and is_banned = true)
  );

drop policy if exists "Banned users cannot topup" on public.topups;
create policy "Banned users cannot topup" on public.topups 
  for insert with check (
    not exists (select 1 from public.profiles where id = auth.uid() and is_banned = true)
  );

-- 3. ADMIN RPC FOR BAN/UNBAN
create or replace function public.process_user_ban(p_user_id uuid, p_banned boolean)
returns json as $$
begin
  if not (select public.is_admin()) then raise exception 'Unauthorized'; end if;
  update public.profiles set is_banned = p_banned where id = p_user_id;
  return json_build_object('success', true, 'is_banned', p_banned);
end;
$$ language plpgsql security definer;

-- 4. ADMIN RPC FOR ROLE CHANGE
create or replace function public.update_user_role(p_user_id uuid, p_role text)
returns json as $$
begin
  if not (select public.is_admin()) then raise exception 'Unauthorized'; end if;
  if p_role not in ('user', 'admin') then raise exception 'Invalid role'; end if;
  update public.profiles set role = p_role where id = p_user_id;
  return json_build_object('success', true, 'role', p_role);
end;
$$ language plpgsql security definer;

-- 5. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
