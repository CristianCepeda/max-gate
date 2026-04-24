import { createClient } from '@supabase/supabase-js';
import type { Business } from '@/types/business';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

// Secret key client — bypasses RLS. Only used server-side.
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as Business;
}
