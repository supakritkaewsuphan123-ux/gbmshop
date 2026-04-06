import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState({ length: false, number: false, special: false });
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    setStrength({
      length: newPassword.length >= 8,
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*]/.test(newPassword)
    });
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return showToast('Token ไม่ถูกต้อง', 'error');
    if (newPassword !== confirmPassword) return showToast('รหัสผ่านไม่ตรงกัน', 'error');
    
    // Strict Strength Check (User Request Regex)
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
    if (!regex.test(newPassword)) {
      return showToast('รหัสผ่านไม่ผ่านเกณฑ์ความแข็งแรง', 'error');
    }

    setLoading(true);
    try {
      // Using axios as requested
      const res = await axios.post('/api/auth/reset-password', { token, newPassword });
      showToast(res.data.message || 'รหัสผ่านถูกเปลี่ยนเรียบร้อย', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">ลิงก์ไม่ถูกต้อง</h2>
          <p className="text-gray-400 mb-6">ลิงก์ที่คุณใช้ไม่สามารถขอรีเซ็ตรหัสผ่านได้</p>
          <button onClick={() => navigate('/login')} className="btn-primary px-8">กลับหน้าแรก</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-card">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">ตั้งรหัสผ่านใหม่</h2>
            <p className="text-gray-400 text-sm mt-2">กรุณาตั้งรหัสผ่านที่จำง่ายแต่คาดเดาได้ยาก</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="label">รหัสผ่านใหม่</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div>
                <label className="label">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>

              {/* Password Strength Checklist */}
              <div className="bg-bg/50 rounded-xl p-4 border border-border/30 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">เงื่อนไขความปลอดภัย</p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={14} className={strength.length ? 'text-green-500' : 'text-gray-600'} />
                  <span className={strength.length ? 'text-green-400' : 'text-gray-500'}>อย่างน้อย 8 ตัวอักษร</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={14} className={strength.number ? 'text-green-500' : 'text-gray-600'} />
                  <span className={strength.number ? 'text-green-400' : 'text-gray-500'}>มีตัวเลข (0-9)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={14} className={strength.special ? 'text-green-500' : 'text-gray-600'} />
                  <span className={strength.special ? 'text-green-400' : 'text-gray-500'}>มีอักขระพิเศษ (@, $, !, %)</span>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  กำลังบันทึก...
                </span>
              ) : (
                <><Lock size={18} /> ยืนยันรหัสผ่านใหม่</>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
