const express = require("express");
const categoryController = require("../controllers/category");
const router = express.Router();

router.post("/category", categoryController.createCategory);

router.get("/category", categoryController.getAll);

router.get("/category/:id", categoryController.getOne);

router.patch("/category/:id", categoryController.editOne);

router.delete("/category/:id", categoryController.deleteOne);

router.get("/vendor-categories", categoryController.getVendorCategories);
module.exports = router;
