-- ============================================================
-- 🏎️ GB MARKETPLACE - SUPER TURBO LOGIN (SQL REFACTOR)
-- ============================================================

-- 1. สร้างดัชนีแบบพิเศษ (Functional Indexes) เพื่อการค้นหาที่เร็วที่สุด
-- สิ่งนี้จะพุ่งเป้าไปที่ข้อมูลทันทีโดยไม่ต้อง Scan ทั้งตาราง
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_real_email_lower ON public.profiles (LOWER(real_email));

-- 2. รื้อและเขียนฟังก์ชันแก้ชื่อผู้ใช้ใหม่ ให้ "คลีน" และ "ไว" ที่สุด
-- ตัดการ JOIN ตาราง Topups และการเรียงลำดับที่ซับซ้อนออกทั้งหมด
CREATE OR REPLACE FUNCTION public.resolve_auth_email(p_identifier text)
RETURNS text AS $$
DECLARE
    v_email text;
    v_clean_id text;
BEGIN
    v_clean_id := LOWER(TRIM(p_identifier));

    -- ค้นหาจาก Username ก่อน (เร็วที่สุด)
    SELECT u.email INTO v_email 
    FROM auth.users u 
    JOIN public.profiles p ON p.id = u.id 
    WHERE LOWER(p.username) = v_clean_id 
    LIMIT 1;

    -- ถ้าไม่เจอ ให้ค้นหาจาก Real Email
    IF v_email IS NULL THEN
        SELECT u.email INTO v_email 
        FROM auth.users u 
        JOIN public.profiles p ON p.id = u.id 
        WHERE LOWER(p.real_email) = v_clean_id 
        LIMIT 1;
    END IF;

    -- ส่งกลับอีเมลที่เจอ หรือส่งค่าเดิมกลับถ้าไม่เจอ (เพื่อให้ Supabase Auth จัดการต่อ)
    RETURN COALESCE(v_email, p_identifier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
