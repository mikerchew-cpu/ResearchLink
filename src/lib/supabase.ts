import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return url;
}

let _supabase: ReturnType<typeof createClient> | null = null;
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function ensureClient() {
  if (!_supabase) {
    _supabase = createClient(getSupabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
  }
  return _supabase;
}

function ensureAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  }
  return _supabaseAdmin;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return ensureClient()[prop as keyof ReturnType<typeof createClient>];
  },
});

export const supabaseAdmin: any = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return ensureAdmin()[prop as keyof ReturnType<typeof createClient>];
  },
});

export function getSupabaseClient(accessToken?: string) {
  const url = getSupabaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (accessToken) {
    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
  return ensureClient();
}
