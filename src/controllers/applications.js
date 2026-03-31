const Application = require("../models/Applications");
const Job = require("../models/job");
const User = require("../models/user");
const path = require("path");
const fs = require("fs");
const AppError = require("../utils/AppError");

const { sendEmail } = require("../services/emailService");
const { generatePDF } = require("../services/pdfService");

const catchAsync = require("../utils/catchAsync");

exports.applyToJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);

  if (!job) return next(new AppError("Job not found", 404));

  if (job.deadline && new Date(job.deadline) < new Date()) {
    return next(new AppError("Deadline passed", 403));
  }

  if (req.user.role !== "candidate") {
    return next(new AppError("Only candidates can apply", 403));
  }

  const exists = await Application.findOne({
    job: job._id,
    candidate: req.user.id,
  });

  if (exists) {
    return next(new AppError("Already applied", 409));
  }

  if (!req.file) {
    return next(new AppError("Resume required", 400));
  }

  if (!req.file.mimetype.includes("pdf")) {
    return next(new AppError("Resume must be a PDF", 400));
  }

  const application = await Application.create({
    job: job._id,
    candidate: req.user.id,
    resumePath: req.file.path,
  });

  const user = await User.findById(req.user.id);

  const emailStatus = await sendEmail(
    user.email,
    "Application Submitted",
    `You have successfully applied for <b>${job.title}</b>.`,
  );

  const filename = req.file.filename;
  const resumeURL = `${req.protocol}://${req.get("host")}/api/applications/resume/${filename}`;

  res.status(201).json({
    success: true,
    message: "Applied successfully",
    emailSent: emailStatus.success,
    resumeURL,
    data: application,
  });
});

exports.getMyApplications = catchAsync(async (req, res) => {
  const apps = await Application.find({
    candidate: req.user.id,
  }).populate("job");

  const user = await User.findById(req.user.id);

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
    return next(new AppError("Application not found", 404));
  }

  // Only employer of this job can update status
  if (application.job.employer.toString() !== req.user.id) {
    return next(new AppError("only employer can update status", 403));
  }

  // allowed statuses (optional)
  const allowedStatuses = ["pending", "reviewed", "rejected"];
  if (status && !allowedStatuses.includes(status)) {
    return next(new AppError("invalid status", 400));
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

  if (!app) return next(new AppError("Application not found", 404));

  // only owner
  if (app.candidate.toString() !== req.user.id) {
    return next(new AppError("not authorized", 403));
  }

  // deadline check
  if (app.job.deadline && new Date(app.job.deadline) < new Date()) {
    return next(new AppError("Cannot delete after deadline", 403));
  }

  await app.deleteOne();

  res.json({
    success: true,
    message: "Application deleted",
  });
});

exports.getResume = catchAsync(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate("candidate")
    .populate("job");

  if (!application) {
    return next(new AppError("Application not found", 404));
  }

  const isCandidate = application.candidate._id.toString() === req.user.id;

  const isEmployer =
    req.user.role === "employer" &&
    application.job.employer.toString() === req.user.id; // 🔥 FIXED HERE

  if (!isCandidate && !isEmployer) {
    return next(new AppError("Not authorized", 403));
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");

  res.sendFile(path.resolve(application.resumePath));
});
exports.getResumeFile = catchAsync(async (req, res, next) => {
  const { filename } = req.params;

  // Find application that owns this resume
  const application = await Application.findOne({
    resumePath: { $regex: filename + "$" },
  })
    .populate("candidate")
    .populate("job");

  if (!application) {
    return next(new AppError("Resume not found", 404));
  }

  const isCandidate = application.candidate._id.toString() === req.user.id;

  const isEmployer =
    req.user.role === "employer" &&
    application.job.employer.toString() === req.user.id; // 🔥 FIXED HERE

  if (!isCandidate && !isEmployer) {
    return next(new AppError("Not authorized", 403));
  }

  const filePath = path.resolve(application.resumePath);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");

  res.sendFile(filePath, (err) => {
    if (err) return next(new AppError("File not found on server", 404));
  });
});
