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
          ? 'bg-white/40 backdrop-blur-xl shadow-lg py-4 border-b border-navy/10'
          : 'bg-transparent py-8'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between gap-4 h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
             <div className="w-13 h-13 bg-primary rounded-[20px] flex items-center justify-center text-white shadow-glow-sm transition-all group-hover:scale-110">
                <ShieldCheck size={28} fill="white" />
             </div>
             <span className="text-2xl sm:text-4xl font-black text-[#EE4D2D] tracking-tighter">GB<span className="text-primary italic">shop</span></span>
          </Link>

          {/* Nav Links — Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-6 py-3 rounded-2xl text-xl font-black uppercase tracking-[0.1em] transition-all ${
                    isActive ? 'bg-primary text-white shadow-glow-sm' : 'text-navy hover:text-primary hover:bg-primary/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center sm:gap-3 gap-1">
            {user && (
              <div className="hidden lg:flex items-center gap-3 mr-4">
                <NotificationBell />
                <Link to="/cart" className="relative w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 border border-primary/10 transition-all group">
                   <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                   {count > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-[#82bce8]">
                    {count}
                   </span>}
                </Link>
              </div>
            )}

            {user ? (
               <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end mr-2">
                     <p className="text-[9px] text-primary/60 font-black uppercase tracking-[0.2em]">บัญชีผู้ใช้</p>
                     <p className="text-sm font-black text-primary leading-none mt-1">{user.username}</p>
                  </div>
                  {isAdmin ? (
                    <Link to="/admin" className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-glow-sm hover:brightness-110 transition-all">
                       <ShieldCheck size={20} />
                    </Link>
                  ) : (
                    <Link to="/dashboard" className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 hover:bg-primary hover:text-white transition-all">
                       <LayoutDashboard size={20} />
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-12 h-12 bg-primary/5 text-primary/40 rounded-2xl flex items-center justify-center hover:text-red-500 hover:bg-red-500/10 border border-primary/10 transition-all">
                     <LogOut size={20} />
                  </button>
               </div>
            ) : (
               <div className="flex items-center gap-4">
                  <Link to="/login" className="hidden sm:flex px-6 py-4 text-[#EE4D2D] font-black text-lg tracking-widest uppercase hover:text-primary transition-all">เข้าสู่ระบบ</Link>
                  <Link to="/register" className="bg-primary text-white sm:py-4 py-2.5 sm:px-10 px-6 sm:text-base text-sm font-black uppercase tracking-widest rounded-2xl shadow-glow-sm hover:brightness-110 transition-all whitespace-nowrap">สมัครสมาชิก</Link>
               </div>
            )}

            {/* Mobile Toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 active:scale-95 transition-all">
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
            className="lg:hidden absolute top-full inset-x-0 bg-white/95 backdrop-blur-2xl border-b border-navy/10 shadow-2xl p-6"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="py-5 px-8 bg-primary/5 rounded-3xl font-black text-primary uppercase text-xs tracking-[0.2em] hover:bg-primary/10">{l.label}</Link>
              ))}
              <div className="grid grid-cols-2 gap-4 mt-6">
                 {user ? (
                   <>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="py-5 bg-primary/10 text-primary rounded-3xl text-center font-black uppercase text-[10px] tracking-widest border border-primary/20">โปรไฟล์</Link>
                    <button onClick={handleLogout} className="py-5 bg-red-500/10 text-red-500 rounded-3xl text-center font-black uppercase text-[10px] tracking-widest border border-red-500/20">ออกจากระบบ</button>
                   </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="py-5 bg-primary/10 text-primary rounded-3xl text-center font-black uppercase text-[10px] tracking-widest border border-primary/20">เข้าสู่ระบบ</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="py-5 bg-primary text-white rounded-3xl text-center font-black uppercase text-[10px] tracking-widest shadow-glow-sm">สมัครสมาชิก</Link>
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
