import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, ShieldPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function Register() {
  usePageMetadata('สมัครสมาชิก', 'สมัครสมาชิก GBshop Marketplace เพื่อเริ่มต้นซื้อขายสินค้าพรีเมียม');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      return showToast('รหัสผ่านไม่ตรงกัน!', 'error');
    }

    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      showToast('สมัครสมาชิกสำเร็จ! 👋 พร้อมเข้าใช้งานแล้วครับ', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        <div className="bg-brand-navy/60 backdrop-blur-md border border-primary/10 rounded-[56px] p-16 shadow-glow-sm relative overflow-hidden">
          <div className="text-center mb-12 relative z-10">
            <div className="w-16 h-16 bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mx-auto mb-8 rounded-2xl shadow-sm">
              <ShieldPlus size={32} />
            </div>
            <h2 className="text-5xl font-black text-primary mb-2 tracking-tighter uppercase">Register</h2>
            <p className="text-primary/60 font-bold tracking-tight">เข้าร่วมครอบครัว GBshop </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="label text-primary">Username</label>
                <input type="text" required value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  className="input-field py-5" placeholder="เช่น gbmoney_shop" />
              </div>

              <div className="space-y-2">
                <label className="label text-primary">Email Address</label>
                <input type="email" required value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="input-field py-5" placeholder="example@email.com" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label text-primary">Password</label>
                  <div className="relative">
                    <input 
                      type={showPwd ? "text" : "password"} 
                      required 
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className="input-field py-5 pr-12" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-all"
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label text-primary">Confirm</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPwd ? "text" : "password"} 
                      required 
                      value={form.confirmPassword}
                      onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      className="input-field py-5 pr-12" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-all"
                    >
                      {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="bg-primary text-white font-black w-full py-6 text-xl rounded-2xl shadow-glow-sm hover:brightness-110 active:scale-95 transition-all mt-8"
            >
              {loading ? 'CREATING ACCOUNT...' : <><UserPlus size={22} className="inline mr-2" /> สมัครสมาชิก</>}
            </motion.button>
          </form>

          <p className="text-center mt-12 text-sm text-primary/40 font-bold">
            หากมีบัญชีอยู่แล้ว?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-black ml-1 transition-all underline underline-offset-8">เข้าสู่ระบบได้ที่นี่</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
