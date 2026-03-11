-- Thêm cột ACC vào bảng orders
alter table public.orders add column if not exists acc text;

