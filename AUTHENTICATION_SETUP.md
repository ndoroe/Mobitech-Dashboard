# Authentication System Setup Guide

This guide will help you set up the user authentication and registration system with admin approval workflow.

## Prerequisites

- MySQL 8.0+ database
- Node.js 18+ installed
- Email service configured (Gmail SMTP already configured in `.env`)

## Database Setup

### Step 1: Run the Authentication Migration

Execute the SQL migration script to create the necessary tables:

```bash
cd server
mysql -u root -p Mobitech < migrations/001_create_auth_tables.sql
```

Or using a MySQL client:

```sql
source /root/mobitech/sim-dashboard/server/migrations/001_create_auth_tables.sql
```

This will create the following tables:
- `users` - Store user accounts with authentication data
- `user_approval_requests` - Audit log for admin approval/rejection actions
- `admin_notifications` - In-app notifications for admins
- Updates `user_preferences` table to link to users

### Step 2: Verify Tables Were Created

```sql
USE Mobitech;
SHOW TABLES;
DESCRIBE users;
DESCRIBE admin_notifications;
DESCRIBE user_approval_requests;
```

## Backend Setup

### Step 1: Install Dependencies (if needed)

The required packages should already be installed:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation
- `nodemailer` - Email service

If not installed:

```bash
cd server
npm install
```

### Step 2: Update Environment Variables

Make sure the following are set in `server/.env`:

```env
# JWT Configuration
JWT_SECRET=sim_dashboard_secret_key_dev_only
JWT_EXPIRE=7d

# Email Configuration (already configured)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=edronmdm@gmail.com
EMAIL_PASS=sakuavibgqsytcup
EMAIL_FROM=admin@sim-dashboard.org
EMAIL_FROM_NAME=SIM Dashboard Admin

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### Step 3: Start the Backend Server

```bash
cd server
npm start
```

The server should start on port 5000.

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd /root/mobitech/sim-dashboard
npm install --legacy-peer-deps
```

**Note:** Use `--legacy-peer-deps` flag to bypass peer dependency conflicts between ESLint versions.

### Step 2: Update Environment Variables

Create or update `sim-dashboard/.env`:

```env
# Backend API URL (already configured for remote server)
REACT_APP_API_URL=http://192.168.101.15:5000/api

# For local development, use:
# REACT_APP_API_URL=http://localhost:5000/api
```

### Step 3: Start the Frontend

```bash
cd sim-dashboard
npm start
```

The app should open at http://localhost:3000

## First User Setup

The **first user** to register will automatically become an admin with active status. This solves the bootstrap problem (who approves the first admin?).

### Create Your First Admin User

1. Navigate to http://localhost:3000/auth/register
2. Fill out the registration form
3. Submit the form
4. You'll be automatically logged in as an admin (no email verification or approval needed for the first user)

## User Registration Flow

For all subsequent users:

1. **User Registration** → User fills out registration form at `/auth/register`
2. **Email Verification** → User receives email with verification link (valid for 24 hours)
3. **Click Verification Link** → User clicks link, status changes to "pending_approval"
4. **Admin Notification** → All admins receive:
   - Email notification about new registration
   - In-app notification (bell icon)
5. **Admin Approval** → Admin logs in and:
   - Sees notification badge
   - Goes to "User Management" page
   - Reviews pending users
   - Approves or rejects with optional reason
6. **User Notification** → User receives email about approval/rejection
7. **User Login** → Approved users can now log in

## Testing the System

### Test User Registration

1. Open http://localhost:3000/auth/register
2. Register with a test email
3. Check the email inbox for verification link
4. Click the verification link
5. Log in as admin to approve the user
6. Check that approved user can log in

### Test Login Status Messages

Try logging in before each step to see different messages:
- **Before verification**: "Please verify your email address"
- **After verification, before approval**: "Your account is pending admin approval"
- **After rejection**: "Your account has been rejected"
- **After approval**: Successful login

## Features Implemented

### Backend

✅ JWT-based authentication
✅ Password hashing with bcrypt
✅ Email verification with expiring tokens
✅ Admin approval workflow
✅ Role-based access control (admin/user)
✅ Protected API routes
✅ Email notifications (verification, approval, rejection, admin alerts)
✅ In-app notifications for admins
✅ User management endpoints (list, approve, reject, delete, role change)

### Frontend

✅ Registration page with validation
✅ Email verification handler page
✅ Enhanced login page with status messages
✅ Admin user management dashboard with tabs
✅ Real-time notification polling (30 seconds)
✅ Role-based menu items (admin only)
✅ Role-based route guards
✅ User profile with role badge
✅ Token persistence in localStorage

## API Endpoints

### Public Endpoints

```
POST   /api/auth/register           - Register new user
GET    /api/auth/verify-email/:token - Verify email address
POST   /api/auth/login              - Login user
POST   /api/auth/logout             - Logout user
POST   /api/auth/resend-verification - Resend verification email
```

### Protected Endpoints

```
GET    /api/auth/me                 - Get current user (requires auth)
GET    /api/dashboard/*             - Dashboard data (requires auth + active)
GET    /api/sims/*                  - SIM card data (requires auth + active)
GET    /api/reports/*               - Reports data (requires auth + active)
GET    /api/preferences             - User preferences (requires auth + active)
```

### Admin-Only Endpoints

```
GET    /api/users                   - List all users
GET    /api/users/pending           - Get pending approval users
GET    /api/users/:id               - Get user details
POST   /api/users/:id/approve       - Approve user
POST   /api/users/:id/reject        - Reject user (with reason)
PUT    /api/users/:id/role          - Change user role
DELETE /api/users/:id               - Delete user
GET    /api/notifications           - Get notifications
GET    /api/notifications/count     - Get unread count
POST   /api/notifications/:id/read  - Mark notification as read
POST   /api/notifications/read-all  - Mark all as read
DELETE /api/notifications/:id       - Delete notification
```

## Security Notes

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 7 days (configurable)
- Email verification links expire after 24 hours
- All API routes except `/api/auth/*` require authentication
- Admin routes require both authentication and admin role
- First user auto-promoted to admin to bootstrap system

## Troubleshooting

### Issue: No verification email received

- Check email configuration in server/.env
- Check server logs for email errors
- Gmail might block "less secure apps" - use app-specific password

### Issue: "Invalid token" on verification

- Token might have expired (24 hours)
- Use "Resend verification" feature
- Check database that user exists with status "pending_verification"

### Issue: Can't approve users (403 error)

- Make sure you're logged in as admin
- Check that your user role is 'admin' in database
- Clear browser cache and localStorage, then log in again

### Issue: Frontend can't connect to backend

- Make sure backend is running on port 5000
- Check CORS settings in server/src/server.js
- Verify REACT_APP_API_URL in frontend .env

## Default Credentials

After creating your first admin user, test accounts can be created through the registration flow.

**First Admin** (you create):
- Go to /auth/register
- Fill out form
- Automatically approved as admin

## Next Steps

1. Run the database migration
2. Start backend and frontend servers  
3. Register your first admin user
4. Test the registration → verification → approval flow
5. Invite team members to register
6. Approve or reject their accounts from the User Management page

For questions or issues, check the server logs and browser console for detailed error messages.
