const express = require("express");
const sliderController = require("../controllers/banner");
const router = express.Router();

router.post("/banner", sliderController.createSlider);

router.get("/banner", sliderController.getAll);

router.patch("/banner/:id", sliderController.editOne);

router.delete("/banner/:id", sliderController.deleteOne);
module.exports = router;
