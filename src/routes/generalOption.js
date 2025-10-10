const express = require("express");
const generalOptionController = require("../controllers/generalOption");
const router = express.Router();

router.post("/general-option", generalOptionController.createGeneralOption);

router.get("/general-option", generalOptionController.getAll);

router.get("/general-option/:id", generalOptionController.getOne);

router.patch("/general-option/:id", generalOptionController.editOne);

router.delete("/general-option/:id", generalOptionController.deleteOne);

module.exports = router;
