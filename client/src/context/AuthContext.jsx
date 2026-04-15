import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRefreshing = useRef(false);

  // ✅ 1. Fetch Profile with TIMEOUT Guard (ป้องกันเครื่องค้าง)
  const fetchProfile = useCallback(async (sessionUser) => {
    if (!sessionUser) return null;
    
    // สร้าง Promise ดักเวลา 4 วินาที
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)
    );

    const fetchPromise = (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, balance, avatar_url, role, is_banned')
        .eq('id', sessionUser.id)
        .single();
      if (error) throw error;
      return { ...sessionUser, ...data };
    })();

    try {
      // แข่งกันระหว่างการดึงข้อมูลจริง กับ เวลาที่กำหนด
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err) {
      console.warn('[AUTH] Profile fetch failed or timeout, using session data:', err.message);
      // Fallback: ใช้ข้อมูลจาก session ไปก่อนเพื่อให้ระบบไม่ค้าง
      return { 
        ...sessionUser, 
        role: sessionUser.app_metadata?.role || 'user', 
        username: sessionUser.user_metadata?.username || 'user' 
      };
    }
  }, []);

  // ✅ 2. Single Event Stream Management
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AUTH] Event: ${event}`, session ? 'Session found' : 'No session');

      // 🛑 STRICT GUARD: Completely bypass for Reset Password page to avoid race conditions
      if (window.location.pathname === '/reset-password') {
        console.log('[AUTH] Reset Password path detected - PREVENTING GLOBAL OVERRIDE');
        if (isMounted) setLoading(false);
        return;
      }

      // Ignore duplicates or recovery events that should be handled by the page
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[AUTH] PASSWORD_RECOVERY ignored by Context (Handled by Page)');
        if (isMounted) setLoading(false);
        return;
      }

      if (!session) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // ตรวจสอบข้อมูลเบื้องต้นทันที (Instant Update)
      const jwtRole = session.user?.app_metadata?.role;
      
      // ดึงโปรไฟล์ (มีระบบดักค้าง 4 วินาที)
      const fullProfile = await fetchProfile(session.user);
      const dbRole = fullProfile?.role;

      // ✅ Mismatch Detection & Auto-Refresh
      if (jwtRole !== dbRole && !isRefreshing.current) {
        console.log('[AUTH] Role mismatch, refreshing session...');
        isRefreshing.current = true;
        await supabase.auth.refreshSession();
        setTimeout(() => { isRefreshing.current = false; }, 5000);
        return;
      }

      if (isMounted) {
        setUser(fullProfile);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = useCallback(async (identifier, password) => {
    setLoading(true);
    const cleanId = identifier.trim();
    let targetEmail = cleanId;

    if (!cleanId.includes('@')) {
      const { data: resolvedEmail } = await supabase.rpc('resolve_auth_email', { p_identifier: cleanId });
      if (resolvedEmail) targetEmail = resolvedEmail;
    }

    if (!targetEmail.includes('@')) {
      setLoading(false);
      throw new Error('ไม่พบชื่อผู้ใช้นัยระบบ หรือกรอกข้อมูลผิดรูปแบบ 🚫');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password
    });

    if (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      // Clear any potential leftover auth headers in state if any
      console.log('[AUTH] Logged out successfully');
    } catch (err) {
      console.error('[AUTH] Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { username: username.toLowerCase().trim() }
      }
    });
    if (error) throw error;
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be in AuthProvider');
  return ctx;
};
