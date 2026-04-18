import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function Login() {
  usePageMetadata('เข้าสู่ระบบ', 'เข้าสู่ระบบ GBshop Marketplace เพื่อเริ่มต้นช้อปสินค้าพรีเมียม');
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      showToast('ยินดีต้อนรับกลับมาครับ! ✨', 'success');
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo);
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        <div className="bg-white border border-slate-100 rounded-[56px] p-16 shadow-soft relative overflow-hidden">
          <div className="text-center mb-14">
            <div className="w-16 h-16 bg-slate-50 flex items-center justify-center text-slate-900 mx-auto mb-8 rounded-2xl shadow-sm border border-slate-50">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">Login</h2>
            <p className="text-slate-400 font-bold tracking-tight">เข้าใช้งานบัญชี GBshop ของคุณ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="label">Username or Email</label>
              <input type="text" required value={form.identifier}
                onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
                className="input-field py-5" placeholder="yourname@example.com" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" size="sm" className="text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-primary transition-all">Forgot?</Link>
              </div>
              <div className="relative">
                <input 
                  type={showPwd ? "text" : "password"} 
                  required 
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="input-field py-5 pr-14" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-all"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="bg-slate-900 text-white font-black w-full py-6 text-xl rounded-2xl shadow-soft hover:brightness-110 active:scale-95 transition-all mt-6"
            >
              {loading ? 'AUTHENTICATING...' : <><LogIn size={22} className="inline mr-2" /> เข้าสู่ระบบ</>}
            </motion.button>
          </form>

          <p className="text-center mt-12 text-sm text-slate-400 font-bold">
            ยังไม่มีบัญชีสมาชิกเว็บเรา?{' '}
            <Link to="/register" className="text-slate-900 hover:text-primary font-black ml-1 transition-all underline underline-offset-8">สมัครสมาชิก</Link>
          </p>
        </div>
        
        <div className="mt-12 text-center flex items-center justify-center gap-6">
           <Link to="/" className="text-[10px] text-slate-300 font-black uppercase tracking-widest hover:text-slate-500 transition-all">Home</Link>
           <span className="w-1 h-1 bg-slate-100 rounded-full" />
           <Link to="/help" className="text-[10px] text-slate-300 font-black uppercase tracking-widest hover:text-slate-500 transition-all">Help Center</Link>
        </div>
      </motion.div>
    </div>
  );
}
