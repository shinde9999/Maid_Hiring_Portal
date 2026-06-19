const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');

const maidController = require("../controllers/maidController");
const auth = require('../middleware/authMiddleware');

// configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'))
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Create maid profile
router.post(
  "/profile",
  auth,
  maidController.createProfile
);

// Get logged-in maid profile
router.get(
  "/profile",
  auth,
  maidController.getProfile
);

// Update maid profile (skills, contact)
router.put(
  "/profile",
  auth,
  maidController.updateProfile
);

// Get all maids
router.get(
  "/",
  maidController.getAllMaids
);

// Get maid profile by profile id (public)
router.get('/profile/:id', maidController.getProfileById);

// Post rating for a maid profile
router.post('/profile/:id/rating', auth, maidController.addRating);

// Get ratings for a maid profile
router.get('/profile/:id/ratings', maidController.getRatingsForProfile);

// Upload profile photo
router.post('/profile/photo', auth, upload.single('photo'), maidController.uploadPhoto);

module.exports = router;