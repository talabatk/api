const express = require("express");
const areaController = require("../controllers/area");
const router = express.Router();

router.post("/area", areaController.createArea);

router.get("/area", areaController.getAll);

router.get("/area/:id", areaController.getOne);

router.patch("/area/:id", areaController.editOne);

router.delete("/area/:id", areaController.deleteOne);

module.exports = router;
