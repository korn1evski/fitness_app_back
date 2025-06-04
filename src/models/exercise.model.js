const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gifUrl: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      required: true,
    },
    bodyPart: {
      type: String,
      required: true,
    },
    equipment: {
      type: String,
      required: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search functionality
exerciseSchema.index({ name: "text", target: "text", bodyPart: "text" });

module.exports = mongoose.model("Exercise", exerciseSchema);
