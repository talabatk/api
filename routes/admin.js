const express = require("express");
const adminController = require("../controllers/admin");
const validateUser = require("../middlewares/validateUser");
const router = express.Router();

router.post("/login", adminController.login);

router.post("/create-admin", validateUser, adminController.createAdmin);

router.get("/get-admins", adminController.getAllAdmins);

router.patch("/updated-roles", adminController.updateRoles);

module.exports = router;
