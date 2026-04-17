import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Initialization (Senior Frontend - Production-grade)
 * 
 * Features:
 * - Masked Status Logging (OK/MISSING) - Dev only
 * - Strict Environment Validation
 * - Secure Failure (Throws in Prod, Warns in Dev)
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isDev = import.meta.env.DEV;

// 1. Masked Status Logger (Development Only)
if (isDev) {
  console.group('🛡️ [Supabase] Environment Status');
  console.log(`URL: ${supabaseUrl ? '✅ OK' : '❌ MISSING'}`);
  console.log(`KEY: ${supabaseAnonKey ? '✅ OK' : '❌ MISSING'}`);
  console.groupEnd();
}

// 2. Strict Validation & Security Guard
const validateAndInit = () => {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    const errorMsg = `[Supabase] Critical Error: Missing environment variables (${missing.join(', ')}).`;

    if (isDev) {
      console.warn(`${errorMsg}\nCheck your .env file or build configuration.`);
      return null;
    } else {
      // Production Security: Immediate throw to prevent silent failure
      throw new Error(errorMsg);
    }
  }

  // Protocol Check (Must be https)
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    const protocolError = '[Supabase] Security Error: URL must use HTTPS for production.';
    if (isDev) {
      console.warn(protocolError);
    } else {
      throw new Error(protocolError);
    }
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

const supabase = validateAndInit();

export { supabase };
