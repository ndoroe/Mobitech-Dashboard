# Profile Management Feature

## Overview
Added comprehensive profile management with password change and avatar upload capabilities.

## Backend Changes

### New Controller: `profileController.js`
- **getProfile** - GET /api/profile - Fetch current user profile
- **changePassword** - POST /api/profile/change-password - Change user password
- **uploadAvatar** - POST /api/profile/avatar - Upload profile avatar (max 5MB, images only)
- **deleteAvatar** - DELETE /api/profile/avatar - Remove profile avatar

### New Route: `profile.js`
- Configured multer for file upload handling
- Avatar storage in `public/uploads/avatars/`
- File validation (type and size)
- All routes require authentication and active status

### Server Updates: `server.js`
- Added static file serving for `/uploads` directory
- Integrated profile routes at `/api/profile`
- Installed multer dependency

### Database Migration Update: `001_create_auth_tables.sql`
- Added `avatar` column to users table (VARCHAR 500)

## Frontend Changes

### New Page: `src/pages/profile/index.tsx`
Profile management page with three sections:

1. **Profile Information**
   - Avatar preview and management
   - Upload avatar (drag & drop or click)
   - Remove avatar button
   - Display username, email, role, member since

2. **Change Password Form**
   - Current password field
   - New password field (min 8 characters)
   - Confirm password field
   - Real-time validation

### Component Updates

#### `Notifications.tsx` - Enhanced Notification Bell
**Problem**: Alert notifications (SIM usage alerts) were removed when admin notifications were added.

**Solution**: Merged both notification types into one component:
- Shows combined badge count (admin notifications + alert count)
- Displays SIM usage alerts at the top with warning background
- Displays admin notifications (user registrations) below
- Separate fetching for admin notifications and alerts
- 30-second polling interval for both types

**Features**:
- Admin users see: User registration notifications + Alert notifications
- Regular users see: Alert notifications only
- Click on alert notification opens alert modal or navigates to reports
- Click on admin notification navigates to user management page

#### `UserMenu.tsx`
- Re-added "Profile" menu item linking to `/profile`

#### `App.tsx`
- Added profile route with protected loader
- Imported ProfilePage component

## API Endpoints

### Profile Endpoints
```
GET    /api/profile                 - Get current user profile
POST   /api/profile/change-password - Change password
POST   /api/profile/avatar          - Upload avatar (multipart/form-data)
DELETE /api/profile/avatar          - Delete avatar
```

## Features

### Password Change
- Validates current password
- Requires 8+ character new password
- Confirms password match
- Hashes password with bcrypt
- Success/error alerts

### Avatar Management
- Upload image files (JPEG, PNG, GIF, WebP)
- 5MB max file size
- Automatic file naming: `user-{userId}-{timestamp}-{random}.ext`
- Preview uploaded avatar
- Delete and revert to default avatar
- Old avatar files automatically deleted on replace/delete
- Avatar served via static file server at `/uploads/avatars/`

### Notifications Enhancement
- **Alert Notifications**: SIM usage warnings visible to all users
- **Admin Notifications**: User registration alerts for admins only
- **Combined Badge**: Shows total count of both types
- **Visual Distinction**: Alerts have warning background color
- **Smart Navigation**: Clicks navigate to appropriate page (reports or user management)

## File Structure
```
server/
├── src/
│   ├── controllers/
│   │   └── profileController.js     (NEW)
│   ├── routes/
│   │   └── profile.js               (NEW)
│   └── server.js                    (UPDATED)
├── migrations/
│   └── 001_create_auth_tables.sql   (UPDATED - added avatar column)
└── public/
    └── uploads/
        └── avatars/                  (AUTO-CREATED)

frontend/
└── src/
    ├── pages/
    │   └── profile/
    │       └── index.tsx             (NEW)
    ├── components/
    │   └── layout/
    │       ├── Notifications.tsx     (UPDATED - merged alert + admin notifications)
    │       └── UserMenu.tsx          (UPDATED - added profile link)
    └── App.tsx                       (UPDATED - added profile route)
```

## Dependencies
- **multer** - File upload handling (installed via npm)

## Usage

1. Navigate to profile via user menu dropdown
2. Upload avatar by clicking "Upload Avatar" button
3. Change password using the form
4. View alert notifications and admin notifications in one place via bell icon

## Security
- All profile endpoints require authentication
- Current password verification for password changes
- File type validation for avatars
- File size limits enforced
- Old avatars automatically cleaned up
- Passwords hashed with bcrypt (10 rounds)
