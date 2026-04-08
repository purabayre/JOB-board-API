const mongoose = require("mongoose");
const History = require("../models/history");

exports.logHistory = async (userId, action, details = {}) => {
  try {
    await History.create({
      user: userId,
      action,
      details,
    });
  } catch (err) {
    console.log(err);
  }
};
