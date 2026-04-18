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
    <div className="min-h-screen flex flex-col bg-transparent text-[#EE4D2D] font-prompt relative overflow-x-hidden">
      {/* Global Decoration Layer (Optimized for Light Theme) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Money Icons - Subtle Blue Accents */}
        <motion.div 
          animate={{ y: [0, -40, 0], x: [0, 20, 0], rotate: [0, 15, 0] }} 
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute left-[3%] top-[20%] opacity-[0.05] blur-[0.5px] hidden xl:block"
        >
          <Banknote size={170} className="text-primary" />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 50, 0], x: [0, -30, 0] }} 
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
          className="absolute right-[5%] top-[15%] opacity-[0.05] blur-[0.5px] hidden lg:block"
        >
          <Coins size={220} className="text-primary" />
        </motion.div>

        {/* Ultra Subtle Glowing orbs for Orange Depth */}
        <motion.div 
          animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute top-[0%] -left-[10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-[0%] -right-[10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px]" 
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
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute adminOnly><FinancialDashboard /></ProtectedRoute>} />


            {/* 404 */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-primary">
                <p className="text-7xl font-black mb-4">404</p>
                <p className="text-xl font-bold mb-6">ไม่พบหน้านี้</p>
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
