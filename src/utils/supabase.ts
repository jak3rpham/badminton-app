import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zfryjssoaztuihsntdso.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmcnlqc3NvYXp0dWloc250ZHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDQwMDAsImV4cCI6MjA5ODM4MDAwMH0.EJFfMiYc8N6HHKoFesHB9hHOIWx_QjeKNInGjIk6V4k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface DbMember {
  id: string;
  name: string;
  created_at?: string;
}

export interface DbSession {
  id: string;
  date: string;
  cost_san: number;
  cost_cau: number;
  cost_nuoc: number;
  cost_khac: number;
  created_at?: string;
  attendees?: DbAttendee[];
}

export interface DbAttendee {
  id: string;
  session_id: string;
  name: string;
  paid: boolean;
  method?: 'momo' | 'bank' | 'cash' | null;
}

export interface DbSettings {
  id: number;
  bank_code: string;
  account: string;
  holder: string;
  momo?: string;
  momo_link?: string;
}
