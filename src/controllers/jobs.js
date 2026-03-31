const Job = require("../models/job");
const Application = require("../models/Applications");

const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.createJob = catchAsync(async (req, res) => {
  const job = await Job.create({
    ...req.body,
    employer: req.user.id,
  });
  res.status(201).json({
    success: true,
    message: "Job created",
    data: job,
  });
});

exports.getAllJobs = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Job.find(), req.query)
    .filter()
    .search()
    .sort()
    .paginate();

  const jobs = await features.query;

  res.status(200).json({
    status: "success",
    results: jobs.length,
    data: jobs,
  });
});

exports.getJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) return next(new AppError("Job not found", 404));

  res.json({
    success: true,
    message: "Job fetched",
    data: job,
  });
});

exports.updateJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) return next(new AppError("Job not found", 404));

  if (job.employer.toString() !== req.user.id) {
    return next(new AppError("Not authorized", 403));
  }
  if (req.body.tags && Array.isArray(req.body.tags)) {
    job.tags = Array.from(new Set([...job.tags, ...req.body.tags]));
  }

  Object.assign(job, req.body);
  await job.save();

  res.json({
    success: true,
    message: "Job updated",
    data: job,
  });
});

exports.deleteJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) return next(new AppError("Job not found", 404));

  if (job.employer.toString() !== req.user.id) {
    return next(new AppError("Not authorized", 403));
  }

  await job.deleteOne();

  res.json({
    success: true,
    message: "Job deleted",
  });
});

exports.getMyJobs = catchAsync(async (req, res) => {
  const jobs = await Job.find({ employer: req.user.id });

  res.json({
    success: true,
    message: "My jobs fetched",
    data: jobs,
  });
});

exports.getJobApplications = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);

  if (!job) return next(new AppError("Job not found", 404));

  if (job.employer.toString() !== req.user.id) {
    return next(new AppError("Not authorized", 403));
  }

  const apps = await Application.find({ job: job._id });

  res.json({
    success: true,
    message: "Applications fetched",
    data: apps,
  });
});
