const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message");

router.post("/sendMessageFromUser", messageController.sendMessageFromUser);

router.post("/sendMessageToUser", messageController.sendMessageToUser);

router.get("/getUserMessage", messageController.getUserMessages);

module.exports = router;
