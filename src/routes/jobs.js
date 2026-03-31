const express = require("express");
const router = express.Router();

const jobController = require("../controllers/jobs");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/", jobController.getAllJobs);

router.get(
  "/my-jobs",
  authenticate,
  authorize("employer"),
  jobController.getMyJobs,
);

router.get("/:id", jobController.getJob);

// employer
router.post("/", authenticate, authorize("employer"), jobController.createJob);

router.put(
  "/:id",
  authenticate,
  authorize("employer"),
  jobController.updateJob,
);

router.delete(
  "/:id",
  authenticate,
  authorize("employer"),
  jobController.deleteJob,
);

router.get(
  "/:jobId/applications",
  authenticate,
  authorize("employer"),
  jobController.getJobApplications,
);

module.exports = router;
