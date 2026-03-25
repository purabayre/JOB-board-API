const User = require("../models/user");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

exports.register = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError("Validation failed", 400));
  }

  const { name, email, password, role, company } = req.body;

  //Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email is already registered", 400));
  }
  if (role === "employer" && !companyName) {
    return next(
      new AppError("Company name is required for employer accounts", 400),
    );
  }

  // Create user if not exists
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    message: "User registered",
    data: user,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 400));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new AppError("Wrong password", 400));

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
  });

  res.json({
    success: true,
    message: "Login successful",
    data: { accessToken },
  });
});

exports.refresh = catchAsync(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) return next(new AppError("No refresh token", 401));

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  const accessToken = generateAccessToken({ _id: decoded.id });

  res.json({
    success: true,
    message: "Token refreshed",
    data: { accessToken },
  });
});

exports.logout = catchAsync(async (req, res) => {
  res.clearCookie("refreshToken");

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});
