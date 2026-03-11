-- Thêm cột MVD vào bảng orders
alter table public.orders add column if not exists mvd text default '';

