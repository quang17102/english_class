-- Tối ưu lại bảng acc_data chỉ còn 3 field
-- Xóa các cột cũ
alter table public.acc_data drop column if exists acc_id;
alter table public.acc_data drop column if exists acc_pass;
alter table public.acc_data drop column if exists phone;
alter table public.acc_data drop column if exists spc_f;
alter table public.acc_data drop column if exists spc_st;
alter table public.acc_data drop column if exists email;
alter table public.acc_data drop column if exists passmail;

-- Thêm các cột mới (nếu chưa tồn tại)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'acc_data' and column_name = 'acc_content') then
    alter table public.acc_data add column acc_content text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'acc_data' and column_name = 'cookie') then
    alter table public.acc_data add column cookie text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'acc_data' and column_name = 'mailpass') then
    alter table public.acc_data add column mailpass text;
  end if;
end $$;

-- Set NOT NULL cho acc_content sau khi đã có dữ liệu
alter table public.acc_data alter column acc_content set not null;

-- Xóa unique constraint cũ trên acc_id
drop index if exists idx_acc_data_acc_id_unique;
alter table public.acc_data drop constraint if exists acc_data_acc_id_key;

-- Tạo unique constraint trên acc_content (lấy acc_id từ đầu acc_content)
-- Tạo function để extract acc_id từ acc_content
create or replace function extract_acc_id(acc_content text)
returns text as $$
begin
  if acc_content is null or acc_content = '' then
    return null;
  end if;
  return split_part(acc_content, '|', 1);
end;
$$ language plpgsql immutable;

-- Tạo unique index trên acc_id được extract từ acc_content
create unique index if not exists idx_acc_data_acc_content_unique 
on public.acc_data(extract_acc_id(acc_content));

