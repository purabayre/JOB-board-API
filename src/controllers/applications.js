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

  // deadline check
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

  // role check
  if (req.user.role !== "candidate") {
    return next(new AppError("Only candidates can apply to jobs", 403));
  }
  // PDF check
  if (!req.file.mimetype.includes("pdf"))
    return next(new AppError("Resume must be a PDF file", 400));

  const application = await Application.create({
    job: job._id,
    candidate: req.user.id,
    resumePath: req.file.path,
  });

  const user = await User.findById(req.user.id);

  // send email
  await sendEmail(
    user.email,
    "Application Submitted",
    `You applied for ${job.title}`,
  );

  res.status(201).json({
    success: true,
    message: "Applied successfully",
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
  const filename = req.params.filename;

  // Prevent path traversal
  if (filename.includes(".."))
    return next(new AppError("Invalid filename", 400));

  // Find application whose resumePath ends with this filename
  const application = await Application.findOne({
    resumePath: new RegExp(`${filename}$`),
  }).populate("job");

  if (!application) {
    return next(new AppError("File not found", 404));
  }

  // Authorization: candidate OR job employer
  const isCandidate = application.candidate.toString() === req.user.id;
  const isEmployer = application.job.employer.toString() === req.user.id;

  if (!isCandidate && !isEmployer) {
    return next(new AppError("Not authorized to access this resume", 403));
  }

  const filePath = path.resolve(application.resumePath);

  // Ensure file exists
  if (!fs.existsSync(filePath)) {
    return next(new AppError("Resume file missing", 404));
  }

  res.sendFile(filePath);
});
