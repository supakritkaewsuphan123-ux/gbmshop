import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function Login() {
  usePageMetadata('เข้าสู่ระบบ', 'เข้าสู่ระบบ GB Marketplace เพื่อจัดการสินค้าและ Wallet ของคุณอย่างปลอดภัย');
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Safe navigation AFTER context flushes the state
  useEffect(() => {
    if (!authLoading && user) {
      const targetPath = user.role === 'admin' ? '/admin' : from;
      navigate(targetPath, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  // Persistent State from localStorage
  const [failCount, setFailCount] = useState(() => {
    const saved = localStorage.getItem('loginFailCount');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lockedUntil, setLockedUntil] = useState(() => {
    const saved = localStorage.getItem('loginLockedUntil');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [timeLeft, setTimeLeft] = useState(0);

  // Countdown timer logic (Real-time update)
  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0 && lockedUntil !== 0) {
        setLockedUntil(0);
        localStorage.removeItem('loginLockedUntil');
      }
    };

    updateTimer(); // Initial call

    if (lockedUntil > Date.now()) {
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [lockedUntil]);

  const isLocked = timeLeft > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    
    setLoading(true);
    const cleanIdentifier = form.identifier.toLowerCase().trim();
    
    try {
      await login(cleanIdentifier, form.password.trim());
      
      // Success: Clear everything
      showToast('เข้าสู่ระบบสำเร็จ! 🎉', 'success');
      setFailCount(0);
      setLockedUntil(0);
      localStorage.removeItem('loginFailCount');
      localStorage.removeItem('loginLockedUntil');
      setLoading(false);
    } catch (err) {
      const msg = err.message || '';
      
      // Increment fail count
      const newFailCount = failCount + 1;
      setFailCount(newFailCount);
      localStorage.setItem('loginFailCount', newFailCount);

      // Check threshold (More than 5 attempts) OR server-side lockout message
      if (newFailCount > 5 || msg.includes('รอ') || msg.includes('บ่อยเกินไป')) {
        const lockDuration = 60 * 1000; // 60 seconds
        const lockTimestamp = Date.now() + lockDuration;
        
        setLockedUntil(lockTimestamp);
        localStorage.setItem('loginLockedUntil', lockTimestamp);
        
        showToast('คุณพยายามผิดเกิน 5 ครั้ง ระบบล็อกชั่วคราว 60 วินาที 🔒', 'error');
      } else {
        showToast(`${msg} (ผิดครั้งที่ ${newFailCount}/5)`, 'error');
      }
      
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-3xl font-extrabold text-white mb-1">GB<span className="text-primary">money</span></div>
            <h2 className="text-2xl font-bold text-white mt-4 mb-1">ยินดีต้อนรับกลับ</h2>
            <p className="text-gray-400 text-sm">เข้าสู่ระบบเพื่อใช้งาน</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">ชื่อผู้ใช้ หรือ อีเมล</label>
              <input
                type="text" required
                value={form.identifier}
                onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
                className="input-field"
                placeholder="ชื่อผู้ใช้ หรือ email@example.com"
              />
            </div>
            <div>
              <label className="label">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="input-field pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end -mt-2">
              <Link to="/forgot-password" size={14} className="text-primary hover:text-primary-hover text-sm font-medium transition-colors">
                ลืมรหัสผ่าน?
              </Link>
            </div>

            {/* ✅ Lockout Warning */}
            {isLocked && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                <p className="text-red-400 text-sm font-bold">🔒 บัญชีถูกล็อคชั่วคราว</p>
                <p className="text-red-300 text-xs mt-1">กรุณารอ <span className="font-mono font-bold">{timeLeft}</span> วินาที</p>
              </div>
            )}

            {/* ✅ Attempt Counter */}
            {failCount > 0 && !isLocked && (
              <p className="text-xs text-center text-orange-400">
                พยายามผิด {failCount}/5 ครั้ง {failCount === 5 ? '⚠️ ครั้งสุดท้ายแล้ว! ระวังโดนล็อก' : failCount >= 3 && '⚠️ เหลืออีก ' + (5 - failCount) + ' ครั้ง'}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={loading || isLocked}
              whileHover={{ scale: isLocked ? 1 : 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLocked ? (
                <>🔒 รอ {timeLeft} วินาที</>
              ) : loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                <><LogIn size={18} /> เข้าสู่ระบบ</>
              )}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">สมัครสมาชิกฟรี</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
