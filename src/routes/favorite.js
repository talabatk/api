const express = require("express");
const favoriteController = require("../controllers/favourite");
const router = express.Router();

router.post("/product-like", favoriteController.toggleFavoriteProduct);

router.post("/vendor-like", favoriteController.toggleFavoriteVendor);

router.get("/favourite-products", favoriteController.getUserFavoriteProducts);

router.get("/favourite-vendors", favoriteController.getUserfavoriteVendors);

module.exports = router;
