-- ============================================================
--  Chia tiền cầu lông — Supabase schema
--  Dán toàn bộ file này vào: Supabase Dashboard > SQL Editor > Run
-- ============================================================

create extension if not exists pgcrypto;

-- Thành viên cố định của nhóm
create table if not exists members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

-- Mỗi buổi chơi
create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  cost_san   integer default 0,
  cost_cau   integer default 0,
  cost_nuoc  integer default 0,
  cost_khac  integer default 0,
  created_at timestamptz default now()
);

-- Người tham gia từng buổi (1 dòng = 1 người trong 1 buổi)
create table if not exists attendees (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  name       text not null,
  paid       boolean default false
);
create index if not exists attendees_session_idx on attendees(session_id);

-- Cấu hình nhận tiền (chỉ 1 dòng, id = 1)
create table if not exists settings (
  id        integer primary key default 1,
  bank_code text,
  account   text,
  holder    text,
  momo      text
);

-- ---------- Row Level Security ----------
-- Nhóm nhỏ: cho phép role anon đọc/ghi (bảo vệ bằng việc giữ kín đường link).
-- Muốn chặt hơn thì xem phần "Nâng cấp bảo mật" trong README.
alter table members   enable row level security;
alter table sessions  enable row level security;
alter table attendees enable row level security;
alter table settings  enable row level security;

create policy "open members"   on members   for all to anon, authenticated using (true) with check (true);
create policy "open sessions"  on sessions  for all to anon, authenticated using (true) with check (true);
create policy "open attendees" on attendees for all to anon, authenticated using (true) with check (true);
create policy "open settings"  on settings  for all to anon, authenticated using (true) with check (true);

-- ---------- Realtime ----------
alter publication supabase_realtime add table members;
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table attendees;
alter publication supabase_realtime add table settings;
