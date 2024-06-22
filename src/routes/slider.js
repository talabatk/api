const express = require("express");
const sliderController = require("../controllers/slider");
const router = express.Router();

router.post("/slider", sliderController.createSlider);

router.get("/slider", sliderController.getAll);

router.patch("/slider/:id", sliderController.editOne);

router.delete("/slider/:id", sliderController.deleteOne);
module.exports = router;
