'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop unique email constraint if it exists
    await queryInterface.sequelize.query(`
      ALTER TABLE public."Users" DROP CONSTRAINT IF EXISTS "Users_email_key";
    `);
    
    // Drop columns email and password
    await queryInterface.sequelize.query(`
      ALTER TABLE public."Users" DROP COLUMN IF EXISTS email;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE public."Users" DROP COLUMN IF EXISTS password;
    `);

    // Update handle_new_user trigger function
    await queryInterface.sequelize.query(`
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
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Add columns email and password back
    await queryInterface.addColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Re-create the original handle_new_user trigger function
    await queryInterface.sequelize.query(`
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
    `);
  }
};
