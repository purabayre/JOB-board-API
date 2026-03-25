const Application = require("../models/Applications");
const Job = require("../models/job");
const User = require("../models/user");
const path = require("path");
const fs = require("fs");
const AppError = require("../utils/AppError");

const { sendEmail } = require("../services/emailService");
const { generatePDF } = require("../services/pdfService");

const catchAsync = require("../utils/catchAsync");

// APPLY
exports.applyToJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);

  if (!job) return next(new AppError("Job not found", 404));

  // Deadline check
  if (job.deadline && new Date(job.deadline) < new Date())
    return next(new AppError("Deadline passed", 403));

  // candidate only
  if (req.user.role !== "candidate")
    return next(new AppError("Only candidates can apply", 403));

  // duplicate check
  const exists = await Application.findOne({
    job: job._id,
    candidate: req.user.id,
  });

  if (exists) return next(new AppError("Already applied", 409));

  // resume required
  if (!req.file) return next(new AppError("Resume required", 400));

  // PDF check
  if (!req.file.mimetype.includes("pdf"))
    return next(new AppError("Resume must be a PDF", 400));

  // Create application
  const application = await Application.create({
    job: job._id,
    candidate: req.user.id,
    resumePath: req.file.path,
  });

  const user = await User.findById(req.user.id);

  // Send email
  await sendEmail(
    user.email,
    "Application Submitted",
    `You applied for ${job.title}`,
  );

  const resumeURL = `${req.protocol}://${req.get("host")}/applications/${application._id}/resume`;

  res.status(201).json({
    success: true,
    message: "Applied successfully",
    resumeURL,
    data: application,
  });
});
// MY APPLICATIONS
exports.getMyApplications = catchAsync(async (req, res) => {
  const apps = await Application.find({
    candidate: req.user.id,
  }).populate("job");

  const user = await User.findById(req.user.id);

  // generate PDF if not exists
  for (let app of apps) {
    if (!app.receiptPath) {
      const pdfPath = await generatePDF(app, app.job, user);
      app.receiptPath = pdfPath;
      await app.save();
    }
  }

  res.json({
    success: true,
    data: apps,
  });
});

exports.updateApplicationStatus = catchAsync(async (req, res) => {
  const applicationId = req.params.id;
  const { status } = req.body;

  const application = await Application.findById(applicationId).populate("job");

  if (!application) {
    return res.status(404).json({
      success: false,
      error: "Application not found",
    });
  }

  // Only employer of this job can update status
  if (application.job.employer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: "Only employer can update application status",
    });
  }

  // allowed statuses (optional)
  const allowedStatuses = ["pending", "reviewed", "rejected"];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: "Invalid status",
    });
  }

  application.status = status || application.status;
  await application.save();

  res.status(200).json({
    success: true,
    message: "Application status updated",
    data: application,
  });
});

// DELETE APPLICATION
exports.deleteApplication = catchAsync(async (req, res) => {
  const app = await Application.findById(req.params.id).populate("job");

  if (!app) return res.status(404).json({ success: false, error: "Not found" });

  // only owner
  if (app.candidate.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: "Not allowed",
    });
  }

  // deadline check
  if (app.job.deadline && new Date(app.job.deadline) < new Date()) {
    return res.status(403).json({
      success: false,
      error: "Cannot delete after deadline",
    });
  }

  await app.deleteOne();

  res.json({
    success: true,
    message: "Application deleted",
  });
});

// DOWNLOAD RESUME

exports.getResume = catchAsync(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate("candidate")
    .populate("job");

  if (!application) return next(new AppError("Application not found", 404));

  const isCandidate = application.candidate._id.toString() === req.user.id;
  const isEmployer =
    req.user.role === "employer" &&
    application.job.createdBy.toString() === req.user.id;

  if (!isCandidate && !isEmployer) {
    return next(new AppError("Not authorized", 403));
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");

  res.sendFile(path.resolve(application.resumePath));
});
