import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export a client if configured, otherwise null to trigger demo mode
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://your-project.supabase.co")
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type Person = {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  photo_url?: string;
  description?: string;
};

export type Relationship = {
  id: string;
  person1_id: string;
  person2_id: string;
  type: 'parent_child' | 'spouse';
  meta?: string;
};
