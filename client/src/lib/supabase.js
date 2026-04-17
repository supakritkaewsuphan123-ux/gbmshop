import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Initialization (Production-grade)
 * 
 * Strict standards:
 * 1. Environment variables only (VITE_ prefix required for Vite)
 * 2. Protocol validation (HTTPS)
 * 3. Conditional error handling (Warn in dev, Throw in prod)
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isDev = import.meta.env.DEV;

// 1. Validation Logic
const validateConfig = () => {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

  if (missingVars.length > 0) {
    const errorMsg = `[Supabase] Missing Environment Variables: ${missingVars.join(', ')}. Check your .env file.`;
    
    if (isDev) {
      console.warn(errorMsg);
      return false;
    } else {
      // Hard crash in production to prevent data inconsistency or silent failures
      throw new Error(errorMsg);
    }
  }

  // 2. Protocol Check
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    const protocolError = '[Supabase] Invalid URL: VITE_SUPABASE_URL must use HTTPS for production security.';
    if (isDev) {
      console.warn(protocolError);
    } else {
      throw new Error(protocolError);
    }
  }

  return true;
};

// 3. Client Initialization
let supabase = null;

if (validateConfig()) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    if (isDev) {
      console.log('✅ [Supabase] Client initialized successfully.');
    }
  } catch (err) {
    const initError = `[Supabase] Initialization failed: ${err.message}`;
    if (isDev) {
      console.error(initError);
    } else {
      throw new Error(initError);
    }
  }
} else {
  // Graceful degradation for Dev ONLY (avoiding total crash if not needed)
  // But in production, validateConfig would have already thrown an error.
}

export { supabase };
