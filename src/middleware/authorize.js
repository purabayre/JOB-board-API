const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

module.exports = (...roles) => {
  return catchAsync(async (req, res, next) => {
    // check if user role allowed
    if (!roles.includes(req.user.role)) {
      return next(new AppError("access denied", 403));
    }

    next();
  });
};
