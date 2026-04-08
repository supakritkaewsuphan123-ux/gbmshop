import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const API_URL = "http://localhost:3000/api/auth/forgot-password";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      if (email.length > 100) {
        throw new Error('อีเมลยาวเกินไป');
      }

      // ✅ DEBUG LOG (MANDATORY)
      console.log("----------------------------------------");
      console.log("REQ: Sending forgot-password request");
      console.log("URL:", API_URL);
      console.log("Payload:", { email });
      console.log("----------------------------------------");

      const response = await axios.post(API_URL, { email });
      
      console.log("RES: Success", response.data);
      showToast(response.data.message || 'ส่งลิงก์รีเซ็ตสำเร็จ', 'success');
      setSubmitted(true);
    } catch (err) {
      console.error("RES: Error", err.response?.data || err.message);
      showToast(err.response?.data?.error || err.message, 'error');
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
        <div className="bg-surface border border-border rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
              <Mail className="text-primary w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">ลืมรหัสผ่าน?</h2>
            <p className="text-gray-400 text-base leading-relaxed">
              กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ต <br />
              (ตรวจสอบหน้าจอ Server เพื่อดูลิงก์ในโหมด DEV)
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">อีเมลของคุณ</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    maxLength={100}
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-base"
                    placeholder="example@mail.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>กำลังดำเนินการ...</span>
                  </>
                ) : (
                  <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
                )}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors py-2 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">กลับไปหน้าเข้าสู่ระบบ</span>
              </Link>
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
                <h3 className="text-xl font-bold text-green-500">ส่งคำขอสำเร็จ!</h3>
                <p className="text-gray-400 leading-relaxed px-4">
                  หากอีเมล <span className="text-white font-medium">{email}</span> มีอยู่ในระบบ <br />
                  เราได้ส่งลิงก์รีเซ็ตไปให้แล้วค่ะ (อายุ 15 นาที)
                </p>
              </div>
              <Link
                to="/login"
                className="block w-full py-4 bg-surface-hover hover:bg-surface border border-border text-white font-bold rounded-xl transition-all"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
