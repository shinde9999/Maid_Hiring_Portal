const express = require("express");
const router = express.Router();

const requestController =
require("../controllers/requestController");
const auth = require('../middleware/authMiddleware');

router.post(
 "/",
 auth,
 requestController.sendRequest
);

// Maid: get requests assigned to this maid
router.get(
  "/maid",
  auth,
  requestController.getRequestsForMaid
);

// Maid: accept a request
router.post(
  "/:id/accept",
  auth,
  requestController.acceptRequest
);

// User: get requests sent by this user
router.get(
  "/user",
  auth,
  requestController.getRequestsForUser
);

// Maid or User: update request status
router.put(
  "/:id",
  auth,
  requestController.updateRequestStatus
);

module.exports = router;