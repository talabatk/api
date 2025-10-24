const express = require("express");
const ProductController = require("../controllers/product");

const router = express.Router();

router.post("/product", ProductController.createProduct);

router.post("/product-excel", ProductController.bulkCreate);

router.get("/product", ProductController.getAll);

router.get("/product/:id", ProductController.getOne);

router.get("/product/getOne/:id", ProductController.getOneProduct);

router.get("/numbers", ProductController.dataAnalysis);

router.patch("/product/:id", ProductController.editOne);

router.delete("/product/:id", ProductController.deleteOne);

router.delete("/productImage/:id", ProductController.deleteProductImage);

module.exports = router;
