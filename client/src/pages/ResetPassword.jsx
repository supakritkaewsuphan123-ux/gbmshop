import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, Globe, ExternalLink } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  
  const submissionStarted = useRef(false);
  const recoveryAttempted = useRef(false);

  useEffect(() => {
    let mounted = true;

    // 🕵️ 1. Detect In-App Browsers (LINE, FB, Instagram)
    const ua = navigator.userAgent || '';
    const isLine = ua.includes('Line/');
    const isFb = ua.includes('FBAN/') || ua.includes('FBAV/');
    const isInsta = ua.includes('Instagram');
    
    if (isLine || isFb || isInsta) {
      console.log('[RESET] In-App Browser Detected:', { isLine, isFb, isInsta });
      setIsInAppBrowser(true);
    }

    // 🕵️ 2. Hybrid Recovery Detection
    const params = new URLSearchParams(location.search);
    const hash = window.location.hash;
    const isRecoveryMode = params.get('mode') === 'recovery' || hash.includes('type=recovery');

    console.log('[RESET] Initial Check:', { isRecoveryMode, hash: !!hash, search: location.search });

    // 🕵️ 3. Exponential Backoff Session Check
    const checkSessionWithRetry = async (retryCount = 0) => {
      if (!mounted) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log(`[RESET] Attempt ${retryCount + 1}:`, session ? 'Session found' : 'No session');

        if (session) {
          setCheckingSession(false);
          return;
        }

        // Delay: 1s -> 2s -> 3s
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 1000;
          setTimeout(() => checkSessionWithRetry(retryCount + 1), delay);
        } else {
          // Final attempt failed
          if (isRecoveryMode) {
            setError('ไม่พบเซสชันการกู้คืน กรุณาลองเปิดลิงก์ใน Chrome หรือ Safari แทนครับ');
          } else {
            setError('ลิงก์ไม่ถูกต้องหรือหมดอายุแล้วครับ');
          }
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('[RESET] Session check error:', err);
        setCheckingSession(false);
      }
    };

    checkSessionWithRetry();

    // 🕵️ 4. Global Auth Listener (Fallback)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[RESET] Auth Event: ${event}`, session ? 'with session' : 'no session');
      
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    });

    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submissionStarted.current) return;

    // Strong Password Regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(form.newPassword)) {
      return showToast('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวเล็ก ตัวใหญ่ และตัวเลขค่ะ 🔐', 'error');
    }

    if (form.newPassword !== form.confirmPassword) {
      return showToast('รหัสผ่านไม่ตรงกัน', 'error');
    }

    setLoading(true);
    submissionStarted.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.auth.updateUser({
        password: form.newPassword.trim()
      });
      
      if (error) throw error;

      // Security Audit Log
      try {
        await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/log-reset-success`, { 
          userId: user?.id,
          email: user?.email 
        });
      } catch (lErr) { console.warn('Audit log failed'); }

      showToast('รีเซ็ตรหัสผ่านใหม่เรียบร้อยแล้วค่ะ! 🎉', 'success');
      setSuccess(true);
      
      let count = 3;
      const interval = setInterval(() => {
        count -= 1;
        setRedirectCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          navigate('/login');
        }
      }, 1000);

    } catch (err) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการอัปเดต', 'error');
      submissionStarted.current = false;
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ In-App Browser Warning View
  if (isInAppBrowser && !success && !checkingSession && error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#0a0a0c]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface border border-border rounded-3xl p-10 shadow-2xl text-center max-w-md w-full">
           <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
              <Globe className="w-10 h-10 text-primary" />
           </div>
           <h2 className="text-2xl font-bold text-white mb-4">เปิดในเบราว์เซอร์ปกติ</h2>
           <p className="text-gray-400 mb-8 leading-relaxed">
             ดูเหมือนคุณกำลังเปิดลิงก์ผ่านแอป (เช่น LINE/FB) ซึ่งอาจบล็อกระบบความปลอดภัย <br/>
             <strong className="text-white">กรุณากดที่จุด 3 จุด หรือปุ่มเมนู และเลือก "Open in Browser" (Safari หรือ Chrome) ครับ</strong>
           </p>
           <button onClick={() => window.location.reload()} className="block w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
             <ExternalLink size={20} />
             ลองเปิดใหม่อีกครั้ง
           </button>
        </motion.div>
      </div>
    );
  }

  if (checkingSession) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#0a0a0c]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
          <Loader2 className="w-14 h-14 text-primary mb-6" />
        </motion.div>
        <p className="text-gray-400 font-medium animate-pulse">กำลังกู้คืนเซสชันความปลอดภัย...</p>
        <p className="text-gray-600 text-xs mt-2 italic">รองรับ Mobile & In-App Browser</p>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#0a0a0c]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface border border-border rounded-3xl p-10 shadow-2xl text-center max-w-md w-full">
           <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="w-10 h-10 text-red-500" />
           </div>
           <h2 className="text-2xl font-bold text-white mb-4">ลิงก์ไม่สามารถใช้งานได้</h2>
           <p className="text-gray-400 mb-8 leading-relaxed">{error}</p>
           <div className="space-y-4">
              <Link to="/forgot-password" size="lg" className="block w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all">
                ขอรับลิงก์กู้คืนใหม่
              </Link>
           </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#0a0a0c]">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
              <ShieldCheck className="text-primary w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">กำหนดรหัสผ่านใหม่</h2>
            <p className="text-gray-400 text-sm">อัปเกรดความปลอดภัยสำหรับบัญชีของคุณ</p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="label">รหัสผ่านใหม่ (A-Z, a-z, 0-9)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    className="input-field pl-11 pr-12"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors">
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="label">ยืนยันรหัสผ่านอีกครั้ง</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="input-field pl-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                <span>{loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}</span>
              </button>
            </form>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-green-500">เปลี่ยนรหัสสำเร็จ! 🎉</h3>
                <p className="text-gray-400">นำคุณไปยังหน้าเข้าสู่ระบบใน <span className="text-green-500 font-bold">{redirectCountdown}</span>...</p>
              </div>
              <Link to="/login" className="block w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg">เข้าสู่ระบบทันที</Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
