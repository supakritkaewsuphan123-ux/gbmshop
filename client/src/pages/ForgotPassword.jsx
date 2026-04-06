import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict Email Format Validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showToast('รูปแบบอีเมลไม่ถูกต้อง', 'error');
    }

    setLoading(true);
    try {
      // Using axios as requested
      const res = await axios.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
      showToast(res.data.message || 'ส่งคำขอสำเร็จแล้ว! โปรดตรวจสอบอีเมลของคุณ', 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
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
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-card relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />
          
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Mail className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">ลืมรหัสผ่านใช่ไหม?</h2>
            <p className="text-gray-400 text-sm">ไม่ต้องกังวล เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้คุณทางอีเมล</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <label className="label">อีเมลของคุณ</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="example@email.com"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
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
                    กำลังดำเนินการ...
                  </span>
                ) : (
                  <><Send size={18} /> ส่งคำขอรีเซ็ต</>
                )}
              </motion.button>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-6 relative z-10"
            >
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl space-y-3">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Send className="text-green-500" size={24} />
                  </div>
                </div>
                <p className="text-green-400 text-sm leading-relaxed px-2">
                  หากพบอีเมล <strong>{email}</strong> ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว โปรดตรวจสอบในกล่องจดหมายของคุณ
                </p>
              </div>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-primary hover:underline text-sm font-medium"
              >
                ไม่ได้รับอีเมล? ลองส่งอีกครั้ง
              </button>
            </motion.div>
          )}

          <div className="mt-8 pt-6 border-t border-border/50 text-center relative z-10">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
              <ArrowLeft size={16} /> กลับไปยังหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
