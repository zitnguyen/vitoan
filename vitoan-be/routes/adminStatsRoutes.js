const express = require("express");
const { overview } = require("../controllers/adminStatsController");
const { exportBackup, importBackup } = require("../controllers/adminBackupController");
const { classReport, studentReport } = require("../controllers/adminReportController");
const { lookup } = require("../controllers/adminLookupController");
const m = require("../controllers/adminManageController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", protect, authorize("Admin"), overview);
router.get("/report", protect, authorize("Admin"), classReport);
router.get("/report/student/:id", protect, authorize("Admin"), studentReport);
router.get("/backup", protect, authorize("Admin"), exportBackup);
router.post("/restore", protect, authorize("Admin"), importBackup);
router.get("/catalog", protect, authorize("Admin"), m.catalog);
router.get("/comments", protect, authorize("Admin"), m.listComments);
router.post("/comments/bulk-delete", protect, authorize("Admin"), m.bulkDeleteComments);
router.get("/redemptions", protect, authorize("Admin"), m.listRedemptions);
router.patch("/redemptions/:id", protect, authorize("Admin"), m.updateRedemption);
router.get("/broadcasts", protect, authorize("Admin"), m.listBroadcasts);
router.post("/broadcasts", protect, authorize("Admin"), m.sendBroadcast);
router.get("/arena", protect, authorize("Admin"), m.arenaOverview);
router.get("/lookup/:id", protect, authorize("Admin"), lookup);

module.exports = router;
