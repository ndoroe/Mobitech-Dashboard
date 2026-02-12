const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Hash a plain text password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a plain text password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id, email, username, role
 * @returns {string} JWT token
 */
function generateJWT(user) {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status
  };

  const secret = process.env.JWT_SECRET || 'sim_dashboard_secret_key_dev_only';
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyJWT(token) {
  try {
    const secret = process.env.JWT_SECRET || 'sim_dashboard_secret_key_dev_only';
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

/**
 * Generate a random URL-safe verification token
 * @returns {string} Random token
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate expiration time for verification token (24 hours from now)
 * @returns {Date} Expiration date
 */
function getVerificationExpiry() {
  const now = new Date();
  now.setHours(now.getHours() + 24);
  return now;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, message: string }
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long'
    };
  }
  return { valid: true, message: 'Password is valid' };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {Object} { valid: boolean, message: string }
 */
function validateUsername(username) {
  if (!username || username.length < 3) {
    return {
      valid: false,
      message: 'Username must be at least 3 characters long'
    };
  }
  if (username.length > 50) {
    return {
      valid: false,
      message: 'Username must not exceed 50 characters'
    };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      message: 'Username can only contain letters, numbers, hyphens, and underscores'
    };
  }
  return { valid: true, message: 'Username is valid' };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  generateVerificationToken,
  getVerificationExpiry,
  validatePassword,
  validateEmail,
  validateUsername
};
