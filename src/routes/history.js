const express = require("express");
const router = express.Router();

const History = require("../models/history");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const authenticate = require("../middleware/authenticate");

router.get(
  "/",
  authenticate,
  catchAsync(async (req, res, next) => {
    const logs = await History.find({ user: req.user.id })
      .sort("-createdAt")
      .lean();

    if (!logs.length) {
      return res.json({
        success: true,
        message: "No history found",
        data: [],
      });
    }

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  }),
);

module.exports = router;
