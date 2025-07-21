const express = require("express");
const VendorCategory = require("../controllers/vendorCategory");
const router = express.Router();

router.post("/vendor_category", VendorCategory.createVendorCategory);

router.get("/vendor_category", VendorCategory.getAll);

router.get("/vendor_category2", VendorCategory.getAllForAdmin);

router.get("/vendor_category/:id", VendorCategory.getOne);

router.patch("/vendor_category/:id", VendorCategory.editOne);

router.delete("/vendor_category/:id", VendorCategory.deleteOne);

module.exports = router;
