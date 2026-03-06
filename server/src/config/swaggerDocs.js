/**
 * Swagger JSDoc annotations for all API endpoints.
 * This file is referenced by swagger config to supplement route-file annotations.
 */

// ======================== HEALTH ========================

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check with full observability
 *     description: Returns server status, database connectivity, memory usage, and uptime.
 *     servers:
 *       - url: /
 *     responses:
 *       200:
 *         description: Server healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: integer
 *                   description: Seconds since server start
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [up, down]
 *                     latencyMs:
 *                       type: integer
 *                       nullable: true
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                     heapUsed:
 *                       type: number
 *                     heapTotal:
 *                       type: number
 *                     unit:
 *                       type: string
 *                       example: MB
 *       503:
 *         description: Server degraded (database unreachable)
 */

/**
 * @swagger
 * /ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness check
 *     description: Lightweight database ping for orchestrator readiness probes.
 *     servers:
 *       - url: /
 *     responses:
 *       200:
 *         description: Ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *       503:
 *         description: Not ready
 */

// ======================== AUTH ========================

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new user account. First user becomes admin automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, confirmPassword]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error or duplicate email/username
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: User login
 *     description: Authenticate with username/email and password. Returns JWT token. Account locks after 5 failed attempts for 15 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username or email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account not active
 *       423:
 *         description: Account locked
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: User logout
 *     description: Logout endpoint (stateless — client should discard token)
 *     responses:
 *       200:
 *         description: Logout successful
 */

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Verify email address
 *     description: Verifies user email via token sent during registration. Transitions user to pending_approval.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email resent (does not reveal if email exists)
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent (does not reveal if email exists)
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword]
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or validation error
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */

// ======================== USERS (Admin) ========================

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 */

/**
 * @swagger
 * /users/pending:
 *   get:
 *     tags: [Users]
 *     summary: Get pending approval users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending users
 *       403:
 *         description: Admin role required
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin role required
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Admin role required
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/{id}/verify:
 *   post:
 *     tags: [Users]
 *     summary: Manually verify a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User verified
 *       403:
 *         description: Admin role required
 */

/**
 * @swagger
 * /users/{id}/approve:
 *   post:
 *     tags: [Users]
 *     summary: Approve a user registration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User approved
 *       403:
 *         description: Admin role required
 */

/**
 * @swagger
 * /users/{id}/reject:
 *   post:
 *     tags: [Users]
 *     summary: Reject a user registration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User rejected
 *       403:
 *         description: Admin role required
 */

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     tags: [Users]
 *     summary: Update user role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: Admin role required
 */

// ======================== DASHBOARD ========================

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     description: Returns total SIMs, monthly usage, pool utilization (based on billed_mb_per_sim × SIM count), and alert counts.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 0.8
 *         description: Alert threshold ratio (0-1)
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /dashboard/top-consumers:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get top data consumers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, week, all]
 *           default: month
 *     responses:
 *       200:
 *         description: Top consumers list
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /dashboard/monthly-comparison:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly comparison data
 *     description: Returns daily aggregated usage for current and previous month.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly comparison data
 *       401:
 *         description: Not authenticated
 */

// ======================== SIM CARDS ========================

/**
 * @swagger
 * /sims:
 *   get:
 *     tags: [SIM Cards]
 *     summary: Get all SIM cards
 *     description: Returns paginated SIM card list with usage data. Supports AG Grid sort/filter models.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startRow
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: endRow
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by ICCID or MSISDN
 *       - in: query
 *         name: sortModel
 *         schema:
 *           type: string
 *         description: JSON-encoded AG Grid sort model
 *       - in: query
 *         name: filterModel
 *         schema:
 *           type: string
 *         description: JSON-encoded AG Grid filter model
 *     responses:
 *       200:
 *         description: SIM card list with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SimCard'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /sims/{iccid}/history:
 *   get:
 *     tags: [SIM Cards]
 *     summary: Get SIM card usage history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: iccid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SIM usage history
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: SIM not found
 */

// ======================== REPORTS ========================

/**
 * @swagger
 * /reports/custom:
 *   post:
 *     tags: [Reports]
 *     summary: Generate custom report
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Custom report data
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /reports/dynamic:
 *   post:
 *     tags: [Reports]
 *     summary: Generate dynamic report with filters
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Dynamic report data
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /reports/alerts:
 *   get:
 *     tags: [Reports]
 *     summary: Get current alerts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current alerts list
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /reports/projected-alerts:
 *   get:
 *     tags: [Reports]
 *     summary: Get projected alerts
 *     description: SIMs projected to exceed threshold by end of month
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projected alerts list
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /reports/monthly-usage:
 *   get:
 *     tags: [Reports]
 *     summary: Get monthly usage report
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly usage data
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /reports/metadata:
 *   get:
 *     tags: [Reports]
 *     summary: Get report metadata
 *     description: Returns available columns, filters, and report types
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report metadata
 *       401:
 *         description: Not authenticated
 */

// ======================== NOTIFICATIONS ========================

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /notifications/count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification count
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /notifications/clear-read:
 *   delete:
 *     tags: [Notifications]
 *     summary: Clear read notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Read notifications cleared
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification deleted
 *       401:
 *         description: Not authenticated
 */

// ======================== PROFILE ========================

/**
 * @swagger
 * /profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /profile/change-password:
 *   post:
 *     tags: [Profile]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated or wrong current password
 */

/**
 * @swagger
 * /profile/avatar:
 *   post:
 *     tags: [Profile]
 *     summary: Upload avatar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (max 5MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *       400:
 *         description: Invalid file
 *       401:
 *         description: Not authenticated
 *   delete:
 *     tags: [Profile]
 *     summary: Delete avatar
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted
 *       401:
 *         description: Not authenticated
 */

// ======================== PREFERENCES ========================

/**
 * @swagger
 * /preferences:
 *   get:
 *     tags: [Preferences]
 *     summary: Get user preferences
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       401:
 *         description: Not authenticated
 *   put:
 *     tags: [Preferences]
 *     summary: Update user preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferences'
 *     responses:
 *       200:
 *         description: Preferences updated
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /preferences/reset:
 *   post:
 *     tags: [Preferences]
 *     summary: Reset preferences to defaults
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences reset to defaults
 *       401:
 *         description: Not authenticated
 */

// ======================== SETTINGS ========================

/**
 * @swagger
 * /settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get all system settings
 *     description: Returns all key-value system settings. All authenticated users can read.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings map
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/SystemSetting'
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /settings/{key}:
 *   put:
 *     tags: [Settings]
 *     summary: Update a system setting
 *     description: Admin only. Updates a system setting by key.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key (e.g. billed_mb_per_sim)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: string
 *                 description: New value for the setting
 *     responses:
 *       200:
 *         description: Setting updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Setting not found
 */
