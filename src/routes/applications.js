const express = require("express");
const router = express.Router();

const appController = require("../controllers/applications");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const upload = require("../middleware/upload");

// APPLY
router.post(
  "/:jobId/apply",
  authenticate,
  authorize("candidate"),
  upload.single("resume"),
  appController.applyToJob,
);

//  MY APPLICATIONS
router.get(
  "/my-applications",
  authenticate,
  authorize("candidate"),
  appController.getMyApplications,
);

router.put(
  "/:id/updateStatus",
  authenticate,
  authorize("employer"),
  appController.updateApplicationStatus,
);

router.delete(
  "/:id",
  authenticate,
  authorize("candidate"),
  appController.deleteApplication,
);

router.get("/:id/resume", authenticate, appController.getResume);

module.exports = router;
