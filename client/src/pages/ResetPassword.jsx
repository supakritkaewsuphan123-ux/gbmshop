import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 1. FAIL-SAFE: Check token on mount
  useEffect(() => {
    if (!token) {
      setError('ไม่พบรหัส Token สำหรับการรีเซ็ต กรุณาตรวจสอบลิงก์ในอีเมลอีกครั้งค่ะ');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || error) return;

    if (form.newPassword !== form.confirmPassword) {
      return showToast('รหัสผ่านไม่ตรงกัน', 'error');
    }
    if (form.newPassword.length < 6) {
      return showToast('รหัสผ่านสั้นเกินไป (ขั้นต่ำ 6 ตัว)', 'error');
    }

    setLoading(true);
    try {
      // ✅ REFACTORED TO USE GLOBAL API INSTANCE
      const response = await api.post('/auth/reset-password', { 
        token: token.trim().toLowerCase(), 
        newPassword: form.newPassword 
      });
      
      showToast(response.message || 'รีเซ็ตรหัสผ่านสำเร็จ!', 'success');
      setSuccess(true);
      
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const errMsg = err.message || 'เกิดข้อผิดพลาด';
      showToast(errMsg, 'error');
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (error && !success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-3xl p-10 shadow-2xl text-center max-w-md w-full">
           <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
           <h2 className="text-2xl font-bold text-white mb-4">เกิดข้อผิดพลาด</h2>
           <p className="text-gray-400 mb-8">{error}</p>
           <Link to="/forgot-password" size="lg" className="block w-full py-4 bg-primary text-white font-bold rounded-xl">
             ขอลิงก์ใหม่
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-surface border border-border rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
              <ShieldCheck className="text-primary w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">ตั้งรหัสผ่านใหม่</h2>
            <p className="text-gray-400 text-base">
              กรุณากำหนดรหัสผ่านใหม่ของคุณ <br />
              (Direct Connection Mode: enabled)
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">รหัสผ่านใหม่</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    className="w-full pl-11 pr-12 py-3.5 bg-black/40 border border-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-base"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">ยืนยันรหัสผ่านใหม่</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-base"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>กำลังบันทึกรหัสผ่านใหม่...</span>
                  </>
                ) : (
                  <span>ตกลงและรีเซ็ตรหัสผ่าน</span>
                )}
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-green-500">สำเร็จ! 🎉</h3>
                <p className="text-gray-400">
                  เปลี่ยนรหัสผ่านเรียบร้อยแล้ว<br />
                  กำลังพาหน้าไปเข้าสู่ระบบ...
                </p>
              </div>
              <Link
                to="/login"
                className="block w-full py-4 bg-primary text-white font-bold rounded-xl"
              >
                เข้าสู่ระบบทันที
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
