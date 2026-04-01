const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: String,
    salaryMin: Number,
    salaryMax: Number,
    tags: [String],

    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

jobSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Job", jobSchema);
