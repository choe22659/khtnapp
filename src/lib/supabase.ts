import { createClient } from '@supabase/supabase-js';

// Thay thế bằng URL và Anon Key của bạn từ Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cqctdnkwxaftmdrpwodr.supabase.co/rest/v1/';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_FR12GpYBgaB2DlyysN3Wfw_1-VfMxkp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);