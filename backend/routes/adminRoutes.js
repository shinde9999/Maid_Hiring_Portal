const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.use(authMiddleware);
router.use(adminMiddleware);

// Stats route
router.get("/stats", adminController.getStats);

// User routes
router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUser);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

// Maid Profile routes
router.get("/maids", adminController.getMaidProfiles);
router.post("/maids", adminController.createMaidProfile);
router.put("/maids/:id", adminController.updateMaidProfile);
router.delete("/maids/:id", adminController.deleteMaidProfile);

// Request/Booking routes
router.get("/requests", adminController.getRequests);
router.put("/requests/:id", adminController.updateRequest);
router.delete("/requests/:id", adminController.deleteRequest);

module.exports = router;
