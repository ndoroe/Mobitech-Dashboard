const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email service error:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send email verification link to new user
 * @param {string} email - User email
 * @param {string} token - Verification token
 * @param {string} username - Username
 */
async function sendVerificationEmail(email, token, username) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
  
  const subject = 'Verify Your Email Address';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to SIM Dashboard!</h1>
        </div>
        <div class="content">
          <p>Hello ${username},</p>
          <p>Thank you for registering with SIM Dashboard. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #1976d2;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>Once verified, your account will be pending admin approval before you can access the system.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SIM Dashboard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
}

/**
 * Send notification to all admins about new user registration
 * @param {string} adminEmail - Admin email address
 * @param {string} newUserEmail - New user's email
 * @param {string} newUsername - New user's username
 */
async function sendAdminNotification(adminEmail, newUserEmail, newUsername) {
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/users`;
  
  const subject = 'New User Registration Pending Approval';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ed6c02; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .user-info { background-color: white; padding: 15px; border-left: 4px solid #ed6c02; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background-color: #ed6c02; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New User Registration</h1>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          <p>A new user has completed email verification and is awaiting approval to access the SIM Dashboard:</p>
          <div class="user-info">
            <p><strong>Username:</strong> ${newUsername}</p>
            <p><strong>Email:</strong> ${newUserEmail}</p>
            <p><strong>Status:</strong> Pending Approval</p>
          </div>
          <p>Please review this registration request and approve or reject access.</p>
          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Review User Requests</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SIM Dashboard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: adminEmail, subject, html });
}

/**
 * Send approval notification to user
 * @param {string} email - User email
 * @param {string} username - Username
 */
async function sendApprovalEmail(email, username) {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login`;
  
  const subject = 'Your Account Has Been Approved';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2e7d32; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #2e7d32; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Account Approved</h1>
        </div>
        <div class="content">
          <p>Hello ${username},</p>
          <p>Great news! Your SIM Dashboard account has been approved by an administrator.</p>
          <p>You can now log in and start using the system.</p>
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Log In Now</a>
          </div>
          <p>If you have any questions, please contact your administrator.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SIM Dashboard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
}

/**
 * Send rejection notification to user
 * @param {string} email - User email
 * @param {string} username - Username
 * @param {string} reason - Rejection reason (optional)
 */
async function sendRejectionEmail(email, username, reason) {
  const subject = 'Account Registration Not Approved';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .reason { background-color: #ffebee; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Registration Update</h1>
        </div>
        <div class="content">
          <p>Hello ${username},</p>
          <p>We regret to inform you that your SIM Dashboard account registration has not been approved at this time.</p>
          ${reason ? `
          <div class="reason">
            <p><strong>Reason:</strong></p>
            <p>${reason}</p>
          </div>
          ` : ''}
          <p>If you believe this is an error or would like more information, please contact your system administrator.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SIM Dashboard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} token - Reset token
 * @param {string} username - Username
 */
async function sendPasswordResetEmail(email, token, username) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password/${token}`;
  
  const subject = 'Reset Your Password';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #d32f2f; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${username},</p>
          <p>We received a request to reset your password for your SIM Dashboard account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #d32f2f;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SIM Dashboard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendAdminNotification,
  sendApprovalEmail,
  sendRejectionEmail,
  sendPasswordResetEmail
};
