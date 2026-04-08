const Job = require("../models/job");
const Application = require("../models/Applications");

const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const { logHistory } = require("../utils/historyLogger");

exports.createJob = catchAsync(async (req, res) => {
  const job = await Job.create({
    ...req.body,
    employer: req.user.id,
  });

  await logHistory(req.user.id, "Created Job", {
    jobId: job._id,
    title: job.title,
  });

  res.status(201).json({
    success: true,
    message: "Job created",
    data: job,
  });
});

exports.getAllJobs = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Job.find(), req.query, Job)
    .filter()
    .search()
    .sort()
    .paginate();

  const jobs = await features.query;

  await logHistory(req.user.id, "Viewed All Jobs", {
    filters: req.query,
  });

  await Job.findByIdAndUpdate(jobId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: "Jobs fetched successfully",
    data: jobs,
    meta: features.pagination,
  });
});

exports.getJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) return next(new AppError("Job not found", 404));

  await logHistory(req.user.id, "Viewed Job", {
    jobId: job._id,
    title: job.title,
  });

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

  const oldJob = job.toObject();

  if (req.body.tags && Array.isArray(req.body.tags)) {
    job.tags = Array.from(new Set([...job.tags, ...req.body.tags]));
  }

  Object.assign(job, req.body);
  await job.save();

  await logHistory(req.user.id, "Updated Job", {
    jobId: job._id,
    title: job.title,
    old: oldJob,
    new: job,
  });
  await Job.findByIdAndUpdate(jobId, {
    isDeleted: true,
    deletedAt: new Date(),
  });
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

  await logHistory(req.user.id, "Deleted Job", {
    jobId: req.params.id,
    title: job.title,
  });

  await Job.findByIdAndUpdate(jobId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  res.json({
    success: true,
    message: "Job deleted",
  });
});

exports.getMyJobs = catchAsync(async (req, res) => {
  const jobs = await Job.find({ employer: req.user.id });

  await logHistory(req.user.id, "Viewed My Jobs");

  await Job.findByIdAndUpdate(jobId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

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

  await logHistory(req.user.id, "Viewed Job Applications", {
    jobId: job._id,
    title: job.title,
    count: apps.length,
  });

  await Job.findByIdAndUpdate(jobId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  res.json({
    success: true,
    message: "Applications fetched",
    data: apps,
  });
});
