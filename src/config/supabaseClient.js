import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SAEST_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SAEST_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SAEST_SUPABASE_URL or VITE_SAEST_SUPABASE_KEY in environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
