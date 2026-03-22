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

exports.getAllJobs = catchAsync(async (req, res) => {
  let query = Job.find();

  // filters
  if (req.query.location) {
    query = query.find({ location: req.query.location });
  }

  if (req.query.tags) {
    query = query.find({ tags: { $in: req.query.tags.split(",") } });
  }

  if (req.query.salaryMin || req.query.salaryMax) {
    query = query.find({
      salaryMin: { $gte: req.query.salaryMin || 0 },
      salaryMax: { $lte: req.query.salaryMax || 1000000 },
    });
  }

  const features = new APIFeatures(query, req.query).search().paginate();

  const jobs = await features.query;

  res.json({
    success: true,
    message: "Jobs fetched",
    meta: features.pagination,
    data: jobs,
  });
});

// SINGLE JOB
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
