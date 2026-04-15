import { useEffect } from 'react';

/**
 * ✅ Hook สำหรับจัดการ Metadata ของแต่ละหน้า (SEO)
 * @param {string} title - ชื่อหน้า
 * @param {string} description - คำอธิบายหน้า
 */
export function usePageMetadata(title, description) {
  useEffect(() => {
    // อัปเดต Title
    const baseTitle = 'GB Marketplace';
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;

    // อัปเดต Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description || 'ตลาดซื้อขายเงินและสินค้าในเกมที่ปลอดภัยที่สุด พร้อมระบบ Wallet และการันตีจากแอดมิน 100%';

    // อัปเดต Open Graph (Facebook/Line)
    const updateOG = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateOG('og:title', title ? `${title} | ${baseTitle}` : baseTitle);
    updateOG('og:description', description || 'ตลาดซื้อขายสินค้าพรีเมียม ปลอดภัย มั่นใจ 100%');
    
  }, [title, description]);
}
