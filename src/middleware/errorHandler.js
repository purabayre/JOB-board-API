module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV !== "production") {
    console.error("ERROR ", err);
  }

  if (process.env.NODE_ENV === "production") {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        details: err.details || [],
      });
    }

    console.error("UNEXPECTED ERROR ", err);

    return res.status(500).json({
      success: false,
      status: "error",
      message: "Something went wrong on our server.",
    });
  }

  return res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
    details: err.details || [],
  });
};
