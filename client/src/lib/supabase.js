import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('[Supabase] Initialization error:', err);
  }
}

// Export a proxy or a safe object to prevent crashes on method calls
export const supabase = supabaseInstance || {
  from: () => ({
    select: () => ({ order: () => Promise.resolve({ data: [], error: new Error('Supabase not initialized') }), eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }) }), in: () => Promise.resolve({ data: [], error: new Error('Supabase not initialized') }) }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
    update: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
    delete: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.reject(new Error('Supabase not initialized')),
    signUp: () => Promise.reject(new Error('Supabase not initialized')),
    signOut: () => Promise.resolve({ error: null }),
  },
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      upload: () => Promise.reject(new Error('Supabase not initialized')),
    })
  }
};
