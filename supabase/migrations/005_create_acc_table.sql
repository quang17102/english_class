-- Tạo bảng để lưu trữ dữ liệu ACC
-- Format: id|pass|phone|SPC_F SPC_ST email}passmail
create table if not exists public.acc_data (
  id uuid default gen_random_uuid() primary key,
  acc_id text not null unique,
  acc_pass text not null,
  phone text,
  spc_f text,
  spc_st text,
  email text,
  passmail text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tạo index để tìm kiếm nhanh hơn
create index if not exists idx_acc_data_created_at on public.acc_data(created_at desc);

-- Trigger để tự động cập nhật updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_acc_data_updated_at
  before update on public.acc_data
  for each row
  execute function update_updated_at_column();

-- Bật RLS (Row Level Security)
alter table public.acc_data enable row level security;

-- Policy: cho phép đọc/ghi với anon key
create policy "Allow all for anon" on public.acc_data
  for all using (true) with check (true);

