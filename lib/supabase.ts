import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Chỉ dùng Supabase khi URL và key hợp lệ
const isConfigured =
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  supabaseUrl.includes('.supabase.co') &&
  !supabaseUrl.startsWith('https://y.supabase.co');

export const isSupabaseConfigured = isConfigured;

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type Order = {
  id?: string;
  customer_name: string;
  address: string;
  products: string;
  note?: string;
  acc?: string;
  order_time?: string;
  status: 'chưa đặt' | 'đã đặt' | 'đang vận chuyển' | 'thành công' | 'đã hủy';
  created_at?: string;
  updated_at?: string;
};

export type AccData = {
  id?: string;
  acc_content: string;
  cookie?: string;
  mailpass?: string;
  created_at?: string;
  updated_at?: string;
};

