-- Bảng lưu danh sách đơn hàng
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  address text not null,
  products jsonb default '[]'::jsonb,
  note text,
  status text not null default 'chưa đặt',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index để tìm nhanh theo thời gian
create index if not exists idx_orders_created_at on public.orders (created_at desc);

-- Cập nhật updated_at khi row thay đổi
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Bật RLS (Row Level Security)
alter table public.orders enable row level security;

-- Policy: cho phép đọc/ghi với anon key
create policy "Allow all for anon" on public.orders
  for all using (true) with check (true);

