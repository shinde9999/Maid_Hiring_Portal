const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

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

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get('/profile', require('../middleware/authMiddleware'), userController.getProfile);
router.put('/profile', require('../middleware/authMiddleware'), userController.updateProfile);
router.post('/profile/photo', require('../middleware/authMiddleware'), upload.single('photo'), userController.uploadPhoto);
router.delete('/profile', require('../middleware/authMiddleware'), userController.deleteAccount);

module.exports = router;