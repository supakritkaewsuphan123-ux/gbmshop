import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Upload, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
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
      showToast('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ 🎉', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-2xl shadow-slate-200/60">
          <div className="text-center mb-10">
            <div className="text-3xl font-black text-slate-900 mb-1">GB<span className="text-primary">shop</span></div>
            <h2 className="text-2xl font-black text-slate-900 mt-6 mb-2">สมัครสมาชิก</h2>
            <p className="text-slate-500 font-medium">เปิดบัญชีและเริ่มซื้อขายได้เลย</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">


            <div>
              <label className="label">ชื่อผู้ใช้ (Username)</label>
              <input type="text" required value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                className="input-field" placeholder="ชื่อเล่นหรือชื่อจริง" />
            </div>

            <div>
              <label className="label">อีเมล</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="input-field" placeholder="example@email.com" />
            </div>

            <div>
              <label className="label">รหัสผ่าน</label>
              <div className="relative">
                <input 
                  type={showPwd ? "text" : "password"} 
                  required 
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="input-field pr-12" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors focus:outline-none"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">ยืนยันรหัสผ่านอีกครั้ง</label>
              <div className="relative">
                <input 
                  type={showConfirmPwd ? "text" : "password"} 
                  required 
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="input-field pr-12" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors focus:outline-none"
                >
                  {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'กำลังสร้างบัญชี...' : <><UserPlus size={18} /> สร้างบัญชีใหม่</>}
            </motion.button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-500 font-medium">
            มีบัญชีแล้ว?{' '}
            <Link to="/login" className="text-primary hover:underline font-bold">เข้าสู่ระบบ</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
