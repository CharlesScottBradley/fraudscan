import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export interface Provider {
  id: string;
  license_number: string;
  name: string;
  dba_name: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  license_type: string;
  license_status: string;
  licensed_capacity: number | null;
  license_effective_date: string | null;
  license_expiration_date: string | null;
  parent_aware_rating: number | null;
  is_accredited: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  provider_id: string;
  fiscal_year: number;
  total_amount: number;
  data_source: string;
  created_at: string;
}

export interface ProviderWithFunding extends Provider {
  total_funding: number;
  payments: Payment[];
}
