import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Chỉ dùng Supabase khi URL và key hợp lệ (không phải placeholder)
const isConfigured =
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  supabaseUrl.includes('.supabase.co') &&
  !supabaseUrl.startsWith('https://y.supabase.co');

export const isSupabaseConfigured = isConfigured;

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type DbOrder = {
  id?: string;
  order_id: string;
  tracking_number: string | null;
  tracking_info_description: string | null;
  status: number | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  products: Array<{ name: string; amount: number; price: string; rawPrice?: number }>;
  created_at?: string;
  updated_at?: string;
};
