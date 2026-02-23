-- Bảng lưu danh sách đơn hàng Shopee
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  tracking_number text,
  tracking_info_description text,
  status integer,
  shipping_name text,
  shipping_phone text,
  shipping_address text,
  products jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(order_id)
);

-- Index để tìm nhanh theo order_id và thời gian
create index if not exists idx_orders_order_id on public.orders (order_id);
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

-- Bật RLS (Row Level Security) - tùy chỉnh policy theo nhu cầu
alter table public.orders enable row level security;

-- Policy: cho phép đọc/ghi với anon key (phù hợp khi chỉ dùng anon key từ frontend)
create policy "Allow all for anon" on public.orders
  for all using (true) with check (true);
