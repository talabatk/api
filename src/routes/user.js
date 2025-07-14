const express = require("express");
const userController = require("../controllers/user");
const router = express.Router();

router.post("/signup", userController.register);

router.post("/login", userController.login);

router.post("/sms-login", userController.smsLogin);

router.post("/send-otp", userController.sendOtp);

router.post("/confirm-otp", userController.confirmOtp);

router.get("/profile", userController.getUserByToken);

router.get("/all-users", userController.getAllUsers);

router.post("/reset-password", userController.resetPassword);

router.post("/forget-password", userController.forgetPassword);

router.patch("/update", userController.updateProfile);

router.post("/status", userController.changeStatus);

router.delete("/delete/:id", userController.deleteUser);

module.exports = router;
