const notificationController = require("../controllers/notifications");
const express = require("express");
const router = express.Router();

router.post("/send-notification", notificationController.sendNotification);

router.get("/user-notifications", notificationController.getUserNotification);

module.exports = router;
