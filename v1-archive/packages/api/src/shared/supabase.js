import { createClient } from '@supabase/supabase-js';
import { AppError } from './errors.js';

let supabaseClient;

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const ensureEnv = () => {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new AppError(
      `Missing Supabase configuration: ${missing.join(', ')}`,
      500
    );
  }
};

export const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  ensureEnv();

  supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  return supabaseClient;
};
