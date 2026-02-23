-- Thêm cột cookie để lưu cookie dùng khi kiểm tra đơn (khi đơn đã tồn tại thì chỉ cập nhật lại cookie)
alter table public.orders add column if not exists cookie text;
