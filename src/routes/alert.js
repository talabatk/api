const express = require("express");
const { editAlert } = require("../controllers/alert");
const router = express.Router();

router.patch("/alert", editAlert);

module.exports = router;
