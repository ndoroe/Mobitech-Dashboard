const logger = require('../utils/logger');
const { promisePool } = require('../config/database');
const {
  hashPassword,
  verifyPassword,
  generateJWT,
  generateVerificationToken,
  getVerificationExpiry,
  validatePassword,
  validateEmail,
  validateUsername
} = require('../utils/authHelpers');
const {
  sendVerificationEmail,
  sendAdminNotification,
  sendPasswordResetEmail
} = require('../utils/emailService');

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validate input
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: usernameValidation.message
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Check if email already exists
    const [existingEmail] = await promisePool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    // Check if username already exists
    const [existingUsername] = await promisePool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken.'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = getVerificationExpiry();

    // Check if this is the first user (becomes admin automatically)
    const [userCount] = await promisePool.query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = userCount[0].count === 0;

    const role = isFirstUser ? 'admin' : 'user';
    const status = isFirstUser ? 'active' : 'pending_verification';

    // Insert user
    const [result] = await promisePool.query(
      `INSERT INTO users (username, email, password_hash, role, status, verification_token, verification_expires)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, role, status, verificationToken, verificationExpires]
    );

    if (isFirstUser) {
      // First user is admin and active - return token immediately
      const user = {
        id: result.insertId,
        username,
        email,
        role,
        status
      };

      const token = generateJWT(user);

      return res.status(201).json({
        success: true,
        message: 'Admin account created successfully! You can log in now.',
        isFirstUser: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    }

    // Send verification email for regular users
    await sendVerificationEmail(email, verificationToken, username);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      email
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration.',
      error: error.message
    });
  }
}

/**
 * Verify email address
 * GET /api/auth/verify-email/:token
 */
async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.'
      });
    }

    // Find user with this token
    const [users] = await promisePool.query(
      'SELECT id, username, email, verification_token, verification_expires, status FROM users WHERE verification_token = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token.'
      });
    }

    const user = users[0];

    // Check if already verified
    if (user.status !== 'pending_verification') {
      return res.status(400).json({
        success: false,
        message: 'Email already verified or account inactive.'
      });
    }

    // Check if token expired
    if (new Date() > new Date(user.verification_expires)) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new one.',
        expired: true
      });
    }

    // Update user status to pending_approval
    await promisePool.query(
      'UPDATE users SET status = ?, verification_token = NULL, verification_expires = NULL WHERE id = ?',
      ['pending_approval', user.id]
    );

    // Notify all admins
    const [admins] = await promisePool.query(
      'SELECT id, email FROM users WHERE role = ? AND status = ?',
      ['admin', 'active']
    );

    // Send email notifications to all admins
    const emailPromises = admins.map(admin => 
      sendAdminNotification(admin.email, user.email, user.username)
        .catch(err => logger.error(`Failed to send email to admin ${admin.email}:`, err))
    );

    // Create in-app notifications for all admins
    const notificationPromises = admins.map(admin =>
      promisePool.query(
        `INSERT INTO admin_notifications (admin_id, user_id, type, message)
         VALUES (?, ?, ?, ?)`,
        [
          admin.id,
          user.id,
          'new_registration',
          `New user ${user.username} (${user.email}) has verified their email and is awaiting approval.`
        ]
      ).catch(err => logger.error(`Failed to create notification for admin ${admin.id}:`, err))
    );

    // Wait for all notifications to be sent (but don't fail if some fail)
    await Promise.allSettled([...emailPromises, ...notificationPromises]);

    res.json({
      success: true,
      message: 'Email verified successfully! Your account is now pending admin approval.'
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during email verification.',
      error: error.message
    });
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    // Find user by username or email
    const [users] = await promisePool.query(
      'SELECT id, username, email, password_hash, role, status FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Check user status
    if (user.status !== 'active') {
      let message = 'Account is not active.';
      
      switch (user.status) {
        case 'pending_verification':
          message = 'Please verify your email address before logging in. Check your inbox for the verification link.';
          break;
        case 'pending_approval':
          message = 'Your account is pending admin approval. You will receive an email once approved.';
          break;
        case 'rejected':
          message = 'Your account registration has been rejected. Please contact an administrator for more information.';
          break;
      }

      return res.status(403).json({
        success: false,
        message,
        status: user.status
      });
    }

    // Generate JWT token
    const token = generateJWT({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login.',
      error: error.message
    });
  }
}

/**
 * Logout user
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    // JWT is stateless, so logout is handled client-side by removing token
    // This endpoint is here for symmetry and future token blacklisting if needed
    res.json({
      success: true,
      message: 'Logout successful.'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout.',
      error: error.message
    });
  }
}

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
async function resendVerification(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    // Find user
    const [users] = await promisePool.query(
      'SELECT id, username, email, status FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email is registered and unverified, a new verification link has been sent.'
      });
    }

    const user = users[0];

    // Only resend if status is pending_verification
    if (user.status !== 'pending_verification') {
      return res.json({
        success: true,
        message: 'If the email is registered and unverified, a new verification link has been sent.'
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = getVerificationExpiry();

    // Update user
    await promisePool.query(
      'UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?',
      [verificationToken, verificationExpires, user.id]
    );

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.username);

    res.json({
      success: true,
      message: 'Verification email sent successfully.'
    });

  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resending verification email.',
      error: error.message
    });
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  try {
    // req.user is attached by authenticateToken middleware
    const [users] = await promisePool.query(
      'SELECT id, username, email, role, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user data.',
      error: error.message
    });
  }
}

/**
 * Forgot password - Send reset link
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    // Find user
    const [users] = await promisePool.query(
      'SELECT id, username, email, status FROM users WHERE email = ?',
      [email]
    );

    // Don't reveal if email exists or not for security
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    const user = users[0];

    // Only allow password reset for active or rejected users
    if (user.status === 'pending_verification' || user.status === 'pending_approval') {
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = generateVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Update user with reset token
    await promisePool.query(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken, user.username);

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.',
      error: error.message
    });
  }
}

/**
 * Reset password with token
 * POST /api/auth/reset-password/:token
 */
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required.'
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmation are required.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Find user with this reset token
    const [users] = await promisePool.query(
      'SELECT id, username, email, password_reset_token, password_reset_expires FROM users WHERE password_reset_token = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    const user = users[0];

    // Check if token expired
    if (new Date() > new Date(user.password_reset_expires)) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please request a new password reset.',
        expired: true
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(password);

    // Update password and clear reset token
    await promisePool.query(
      'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [newPasswordHash, user.id]
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting password.',
      error: error.message
    });
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  resendVerification,
  getCurrentUser,
  forgotPassword,
  resetPassword
};
