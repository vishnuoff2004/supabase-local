const supabaseAdmin = require('../config/supabase');
const { User } = require('../models');
const { verifyToken } = require('../utils/jwt');

/**
 * In test mode (NODE_ENV=test) we verify the socket token locally with JWT_SECRET.
 * In production the token is verified against the Supabase Auth service.
 */
function authenticateSocket(allowedRoles) {
  return async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        const err = new Error('Authentication required');
        err.data = { code: 4001, message: 'Authentication required' };
        return next(err);
      }

      if (process.env.NODE_ENV === 'test') {
        // Test mode: verify JWT locally
        let decoded;
        try {
          decoded = verifyToken(token);
        } catch {
          const err = new Error('Invalid or expired token');
          err.data = { code: 4001, message: 'Invalid or expired token' };
          return next(err);
        }

        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
          const err = new Error('Forbidden: insufficient role');
          err.data = { code: 4003, message: 'Forbidden: insufficient role' };
          return next(err);
        }

        socket.user = { id: decoded.id, role: decoded.role, supabaseUid: null };
        return next();
      }

      // Production mode: verify against Supabase Auth
      const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !authUser) {
        const err = new Error('Invalid or expired token');
        err.data = { code: 4001, message: 'Invalid or expired token' };
        return next(err);
      }

      const dbUser = await User.findOne({ where: { supabaseUid: authUser.id } });
      if (!dbUser || !dbUser.active) {
        const err = new Error('Forbidden: insufficient role');
        err.data = { code: 4003, message: 'Forbidden: insufficient role' };
        return next(err);
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(dbUser.role)) {
        const err = new Error('Forbidden: insufficient role');
        err.data = { code: 4003, message: 'Forbidden: insufficient role' };
        return next(err);
      }

      socket.user = { id: dbUser.id, role: dbUser.role, supabaseUid: authUser.id };
      next();
    } catch (err) {
      const error = new Error('Authentication failed');
      error.data = { code: 4001, message: 'Authentication failed: ' + err.message };
      next(error);
    }
  };
}

module.exports = { authenticateSocket };
