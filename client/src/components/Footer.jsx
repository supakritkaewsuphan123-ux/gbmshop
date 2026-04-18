import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-50 py-20 mt-32">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="flex flex-col items-center mb-10">
           <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mb-6 border border-slate-50 shadow-sm">
              <Globe size={24} />
           </div>
           <div className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">
             GB<span className="text-slate-400">shop</span>
           </div>
           <p className="text-slate-400 font-bold text-sm tracking-tight">Experience premium marketplace at its finest.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-10">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <Link to="/products" className="hover:text-slate-900 transition-colors">Marketplace</Link>
          <Link to="/help" className="hover:text-slate-900 transition-colors">Help Center</Link>
          <Link to="/terms" className="hover:text-slate-900 transition-colors">Legal Terms</Link>
          <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
        </div>
        
        <div className="pt-10 border-t border-slate-50">
           <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">© 2026 GBshop Marketplace • All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
}
