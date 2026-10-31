const express = require("express");
const { overview, classmates, startRun, createChallenge, answer, fifty, finish } = require("../controllers/arenaController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorize("Student"));

router.get("/overview", overview);
router.get("/classmates", classmates);
router.post("/runs", startRun);
router.post("/runs/:id/answer", answer);
router.post("/runs/:id/fifty", fifty);
router.post("/runs/:id/finish", finish);
router.post("/challenges", createChallenge);

module.exports = router;
