import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Upload, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', email: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      return showToast('รหัสผ่านไม่ตรงกัน!', 'error');
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('username', form.username);
      fd.append('password', form.password);
      fd.append('email', form.email);
      if (file) fd.append('profile_image', file);
      await register(fd);
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
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="text-3xl font-extrabold text-white mb-1">GB<span className="text-primary">money</span></div>
            <h2 className="text-2xl font-bold text-white mt-4 mb-1">สมัครสมาชิก</h2>
            <p className="text-gray-400 text-sm">เปิดบัญชีและเริ่มซื้อขายได้เลย</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar upload */}
            <div className="flex justify-center">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileRef.current.click()}
                className="relative w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary transition-all duration-300 overflow-hidden bg-surface-hover group"
              >
                {preview ? (
                  <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 group-hover:text-primary transition-colors">
                    <Upload size={22} />
                    <span className="text-xs mt-1">รูปโปรไฟล์</span>
                  </div>
                )}
              </motion.button>
              <input type="file" ref={fileRef} accept="image/*" onChange={handleFile} className="hidden" />
            </div>

            <div>
              <label className="label">ชื่อผู้ใช้</label>
              <input type="text" required value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                className="input-field" placeholder="เลือกชื่อผู้ใช้" />
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
              className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
            >
              {loading ? 'กำลังสร้างบัญชี...' : <><UserPlus size={18} /> สร้างบัญชีใหม่</>}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            มีบัญชีแล้ว?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">เข้าสู่ระบบ</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
