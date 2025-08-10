const express = require("express");
const cityController = require("../controllers/city");
const router = express.Router();

router.post("/city", cityController.createSlider);

router.get("/city", cityController.getAll);

router.get("/city/:id", cityController.getOne);

router.patch("/city/:id", cityController.editOne);

router.delete("/city/:id", cityController.deleteOne);

module.exports = router;
