import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, LayoutDashboard, LogOut, LogIn, UserPlus, ShieldCheck, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    showToast('ออกจากระบบเรียบร้อย 👋', 'success');
    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'หน้าแรก' },
    { to: '/products', label: 'ตลาดสินค้า' },
    { to: '/help', label: 'ศูนย์ช่วยเหลือ' },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm py-4 border-b border-slate-50'
          : 'bg-white py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
             <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center text-white shadow-soft transition-all">
                <ShieldCheck size={24} fill="white" />
             </div>
             <span className="text-3xl font-black text-[#000000] tracking-tighter">GB<span className="text-primary italic">shop</span></span>
          </Link>

          {/* Nav Links — Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
                    isActive ? 'bg-primary text-white shadow-soft' : 'text-[#333333] hover:text-[#000000]'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden lg:flex items-center gap-3 mr-4">
                <NotificationBell />
                <Link to="/cart" className="relative w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 hover:text-primary hover:bg-white border border-transparent hover:border-slate-100 transition-all group">
                   <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                   {count > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white">
                    {count}
                   </span>}
                </Link>
              </div>
            )}

            {user ? (
               <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end mr-2">
                     <p className="text-[9px] text-[#555555] font-black uppercase tracking-[0.2em]">บัญชีผู้ใช้</p>
                     <p className="text-sm font-black text-[#000000] leading-none mt-1">{user.username}</p>
                  </div>
                  {isAdmin ? (
                    <Link to="/admin" className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-soft hover:brightness-110 transition-all">
                       <ShieldCheck size={22} />
                    </Link>
                  ) : (
                    <Link to="/dashboard" className="w-12 h-12 bg-slate-50 text-[#000000] rounded-2xl flex items-center justify-center border border-slate-100 hover:bg-white hover:border-slate-200 transition-all">
                       <LayoutDashboard size={22} />
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:text-red-500 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all">
                     <LogOut size={22} />
                  </button>
               </div>
            ) : (
               <div className="flex items-center gap-3">
                  <Link to="/login" className="hidden sm:flex px-6 py-3 text-[#333333] font-bold text-sm tracking-widest uppercase hover:text-[#000000] transition-all">เข้าสู่ระบบ</Link>
                  <Link to="/register" className="bg-primary text-white py-4 px-8 text-xs font-black uppercase tracking-widest rounded-2xl shadow-soft hover:brightness-110 transition-all">สมัครสมาชิก</Link>
               </div>
            )}

            {/* Mobile Toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden w-12 h-12 bg-slate-50 text-[#000000] rounded-2xl flex items-center justify-center border border-slate-100 active:scale-95 transition-all">
               {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full inset-x-0 bg-white border-b border-slate-50 shadow-2xl p-6"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="py-5 px-8 bg-slate-50 rounded-3xl font-black text-[#000000] uppercase text-xs tracking-[0.2em]">{l.label}</Link>
              ))}
              <div className="grid grid-cols-2 gap-4 mt-6">
                 {user ? (
                   <>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="py-5 bg-slate-50 text-[#000000] rounded-3xl text-center font-black uppercase text-[10px] tracking-widest border border-slate-100">โปรไฟล์</Link>
                    <button onClick={handleLogout} className="py-5 bg-red-50 text-red-500 rounded-3xl text-center font-black uppercase text-[10px] tracking-widest border border-red-100">ออกจากระบบ</button>
                   </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="py-5 bg-white text-[#000000] rounded-3xl text-center font-black uppercase text-[10px] tracking-widest border border-slate-200">เข้าสู่ระบบ</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="py-5 bg-primary text-white rounded-3xl text-center font-black uppercase text-[10px] tracking-widest shadow-soft">สมัครสมาชิก</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
