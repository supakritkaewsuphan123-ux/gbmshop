import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, LayoutDashboard, LogOut, LogIn, UserPlus, ShieldCheck, Menu, X } from 'lucide-react';
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
    showToast('ออกจากระบบเรียบร้อย', 'success');
    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'หน้าแรก' },
    { to: '/products', label: 'ตลาดสินค้า' },
    { to: '/help', label: 'ศูนย์ช่วยเหลือ' },
    { to: '/contact', label: 'ติดต่อเรา' },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0c]/95 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-primary/10'
          : 'bg-[#0f0f0f] border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-3 items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 font-bold text-2xl text-white hover:opacity-90 transition-opacity">
            GB<span className="text-primary">money</span>
          </Link>

          {/* Center nav links — desktop */}
          <div className="hidden md:flex items-center justify-center gap-8">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `nav-link text-base ${isActive ? 'text-primary after:w-full' : ''}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center justify-end gap-3 flex-nowrap min-w-fit">
            {/* Notification Bell */}
            {user && <NotificationBell />}
            
            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-white transition-colors group">
              <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                >
                  {count}
                </motion.span>
              )}
            </Link>

            {user ? (
              <>
                <span className="text-gray-400 text-sm">
                  สวัสดี, <span className="text-primary font-semibold">{user.username}</span>
                </span>
                {isAdmin ? (
                  <Link to="/admin" className="btn-outline py-2 px-4 text-sm flex items-center gap-1.5 whitespace-nowrap">
                    <ShieldCheck size={15} /> แอดมิน
                  </Link>
                ) : (
                  <Link to="/dashboard" className="btn-outline py-2 px-4 text-sm flex items-center gap-1.5 whitespace-nowrap">
                    <LayoutDashboard size={15} /> เช็คเงินใน wallet
                  </Link>
                )}
                <button onClick={handleLogout} className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5 whitespace-nowrap">
                  <LogOut size={15} /> ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm flex items-center gap-1.5">
                  <LogIn size={15} /> เข้าสู่ระบบ
                </Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
                  <UserPlus size={15} /> สมัครสมาชิก
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden justify-end">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-white p-2">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-surface border-t border-border"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `py-2 px-3 rounded-lg font-medium transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:text-white'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="border-t border-border pt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between px-3">
                  <Link to="/cart" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-2 text-gray-300 hover:text-white">
                    <ShoppingCart size={18} /> ตะกร้าสินค้า {count > 0 && <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{count}</span>}
                  </Link>
                  {user && <NotificationBell />}
                </div>
                {user ? (
                  <>
                    {isAdmin ? (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="btn-outline py-2 text-center text-sm">แผงแอดมิน</Link>
                    ) : (
                      <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="btn-outline py-2 text-center text-sm">เช็คเงินใน wallet</Link>
                    )}
                    <button onClick={handleLogout} className="btn-primary py-2 text-sm">ออกจากระบบ</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-ghost py-2 text-center text-sm">เข้าสู่ระบบ</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary py-2 text-center text-sm">สมัครสมาชิก</Link>
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
