-- =====================================================================
-- Phân quyền: ai cũng ĐỌC được, chỉ trưởng nhóm (email trong bảng admins) mới GHI.
-- Chạy 1 lần trong Supabase Dashboard → SQL Editor của project zfryjssoaztuihsntdso.
-- Chạy lại nhiều lần cũng an toàn (idempotent).
-- =====================================================================

-- 1. Danh sách email trưởng nhóm
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- Không tạo policy nào cho admins → client (anon/authenticated) không đọc/sửa được bảng này.

-- 2. Hàm kiểm tra người đang đăng nhập có phải trưởng nhóm không
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- 3. Bật RLS + policy cho 4 bảng dữ liệu
do $$
declare
  t text;
begin
  foreach t in array array['members', 'sessions', 'attendees', 'settings'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Xóa mọi policy cũ trên 4 bảng (kể cả policy "cho phép tất cả" nếu có)
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('members', 'sessions', 'attendees', 'settings')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['members', 'sessions', 'attendees', 'settings'] loop
    execute format(
      'create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format(
      'create policy "admin insert" on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format(
      'create policy "admin update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format(
      'create policy "admin delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- 4. Tài khoản trưởng nhóm cố định mà app dùng cho "mã admin" (xem ADMIN_EMAIL trong src/utils/supabase.ts)
insert into public.admins (email) values ('admin@caulongpay.app') on conflict do nothing;

-- Kiểm tra lại:
-- select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' order by 1, 2;
