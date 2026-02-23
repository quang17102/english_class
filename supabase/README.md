# Supabase setup

1. Vào [Supabase Dashboard](https://supabase.com/dashboard) → chọn project (project id = `y` trong URL).
2. **SQL Editor** → New query → dán lần lượt và Run từng file:
   - `migrations/001_create_orders_table.sql`
   - `migrations/002_add_cookie_to_orders.sql` (thêm cột cookie)
3. **Settings → API**: copy **Project URL** và **anon public** key.
4. Trong project, tạo file `.env.local` (hoặc sửa từ `.env.local.example`):
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL (vd: `https://xxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key

Sau khi chạy migration và cấu hình env, mỗi lần "Kiểm tra" đơn hàng thành công, danh sách đơn sẽ được lưu/cập nhật vào bảng `orders` trên Supabase.
