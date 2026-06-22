const supabaseAdmin = require('../config/supabase');
const { User } = require('../models');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !authUser) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const dbUser = await User.findOne({ where: { supabaseUid: authUser.id } });
    if (!dbUser) {
      return res.status(403).json({ message: 'User profile not found' });
    }
    if (!dbUser.active) {
      return res.status(403).json({ message: 'Account deactivated. Contact administrator' });
    }

    req.user = { id: dbUser.id, role: dbUser.role, supabaseUid: authUser.id, name: dbUser.name };
    req.authUser = authUser;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Authentication failed: ' + err.message });
  }
}

async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && authUser) {
        const dbUser = await User.findOne({ where: { supabaseUid: authUser.id } });
        if (dbUser && dbUser.active) {
          req.user = { id: dbUser.id, role: dbUser.role, supabaseUid: authUser.id, name: dbUser.name };
          req.authUser = authUser;
        }
      }
    } catch {
      // Invalid token — proceed without user
    }
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate };
