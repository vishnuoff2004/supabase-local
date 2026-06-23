const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev';

function generateToken(payload, options = {}) {
  const defaultOptions = { expiresIn: '7d' };
  return jwt.sign(payload, JWT_SECRET, { ...defaultOptions, ...options });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}

module.exports = { generateToken, verifyToken, JWT_SECRET };
