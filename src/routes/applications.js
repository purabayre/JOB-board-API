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

router.get(
  "/my-applications",
  authenticate,
  authorize("candidate"),
  appController.getMyApplications,
);

router.patch(
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

router.get(
  "/:id/resume",
  authenticate,
  authorize("employer", "candidate"),
  appController.getResume,
);
router.get(
  "/resume/:filename",
  authenticate,
  authorize("employer"),
  appController.getResumeFile,
);

module.exports = router;
