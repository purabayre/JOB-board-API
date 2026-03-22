const Application = require("../models/Applications");
const Job = require("../models/job");
const User = require("../models/user");
const path = require("path");

const { sendEmail } = require("../services/emailService");
const { generatePDF } = require("../services/pdfService");

const catchAsync = require("../utils/catchAsync");

// APPLY
exports.applyToJob = catchAsync(async (req, res) => {
  const job = await Job.findById(req.params.jobId);

  if (!job)
    return res.status(404).json({ success: false, error: "Job not found" });

  // deadline check
  if (job.deadline && new Date(job.deadline) < new Date())
    return res.status(403).json({ success: false, error: "Deadline passed" });

  // duplicate check
  const exists = await Application.findOne({
    job: job._id,
    candidate: req.user.id,
  });

  if (exists)
    return res.status(409).json({ success: false, error: "Already applied" });

  // file check
  if (!req.file)
    return res.status(400).json({ success: false, error: "Resume required" });

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
    `Applied for ${job.title}`,
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
exports.getResume = catchAsync(async (req, res) => {
  const filename = req.params.filename;

  const application = await Application.findOne({
    resumePath: { $regex: filename },
  }).populate("job");

  if (!application) {
    return res.status(404).json({
      success: false,
      error: "File not found",
    });
  }

  // allow only candidate OR employer
  if (
    application.candidate.toString() !== req.user.id &&
    application.job.employer.toString() !== req.user.id
  ) {
    return res.status(403).json({
      success: false,
      error: "Not authorized",
    });
  }

  const filePath = path.resolve(application.resumePath);
  res.sendFile(filePath);
});
