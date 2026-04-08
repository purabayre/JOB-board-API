const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: Object,
      default: {},
    },
    deletedAt: {
      type: Date,
      default: new Date(),
    },
  },
  { timestamps: true },
);

historySchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
  // return next();
});

module.exports = mongoose.model("History", historySchema);
