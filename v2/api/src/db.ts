import {createClient} from '@supabase/supabase-js';
import {env} from './env.js';

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
