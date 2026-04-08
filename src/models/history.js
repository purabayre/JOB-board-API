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

// historySchema.pre(/^find/, function (next) {
//   this.where({ isArchived: false });
//   // next();
// });

module.exports = mongoose.model("History", historySchema);
