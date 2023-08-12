const express = require("express");
const optionGroupController = require("../controllers/optionsGroup");
const router = express.Router();

router.post("/group", optionGroupController.createGroup);

router.patch("/group/:id", optionGroupController.editGroup);

router.delete("/group/:id", optionGroupController.removeGroup);

router.delete("/option/:id", optionGroupController.removeOption);

router.patch("/option/:id", optionGroupController.editOption);

module.exports = router;
