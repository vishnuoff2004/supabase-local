const supabaseAdmin = require('../config/supabase');
const { User } = require('../models');
const { verifyToken } = require('../utils/jwt');

/**
 * In test mode (NODE_ENV=test) we verify the token locally with JWT_SECRET
 * and use the token payload directly — no DB or Supabase lookup needed.
 * In production the token is verified against the Supabase Auth service.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (process.env.NODE_ENV === 'test') {
      // Test mode: verify JWT locally and use payload directly
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (err) {
        return res.status(401).json({ message: err.message });
      }
      req.user = { id: decoded.id, role: decoded.role, supabaseUid: decoded.supabaseUid || null, name: decoded.name || null };
      req.authUser = { id: decoded.supabaseUid || null, email: decoded.email || null };
      return next();
    }

    // Production mode: verify against live Supabase Auth
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !authUser) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const dbUser = await User.findOne({ where: { supabaseUid: authUser.id } });
    if (!dbUser) {
      return res.status(403).json({ message: 'User profile not found' });
    }
    if (!dbUser.active && dbUser.isVerified) {
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
      if (process.env.NODE_ENV === 'test') {
        const decoded = verifyToken(token);
        req.user = { id: decoded.id, role: decoded.role, supabaseUid: decoded.supabaseUid || null, name: decoded.name || null };
        req.authUser = { id: decoded.supabaseUid || null, email: decoded.email || null };
      } else {
        const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && authUser) {
          const dbUser = await User.findOne({ where: { supabaseUid: authUser.id } });
          if (dbUser && dbUser.active) {
            req.user = { id: dbUser.id, role: dbUser.role, supabaseUid: authUser.id, name: dbUser.name };
            req.authUser = authUser;
          }
        }
      }
    } catch {
      // Invalid token — proceed without user
    }
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate };
