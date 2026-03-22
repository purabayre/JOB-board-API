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

router.delete(
  "/:id",
  authenticate,
  authorize("candidate"),
  appController.deleteApplication,
);

router.get("/resume/:filename", authenticate, appController.getResume);

module.exports = router;
