const User = require("../models/user");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

exports.register = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return next(new AppError("Validation failed", 400, formatted));
  }

  const { name, email, password, role, company } = req.body;

  if (!name || !email || !password || !role) {
    return next(new AppError("all fields are required", 400));
  }

  if (role === "employer" && !company) {
    return next(
      new AppError("Company name is required for employer accounts", 400),
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email is already registered", 400));
  }

  let user = await User.create(req.body);

  user = await User.findById(user._id).select("-password");

  res.status(201).json({
    success: true,
    message: "User registered",
    data: user,
  });
});

const loginAttempts = new Map();

exports.login = catchAsync(async (req, res, next) => {
  const ip = req.ip;
  const LIMIT = 5;
  const WINDOW = 15 * 60 * 1000;
  const now = Date.now();

  const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: now };

  if (now - attempt.lastAttempt > WINDOW) {
    attempt.count = 0;
  }

  if (attempt.count >= LIMIT) {
    return next(
      new AppError("Too many login attempts, please try again later", 429),
    );
  }

  attempt.count++;
  attempt.lastAttempt = now;
  loginAttempts.set(ip, attempt);

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+refreshToken");
  if (!user) return next(new AppError("User not found", 400));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new AppError("Wrong password", 400));

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
  });

  loginAttempts.delete(ip);

  res.json({
    success: true,
    message: "Login successful",
    data: {
      accessToken,
    },
  });
});

exports.refresh = catchAsync(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) return next(new AppError("No refresh token", 401));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return next(new AppError("Invalid refresh token", 401));
  }

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user) return next(new AppError("User not found", 404));

  if (user.refreshToken !== token) {
    return next(new AppError("Refresh token expired or invalidated", 401));
  }

  const accessToken = generateAccessToken({ _id: decoded.id });

  res.json({
    success: true,
    message: "Token refreshed",
    data: { accessToken },
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (token) {
    const decoded = jwt.decode(token);
    if (decoded?.id) {
      const user = await User.findById(decoded.id).select("+refreshToken");

      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
    }
  }

  res.clearCookie("refreshToken");

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});
