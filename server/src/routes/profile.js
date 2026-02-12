const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar
} = require('../controllers/profileController');
const { authenticateToken, requireActive } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../../public/uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId-timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = function (req, file, cb) {
  // Accept only image files
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// All routes require authentication and active status
router.use(authenticateToken);
router.use(requireActive);

// Get current user profile
router.get('/', getProfile);

// Change password
router.post('/change-password', changePassword);

// Upload avatar
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// Delete avatar
router.delete('/avatar', deleteAvatar);

module.exports = router;
