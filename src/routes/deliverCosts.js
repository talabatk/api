const express = require("express");
const deliveryCostController = require("../controllers/deliverCost");
const router = express.Router();

router.post("/costs", deliveryCostController.createCosts);

router.patch("/costs/:id", deliveryCostController.editOne);

router.delete("/costs/:id", deliveryCostController.deleteOne);

module.exports = router;
