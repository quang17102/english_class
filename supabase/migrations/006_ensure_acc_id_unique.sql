-- Đảm bảo acc_id có unique constraint/index
-- Xóa constraint cũ nếu có
alter table public.acc_data drop constraint if exists acc_data_acc_id_key;

-- Tạo unique index cho acc_id
create unique index if not exists idx_acc_data_acc_id_unique on public.acc_data(acc_id);

