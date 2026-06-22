const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const supabaseAdmin = require('../config/supabase');
const { User, Driver, Agency } = require('../models');
const { sendWelcomeEmail } = require('./emailService');

async function queryDB(text, params) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await client.query(text, params);
  } finally {
    await client.end();
  }
}

async function setAuthUserPassword(authUserId, passwordHash) {
  await queryDB(
    `UPDATE auth.users SET encrypted_password = $1, email_confirmed_at = NOW(), updated_at = NOW() WHERE id = $2`,
    [passwordHash, authUserId]
  );
}

async function register(data) {
  let existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    if (existing.supabaseUid && existing.isVerified) {
      throw Object.assign(new Error('Email already exists'), { status: 409 });
    }
    existing.name = data.name;
    existing.phone = data.phone;
    existing.role = data.role || 'traveler';
    existing.password = await bcrypt.hash(data.password, 10);
    existing.active = false;
    existing.otpCode = null;
    existing.otpExpiry = null;
    await existing.save();
  } else {
    await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: await bcrypt.hash(data.password, 10),
      role: data.role || 'traveler',
      isVerified: false,
      active: false,
    });
  }

  return { message: 'OTP sent to your email', email: data.email };
}

async function completeRegistration(data) {
  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(data.accessToken);
  if (error || !authUser) {
    throw Object.assign(new Error('OTP verification failed. Please try again.'), { status: 401 });
  }

  const user = await User.findOne({ where: { email: data.email } });
  if (!user) {
    throw Object.assign(new Error('Registration not found. Please start again.'), { status: 404 });
  }
  if (user.isVerified && user.supabaseUid) {
    throw Object.assign(new Error('Account already verified'), { status: 409 });
  }

  const supabaseUid = authUser.id;
  if (user.password) {
    try {
      await setAuthUserPassword(supabaseUid, user.password);
    } catch (sqlErr) {
      console.error('Failed to set auth user password:', sqlErr.message);
    }
  }

  user.isVerified = true;
  user.active = true;
  user.supabaseUid = supabaseUid;
  user.otpCode = null;
  user.otpExpiry = null;
  await user.save();

  sendWelcomeEmail(data.email, user.name).catch(err =>
    console.warn('Welcome email not sent:', err.message)
  );

  if (user.role === 'driver') {
    const existingDriver = await Driver.findOne({ where: { userId: user.id } });
    if (!existingDriver) {
      await Driver.create({
        userId: user.id,
        name: user.name,
        phone: user.phone,
        vehicleType: data.vehicleType || null,
        vehicleReg: data.vehicleReg || null,
        licenseNo: data.licenseNo || null,
        licenseDocUrl: data.licenseDocUrl || null,
        vehicleRcUrl: data.vehicleRcUrl || null,
        agencyId: null,
      });
    }

    if (data.agencyId) {
      const agencyRequestService = require('./agencyRequestService');
      try {
        await agencyRequestService.sendJoinRequest(user.id, data.agencyId);
      } catch (err) {
        console.error('Failed to auto-send join request:', err.message);
      }
    }
  }

  if (user.role === 'agency_admin') {
    const existingAgency = await Agency.findOne({ where: { adminId: user.id } });
    if (!existingAgency) {
      await Agency.create({
        name: data.agencyName || user.name,
        email: user.email,
        phone: user.phone,
        createdBy: user.id,
        adminId: user.id,
      });
    }
  }

  return { message: 'Registration complete. You can now sign in.' };
}

async function getMe(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return sanitizeUser(user);
}

async function setupRole(userId, data) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (data.name) user.name = data.name;
  if (data.phone) user.phone = data.phone;
  if (data.role) user.role = data.role;
  await user.save();

  if (user.role === 'driver') {
    const existing = await Driver.findOne({ where: { userId: user.id } });
    if (!existing) {
      await Driver.create({
        userId: user.id,
        name: user.name,
        phone: user.phone,
        vehicleType: data.vehicleType || null,
        vehicleReg: data.vehicleReg || null,
        licenseNo: data.licenseNo || null,
        licenseDocUrl: data.licenseDocUrl || null,
        vehicleRcUrl: data.vehicleRcUrl || null,
        agencyId: null,
      });
    }
  }

  if (user.role === 'agency_admin') {
    const existing = await Agency.findOne({ where: { adminId: user.id } });
    if (!existing) {
      await Agency.create({
        name: data.agencyName || user.name,
        email: user.email,
        phone: user.phone,
        createdBy: user.id,
        adminId: user.id,
      });
    }
  }

  return { message: 'Profile setup complete', user: sanitizeUser(user) };
}

function sanitizeUser(user) {
  const { password, otpCode, otpExpiry, loginAttempts, lockedUntil, ...rest } = user.toJSON();
  return rest;
}

async function oauthSetup(data) {
  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(data.accessToken);
  if (error || !authUser) {
    throw Object.assign(new Error('Invalid session. Please sign in again.'), { status: 401 });
  }

  const email = authUser.email;
  if (!email) {
    throw Object.assign(new Error('No email found from OAuth provider.'), { status: 400 });
  }

  let user = await User.findOne({ where: { email } });

  if (!user) {
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : '';

    user = await User.create({
      name: data.name || authUser.user_metadata?.name || email.split('@')[0],
      email,
      phone: data.phone || authUser.user_metadata?.phone || '',
      password: passwordHash,
      role: data.role || 'traveler',
      supabaseUid: authUser.id,
      isVerified: true,
      active: true,
    });

    if (passwordHash) {
      try {
        await setAuthUserPassword(authUser.id, passwordHash);
      } catch (sqlErr) {
        console.error('Failed to set auth user password:', sqlErr.message);
      }
    }

    if (user.role === 'driver') {
      const existingDriver = await Driver.findOne({ where: { userId: user.id } });
      if (!existingDriver) {
        await Driver.create({
          userId: user.id,
          name: user.name,
          phone: user.phone,
          vehicleType: data.vehicleType || null,
          vehicleReg: data.vehicleReg || null,
          licenseNo: data.licenseNo || null,
          licenseDocUrl: data.licenseDocUrl || null,
          vehicleRcUrl: data.vehicleRcUrl || null,
          agencyId: data.agencyId || null,
        });
      }
    }

    if (user.role === 'agency_admin') {
      const existingAgency = await Agency.findOne({ where: { adminId: user.id } });
      if (!existingAgency) {
        await Agency.create({
          name: data.agencyName || user.name,
          email: user.email,
          phone: user.phone,
          createdBy: user.id,
          adminId: user.id,
        });
      }
    }

    sendWelcomeEmail(email, user.name).catch(err =>
      console.warn('Welcome email not sent:', err.message)
    );
  } else {
    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
    if (data.role) user.role = data.role;
    user.supabaseUid = authUser.id;
    user.isVerified = true;
    user.active = true;
    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      user.password = passwordHash;
      try {
        await setAuthUserPassword(authUser.id, passwordHash);
      } catch (sqlErr) {
        console.error('Failed to set auth user password:', sqlErr.message);
      }
    }
    await user.save();
  }

  return { message: 'Profile setup complete', user: sanitizeUser(user) };
}

module.exports = { register, completeRegistration, getMe, setupRole, oauthSetup };
