const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const supabaseAdmin = require('../config/supabase');
const { User, Driver, Agency } = require('../models');
const { sendWelcomeEmail } = require('./emailService');

async function queryDB(text, params) {
  const isLocal = process.env.DATABASE_URL?.includes('127.0.0.1') || process.env.DATABASE_URL?.includes('localhost');
  const dbSsl = process.env.DB_SSL === 'true';
  const ssl = dbSsl || (process.env.DATABASE_URL && !isLocal) ? { rejectUnauthorized: false } : false;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: ssl,
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
  const { AuthUser } = require('../models');
  const authUser = await AuthUser.findOne({ where: { email: data.email } });
  if (authUser) {
    const existing = await User.findOne({ where: { supabaseUid: authUser.id } });
    if (existing && existing.isVerified) {
      throw Object.assign(new Error('Email already exists'), { status: 409 });
    }
  }

  return {
    message: 'OTP sent to your email',
    email: data.email,
    licenseDocUrl: data.licenseDocUrl || null,
    vehicleRcUrl: data.vehicleRcUrl || null,
  };
}

async function completeRegistration(data) {
  let authUser;
  let error;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await supabaseAdmin.auth.getUser(data.accessToken);
      authUser = res.data?.user;
      error = res.error;
      if (authUser && !error) break;
    } catch (err) {
      error = err;
    }
    console.warn(`getUser in completeRegistration attempt ${i + 1} failed, retrying in 2s...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (error || !authUser) {
    throw Object.assign(new Error('OTP verification failed. Please try again.'), { status: 401 });
  }

  const supabaseUid = authUser.id;
  let user = await User.findOne({
    where: { supabaseUid },
    include: [{ model: require('../models').AuthUser, as: 'authUser' }]
  });

  if (user && user.isVerified) {
    throw Object.assign(new Error('Account already verified'), { status: 409 });
  }

  if (data.password) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    try {
      await setAuthUserPassword(supabaseUid, passwordHash);
    } catch (sqlErr) {
      console.error('Failed to set auth user password:', sqlErr.message);
      throw Object.assign(new Error('Failed to set auth user password. Please check backend logs or database connection.'), { status: 500 });
    }
  }

  if (!user) {
    user = await User.create({
      name: data.name,
      phone: data.phone,
      role: data.role || 'traveler',
      isVerified: true,
      active: true,
      supabaseUid: supabaseUid,
    });
  } else {
    user.name = data.name;
    user.phone = data.phone;
    user.role = data.role || 'traveler';
    user.isVerified = true;
    user.active = true;
    await user.save();
  }

  // Refetch user with authUser included to make sure email is available for email services
  user = await User.findByPk(user.id, {
    include: [{ model: require('../models').AuthUser, as: 'authUser' }]
  });

  sendWelcomeEmail(authUser.email || data.email, user.name).catch(err =>
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
        email: authUser.email || data.email,
        phone: user.phone,
        createdBy: user.id,
        adminId: user.id,
      });
    }
  }

  return { message: 'Registration complete. You can now sign in.' };
}

async function getMe(userId) {
  const { AuthUser } = require('../models');
  const user = await User.findByPk(userId, {
    include: [{ model: AuthUser, as: 'authUser' }]
  });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return sanitizeUser(user);
}

async function setupRole(userId, data) {
  const { AuthUser } = require('../models');
  const user = await User.findByPk(userId, {
    include: [{ model: AuthUser, as: 'authUser' }]
  });
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
  const { password, otpCode, otpExpiry, loginAttempts, lockedUntil, authUser, ...rest } = user.toJSON();
  return rest;
}

async function oauthSetup(data) {
  let authUser;
  let error;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await supabaseAdmin.auth.getUser(data.accessToken);
      authUser = res.data?.user;
      error = res.error;
      if (authUser && !error) break;
    } catch (err) {
      error = err;
    }
    console.warn(`getUser in oauthSetup attempt ${i + 1} failed, retrying in 2s...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (error || !authUser) {
    throw Object.assign(new Error('Invalid session. Please sign in again.'), { status: 401 });
  }

  const email = authUser.email;
  if (!email) {
    throw Object.assign(new Error('No email found from OAuth provider.'), { status: 400 });
  }

  const { AuthUser } = require('../models');
  let user = await User.findOne({
    where: { supabaseUid: authUser.id },
    include: [{ model: AuthUser, as: 'authUser' }]
  });

  if (!user) {
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : '';

    user = await User.create({
      name: data.name || authUser.user_metadata?.name || email.split('@')[0],
      phone: data.phone || authUser.user_metadata?.phone || '',
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
        throw Object.assign(new Error('Failed to set auth user password. Please check backend logs or database connection.'), { status: 500 });
      }
    }

    // Refetch with authUser association included
    user = await User.findByPk(user.id, {
      include: [{ model: AuthUser, as: 'authUser' }]
    });

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
      try {
        await setAuthUserPassword(authUser.id, passwordHash);
      } catch (sqlErr) {
        console.error('Failed to set auth user password:', sqlErr.message);
        throw Object.assign(new Error('Failed to set auth user password. Please check backend logs or database connection.'), { status: 500 });
      }
    }
    await user.save();
    
    // Refetch to get current email
    user = await User.findByPk(user.id, {
      include: [{ model: AuthUser, as: 'authUser' }]
    });
  }

  return { message: 'Profile setup complete', user: sanitizeUser(user) };
}

async function login(email, password) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  const { AuthUser } = require('../models');
  const dbUser = await User.findOne({
    where: { supabaseUid: data.user.id },
    include: [{ model: AuthUser, as: 'authUser' }],
  });

  if (!dbUser) {
    throw Object.assign(new Error('User profile not found'), { status: 404 });
  }
  if (!dbUser.active) {
    throw Object.assign(new Error('Account deactivated. Contact administrator'), { status: 403 });
  }

  return {
    token: data.session.access_token,
    user: sanitizeUser(dbUser),
  };
}

module.exports = { register, login, completeRegistration, getMe, setupRole, oauthSetup };
