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

// Improved: Truly recursive Proxy to handle ANY method chain safely
const createUncrashableProxy = (name = 'root') => {
  const handler = {
    get: (target, prop) => {
      // Return a function that returns the same proxy, allowing any chain depth
      if (prop === 'then') return undefined; // Avoid issues with async/await
      return createUncrashableProxy(prop);
    },
    apply: (target, thisArg, args) => {
      // When called as a function, return the same proxy
      return createUncrashableProxy('apply');
    }
  };

  // The proxy is a function so it can be called: proxy.method()()()
  const proxyFn = function() { return new Proxy(() => {}, handler); };
  return new Proxy(proxyFn, handler);
};

// Base definitions for common methods to return sensible defaults if needed
const baseFallback = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.reject(new Error('Supabase not initialized')),
  },
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    })
  }
};

export const supabase = supabaseInstance || Object.assign(createUncrashableProxy(), baseFallback);
