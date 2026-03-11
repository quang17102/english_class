-- Thay đổi cột products từ jsonb sang text
alter table public.orders alter column products type text using 
  case 
    when products::text = '[]' or products is null then ''
    else products::text
  end;

