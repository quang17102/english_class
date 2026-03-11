-- Thêm cột order_time để lưu thời gian đặt hàng
alter table public.orders add column if not exists order_time timestamptz;

