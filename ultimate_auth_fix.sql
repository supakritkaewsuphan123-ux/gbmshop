-- ============================================================
-- 🚑 GB MARKETPLACE - THE ULTIMATE AUTH & REGISTRATION FIX
-- ============================================================

-- 1. ล้างบัญชีเก่าที่อาจค้างอยู่ในระบบ (เพื่อให้สมัครชื่อเดิมได้)
-- หากคุณพยายามสมัคร admingbmoney แล้วไม่ผ่าน ข้อมูลชื่ออาจจะไปค้างอยู่ในตาราง Profiles
-- เราจะลบชื่อที่ไม่มีบัญชี Auth จริงๆ ออกให้หมด
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. ซ่อมฟังก์ชันตัวบันทึก (Trigger) ให้ดึงข้อมูลได้แม่นยำ 100%
-- เปลี่ยนมาดึง Email จากระบบหลักของ Supabase ตรงๆ (NEW.email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, real_email, role, balance)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username', 
    new.raw_user_meta_data->>'avatar_url', 
    new.email, -- ✅ ใช้ข้อมูลอีเมลจากจุดที่ถูกต้องที่สุด
    'user',
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. รีเซ็ตระบบค้นหาให้กลับมาเรียบง่ายและเสถียร
CREATE OR REPLACE FUNCTION public.resolve_auth_email(p_identifier text)
RETURNS text AS $$
DECLARE
    v_email text;
    v_clean_id text;
BEGIN
    v_clean_id := LOWER(TRIM(p_identifier));

    -- ค้นหาตรงๆ จากตาราง Profiles (Fast Path)
    SELECT real_email INTO v_email 
    FROM public.profiles 
    WHERE LOWER(username) = v_clean_id 
       OR LOWER(real_email) = v_clean_id
    LIMIT 1;

    RETURN COALESCE(v_email, p_identifier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ตั้งค่าระดับความเข้มงวดให้เรียบร้อย
NOTIFY pgrst, 'reload schema';
