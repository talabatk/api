const ProductController = require("../controllers/product");
const express = require("express");
const router = express.Router();

router.post("/product", ProductController.createProduct);

router.get("/product", ProductController.getAll);

router.get("/product/:id", ProductController.getOne);

router.patch("/product/:id", ProductController.editOne);

router.delete("/product/:id", ProductController.deleteOne);

router.delete("/productImage/:id", ProductController.deleteProductImage);

module.exports = router;
