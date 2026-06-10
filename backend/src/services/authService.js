const bcrypt = require('bcrypt');
const { User, Driver, Agency } = require('../models');
const { generateToken } = require('../utils/jwt');

async function register(data) {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    const err = new Error('Email already exists');
    err.status = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    phone: data.phone,
    role: data.role || 'traveler',
  });

  if (user.role === 'driver') {
    await Driver.create({
      userId: user.id,
      name: data.name,
      phone: data.phone,
      vehicleType: data.vehicleType || null,
      vehicleReg: data.vehicleReg || null,
      licenseNo: data.licenseNo || null,
      agencyId: data.agencyId || null,
    });
  }

  if (user.role === 'agency_admin') {
    await Agency.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      createdBy: user.id,
      adminId: user.id,
    });
  }

  const { password, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
}

async function login(email, password) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  if (!user.active) {
    const err = new Error('Account deactivated. Contact administrator');
    err.status = 403;
    throw err;
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const err = new Error('Account locked. Try again after 15 seconds');
    err.status = 429;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 1000);
    }
    await user.save();
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  user.loginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user.toJSON();
  return { token, user: userWithoutPassword };
}

module.exports = { register, login };
