import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseUrl = rawUrl?.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key' &&
    supabaseUrl.startsWith('http')
  );
};

// Create client if configured, or use a dummy fallback client to avoid crashing when keys are not yet configured
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export interface DbProfile {
  id: string;
  full_name: string;
  class_or_semester: string;
  user_type: 'school' | 'college';
  created_at?: string;
  updated_at?: string;
}

export interface DbSchoolData {
  id?: string;
  user_id: string;
  saturday_enabled: boolean;
  current_week: number;
  previous_attended: number;
  previous_total: number;
  weeks: any[];
  updated_at?: string;
}

export interface DbCollegeData {
  id?: string;
  user_id: string;
  minimum_goal: number;
  eca_count: number;
  subjects: any[];
  updated_at?: string;
}
