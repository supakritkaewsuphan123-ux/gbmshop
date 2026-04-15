-- ============================================================
-- ⚡ GB MARKETPLACE - TURBO OPTIMIZATION INDEXES
-- ============================================================

-- 1. INDEXES FOR SPEED (ลดการ Scan ทั้งตาราง)
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_banned on public.profiles(is_banned);
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_user_id on public.products(user_id);

create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_user_id on public.invoices(user_id);

create index if not exists idx_topups_status on public.topups(status);
create index if not exists idx_topups_user_id on public.topups(user_id);

-- 2. OPTIMIZE IS_ADMIN()
-- ใช้การเช็คบทบาทแบบไม่ต้อง Join ตารางอื่น (เร็วที่สุด)
create or replace function public.is_admin()
returns boolean as $$
begin
  return (select role from public.profiles where id = auth.uid()) = 'admin';
end;
$$ language plpgsql security definer;

-- 3. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
