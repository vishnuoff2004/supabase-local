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
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '',
    'traveler',
    true,
    0,
    NULL,
    NULL,
    NULL,
    false,
    NEW.id,
    NOW(),
    NOW()
  )
  ON CONFLICT ("supabaseUid") DO UPDATE SET
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
