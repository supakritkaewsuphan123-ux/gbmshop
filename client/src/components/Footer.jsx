import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-24">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="text-2xl font-black text-slate-900 mb-2">
          GB<span className="text-primary">shop</span>
        </div>
        <p className="text-slate-500 text-sm mb-4">ตลาดซื้อขายสินค้าพรีเมียม ปลอดภัย มั่นใจ 100%</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600 mb-6 font-medium">
          <Link to="/" className="hover:text-primary transition-colors">หน้าแรก</Link>
          <Link to="/products" className="hover:text-primary transition-colors">ตลาดสินค้า</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">ติดต่อเรา</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">ข้อตกลงการใช้งาน</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">นโยบายความเป็นส่วนตัว</Link>
        </div>
        <p className="text-slate-400 text-xs">© 2026 GBshop Marketplace • สงวนลิขสิทธิ์ทั้งหมด</p>
      </div>
    </footer>
  );
}
