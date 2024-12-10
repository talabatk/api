const express = require("express");
const complainsController = require("../controllers/complains");
const router = express.Router();

router.post("/complains", complainsController.createComplain);

router.get("/complains", complainsController.getAllComplains);

router.get("/complains/:id", complainsController.getComplainById);

router.delete("/complains/:id", complainsController.deleteComplain);

module.exports = router;
