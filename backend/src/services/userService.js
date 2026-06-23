const { User } = require('../models');

async function getProfile(userId) {
  const { AuthUser } = require('../models');
  const user = await User.findByPk(userId, {
    include: [{ model: AuthUser, as: 'authUser' }],
  });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
}

async function updateProfile(userId, data) {
  const { AuthUser } = require('../models');
  const user = await User.findByPk(userId, {
    include: [{ model: AuthUser, as: 'authUser' }],
  });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (data.email && data.email !== user.email) {
    const err = new Error('Re-authentication required to change email');
    err.status = 403;
    throw err;
  }
  const allowedFields = ['name', 'phone'];
  const updates = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) updates[field] = data[field];
  });
  await user.update(updates);
  const { password, authUser, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
}

module.exports = { getProfile, updateProfile };
