import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasConfig = Boolean(url && anonKey);

export const supabase = hasConfig
  ? createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 5 } } })
  : null;
