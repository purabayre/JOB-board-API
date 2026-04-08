const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: String,
    salaryMin: Number,
    salaryMax: Number,
    tags: [String],

    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: { type: Boolean, default: true },
    deadline: { type: Date, required: true },

    // ⭐ Soft Delete Fields
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Search Index
jobSchema.index({ title: "text", description: "text" });

// ⭐ Global Filter → Hide Deleted Jobs
jobSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model("Job", jobSchema);
