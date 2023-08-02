const express = require("express");
const deliveryController = require("../controllers/delivery");
const validateUser = require("../middlewares/validateUser");
const router = express.Router();

router.post("/login", deliveryController.login);

router.post(
  "/create-delivery",
  validateUser,
  deliveryController.createDelivery
);

router.get("/get-deliveries", deliveryController.getAllDeliveries);

module.exports = router;
