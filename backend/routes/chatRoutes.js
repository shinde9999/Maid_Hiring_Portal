const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/contacts", chatController.getContacts);
router.get("/search", chatController.searchContacts);
router.get("/messages/:otherUserId", chatController.getMessages);
router.post("/messages", chatController.sendMessage);

module.exports = router;
