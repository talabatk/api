const express = require("express");
const favoriteController = require("../controllers/favourite");
const router = express.Router();

router.post("/product-like", favoriteController.toggleFavoriteProduct);

router.get("/favourite", favoriteController.getUserFavoriteProducts);

module.exports = router;
