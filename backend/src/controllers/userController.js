const userService = require('../services/userService');

async function getProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.user.id);
    // TEST-106 (REQ-032): never expose password or passwordHash in API response
    const { password, passwordHash, ...safeUser } = (typeof user.toJSON === 'function' ? user.toJSON() : user);
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { phone } = req.body;
    if (phone !== undefined && !/^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ message: err.message });
    }
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
