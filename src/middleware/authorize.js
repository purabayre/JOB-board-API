module.exports = (...roles) => {
  return (req, res, next) => {
    // check if user role allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    next();
  };
};
