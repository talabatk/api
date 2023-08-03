const notificationController = require("../controllers/notifications");
const express = require("express");
const router = express.Router();

router.post("/subscribeToTopic", notificationController.subscribe);

router.post("/unsubscribeFromTopic", notificationController.unsubscribe);

router.post("/send", notificationController.sendNotification);

router.post("/send-to-user", notificationController.sentNotificationToUser);

router.get("/user-notifications", notificationController.getUserNotification);

module.exports = router;
