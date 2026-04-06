import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border py-10 mt-16">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="text-2xl font-bold text-white mb-2">
          GB<span className="text-primary">money</span>
        </div>
        <p className="text-gray-500 text-sm mb-4">ตลาดซื้อขายสินค้ามือสองพรีเมียม</p>
        <div className="flex justify-center gap-6 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">หน้าแรก</Link>
          <Link to="/products" className="hover:text-primary transition-colors">ตลาดสินค้า</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">ติดต่อเรา</Link>
        </div>
        <p className="text-gray-600 text-xs">© 2026 GB MoneyShop สงวนลิขสิทธิ์ทั้งหมด</p>
      </div>
    </footer>
  );
}
