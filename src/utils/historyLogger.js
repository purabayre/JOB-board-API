const History = require("../models/history");

exports.logHistory = async (userId, action, details = {}) => {
  try {
    await History.create({
      user: userId,
      action,
      details,
    });
    History.save();
  } catch (err) {
    console.log(err.message);
  }
};
