const express = require("express");
const { editAlert, getAll } = require("../controllers/alert");
const router = express.Router();

router.patch("/alert", editAlert);
router.get("/app-statuses", getAll);

module.exports = router;
