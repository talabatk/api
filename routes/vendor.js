const express = require("express");
const vendorController = require("../controllers/vendor");
const validateUser = require("../middlewares/validateUser");
const router = express.Router();

router.post("/login", vendorController.login);

router.post("/create-vendor", vendorController.createVendor);

router.get("/get-vendors", vendorController.getAllVendors);

router.patch("/edit-vendor", vendorController.editVendor);

module.exports = router;
