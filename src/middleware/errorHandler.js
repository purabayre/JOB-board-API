module.exports = (err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Something went wrong",
    details: err.details || [],
  });
};
