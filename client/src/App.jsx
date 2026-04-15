import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import ProtectedRoute from './components/ProtectedRoute';
import { Banknote, Coins, Clock } from 'lucide-react';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Contact from './pages/Contact';
import FinancialDashboard from './pages/FinancialDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Help from './pages/Help';
import OrderSuccess from './pages/OrderSuccess';

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-white font-prompt relative overflow-x-hidden">
      {/* Global Decoration Layer (Restored Original Effects) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Money Icons */}
        <motion.div 
          animate={{ y: [0, -40, 0], x: [0, 20, 0], rotate: [0, 15, 0] }} 
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute left-[3%] top-[20%] opacity-[0.15] blur-[0.5px] hidden xl:block"
        >
          <Banknote size={170} className="text-primary drop-shadow-[0_0_35px_rgba(255,0,60,0.9)]" />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 50, 0], x: [0, -30, 0] }} 
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
          className="absolute right-[5%] top-[15%] opacity-[0.15] blur-[0.5px] hidden lg:block"
        >
          <Coins size={220} className="text-primary drop-shadow-[0_0_40px_rgba(255,0,60,0.9)]" />
        </motion.div>

        {/* Time Icon (Focus) */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} 
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute left-[40%] top-[40%] opacity-[0.15] blur-[1px]"
        >
          <Clock size={320} className="text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]" />
        </motion.div>

        <motion.div 
          animate={{ y: [0, 40, 0], x: [0, 30, 0] }} 
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 2 }}
          className="absolute left-[10%] bottom-[15%] opacity-[0.12] blur-[0.5px] hidden lg:block"
        >
          <Coins size={150} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" />
        </motion.div>

        <motion.div 
          animate={{ y: [0, -50, 0], x: [0, -30, 0] }} 
          transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 0.5 }}
          className="absolute right-[8%] bottom-[20%] opacity-[0.12] blur-[0.5px] hidden xl:block"
        >
          <Banknote size={200} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" />
        </motion.div>

        {/* Ultra Glowing orbs */}
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="absolute top-[0%] -left-[10%] w-[700px] h-[700px] bg-primary/15 rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-[0%] -right-[10%] w-[700px] h-[700px] bg-primary/12 rounded-full blur-[140px]" 
        />
      </div>

      <Navbar />
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/help" element={<Help />} />
            <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />

            {/* Protected routes */}
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute adminOnly><FinancialDashboard /></ProtectedRoute>} />


            {/* 404 */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
                <p className="text-7xl mb-4">404</p>
                <p className="text-xl text-gray-400 mb-6">ไม่พบหน้านี้</p>
                <a href="/" className="btn-primary px-8 py-3">กลับหน้าแรก</a>
              </div>
            } />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
