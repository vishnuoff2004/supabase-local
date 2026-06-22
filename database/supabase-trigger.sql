-- Run this in Supabase SQL Editor after migrations create the public.users table
-- Auto-creates a public.users record whenever a new auth.users record is created

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."Users" (
    name,
    email,
    password,
    phone,
    role,
    active,
    "loginAttempts",
    "lockedUntil",
    "otpCode",
    "otpExpiry",
    "isVerified",
    "supabaseUid",
    "createdAt",
    "updatedAt"
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    '',
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'traveler')::"enum_Users_role",
    true,
    0,
    NULL,
    NULL,
    NULL,
    true,
    NEW.id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    "supabaseUid" = EXCLUDED."supabaseUid",
    "updatedAt" = NOW();
  RETURN NEW;
END;
$$;

-- Drop the trigger if it already exists, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
