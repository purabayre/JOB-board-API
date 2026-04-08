const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resumePath: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "reviewed", "rejected"],
      default: "pending",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
    receiptPath: {
      type: String,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

applicationSchema.pre(/^find/, function (next) {
  this.where({ isArchived: false });
  next();
});

module.exports = mongoose.model("Application", applicationSchema);
