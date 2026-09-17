const express = require("express");
const { speak } = require("../controllers/ttsController");

const router = express.Router();

router.get("/speak", speak);

module.exports = router;
