const express = require("express");
const cartController = require("../controllers/cart");
const router = express.Router();

router.get("/cart", cartController.getUserCart);

router.post("/cart", cartController.addToCart);

router.patch("/cart/:id", cartController.updateCartProduct);

router.delete("/cart/:id", cartController.deleteCartProduct);

module.exports = router;
