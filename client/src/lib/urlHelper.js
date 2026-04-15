/**
 * Utility to resolve image URLs from Supabase Storage or Local fallback.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const getImageUrl = (path, bucket = 'product-images') => {
  if (!path || path === 'default_product.png' || path === 'default_avatar.png') {
    return '/assets/default_product.png';
  }

  // If already a full URL
  if (path.startsWith('http')) return path;

  // LEGACY SUPPORT: If it looks like a local Multer file (e.g. image-1234.jpg)
  // Our new Supabase filenames are just timestamp-random.ext
  if (path.includes('images-') || path.includes('slip_image-') || path.includes('qr_image-')) {
    return `http://localhost:3000/uploads/${path}`;
  }
  
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
};

export const getStorageUrl = (path, bucket) => getImageUrl(path, bucket);
