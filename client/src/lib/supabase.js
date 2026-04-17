import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Initialization (Senior Frontend - Safe Proxy Pattern)
 * 
 * Goal: NO MORE BLACK SCREENS.
 * - If config is missing, return a Proxy that stub methods instead of null.
 * - This allows React components to mount and call methods without crashing.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isDev = import.meta.env.DEV;

// 1. Connection Status Logging (Safe)
if (isDev) {
  console.group('🛡️ [Supabase] Environment Check');
  console.log(`URL Setup: ${supabaseUrl ? '✅ OK' : '❌ MISSING'}`);
  console.log(`Key Setup: ${supabaseAnonKey ? '✅ OK' : '❌ MISSING'}`);
  console.groupEnd();
}

/**
 * Creates a "Safe Proxy" that prevents 'Cannot read properties of null' crashes.
 * It recursively returns proxies or empty results for all calls.
 */
const createSafeProxy = (reason) => {
  const noop = () => {};
  const emptyResponse = Promise.resolve({ data: null, error: { message: reason, isSafeProxy: true } });

  const handler = {
    get(target, prop) {
      // Special cases for auth listeners and common patterns
      if (prop === 'auth') {
        return new Proxy({}, {
          get(t, p) {
            if (p === 'onAuthStateChange') return () => ({ data: { subscription: { unsubscribe: noop } } });
            if (p === 'getSession' || p === 'getUser') return () => emptyResponse;
            if (p === 'signInWithPassword' || p === 'signUp' || p === 'signOut' || p === 'refreshSession') return () => emptyResponse;
            return () => emptyResponse;
          }
        });
      }

      if (prop === 'from' || prop === 'rpc' || prop === 'storage') {
        return () => new Proxy({}, handler);
      }

      // Chainable methods (select, eq, single, etc.)
      const chainables = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'lt', 'single', 'maybeSingle', 'order', 'limit', 'range', 'rpc', 'upload', 'getPublicUrl'];
      if (chainables.includes(prop)) {
        return () => new Proxy({}, handler);
      }

      // Handle terminal calls (thenable for async/await)
      if (prop === 'then') {
        return (resolve) => resolve({ data: null, error: { message: reason } });
      }

      // Modules
      if (['storage', 'functions', 'realtime'].includes(prop)) {
        return new Proxy({}, handler);
      }

      return noop;
    }
  };

  return new Proxy({}, handler);
};

// 2. Main Initialization Logic
const validateAndInit = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `[Supabase] CRITICAL CONFIG MISSING: Environment variables are not set. UI is running in "Safe Mode".`;
    console.error(errorMsg);
    
    // Return Safe Proxy instead of null to prevent Black Screen
    return createSafeProxy(errorMsg);
  }

  // Protocol Validation
  if (!supabaseUrl.startsWith('https://')) {
    const protocolError = '[Supabase] Protocol Violation: URL must use HTTPS.';
    console.error(protocolError);
    return createSafeProxy(protocolError);
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error(`[Supabase] Initialization failed: ${err.message}`);
    return createSafeProxy(err.message);
  }
};

const supabase = validateAndInit();

export { supabase };
