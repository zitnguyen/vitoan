const express = require("express");
const { overview } = require("../controllers/adminStatsController");
const { exportBackup, importBackup } = require("../controllers/adminBackupController");
const { classReport, studentReport } = require("../controllers/adminReportController");
const { lookup } = require("../controllers/adminLookupController");
const m = require("../controllers/adminManageController");
const { protect, authorize, requirePermission } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", protect, authorize("Manager"), overview);
router.get("/report", protect, authorize("Manager"), classReport);
router.get("/report/student/:id", protect, authorize("Manager"), studentReport);
router.get("/backup", protect, requirePermission("system.backup"), exportBackup);
router.post("/restore", protect, requirePermission("system.backup"), importBackup);
router.get("/catalog", protect, authorize("Manager"), m.catalog);
router.get("/comments", protect, authorize("Manager"), m.listComments);
router.post("/comments/bulk-delete", protect, authorize("Manager"), m.bulkDeleteComments);
router.get("/redemptions", protect, authorize("Manager"), m.listRedemptions);
router.patch("/redemptions/:id", protect, authorize("Manager"), m.updateRedemption);
router.get("/broadcasts", protect, authorize("Manager"), m.listBroadcasts);
router.post("/broadcasts", protect, authorize("Manager"), m.sendBroadcast);
router.get("/arena", protect, authorize("Manager"), m.arenaOverview);
router.get("/lookup/:id", protect, authorize("Manager"), lookup);

module.exports = router;
