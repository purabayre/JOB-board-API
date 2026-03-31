const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

module.exports = catchAsync(async (req, res, next) => {
  // 1) Get token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No token provided", 401));
  }

  const token = authHeader.split(" ")[1];

  // 2) Verify token safely
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError("Invalid or expired token", 401));
  }

  // 3) Attach user data
  req.user = decoded;
  next();
});
