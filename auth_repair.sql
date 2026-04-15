-- ============================================================
-- 🛠️ GB MARKETPLACE - EMERGENCY AUTH REPAIR & DATA SYNC
-- ============================================================

-- 1. ซ่อมแซม Trigger (กู้คืนการทำงานที่ถูกต้อง)
-- แก้ให้ดึง NEW.email มาเก็บที่ real_email โดยตรง
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, real_email, role, balance)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username', 
    new.raw_user_meta_data->>'avatar_url', 
    new.email, -- ✅ แก้จาก Metadata เป็น NEW.email (ตัวจริง)
    'user',
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ⚡ DATA MASS SYNC (กู้คืนอีเมลที่หายไปสำหรับสมาชิกเก่า)
-- ดึงอีเมลจากระบบ Auth ของ Supabase มาเติมในตาราง Profiles ให้ครบทุกคน
UPDATE public.profiles p
SET real_email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.real_email IS NULL OR p.real_email = '');

-- 3. ปรับจูนระบบค้นหาให้ฉลาดและเสถียรร้อยเปอร์เซ็นต์
CREATE OR REPLACE FUNCTION public.resolve_auth_email(p_identifier text)
RETURNS text AS $$
DECLARE
    v_email text;
    v_clean_id text;
BEGIN
    v_clean_id := LOWER(TRIM(p_identifier));

    -- ค้นหาตรงๆ จากตาราง Profiles (จบในตัว ไม่ต้อง Join)
    SELECT real_email INTO v_email 
    FROM public.profiles 
    WHERE LOWER(username) = v_clean_id 
       OR LOWER(real_email) = v_clean_id
    LIMIT 1;

    -- คืนค่าอีเมลที่เจอ หรือคืนค่าเดิมถ้าเป็น Email อยู่แล้ว
    RETURN COALESCE(v_email, p_identifier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
