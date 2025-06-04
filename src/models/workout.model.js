const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    exercises: [
      {
        exercise: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exercise",
        },
        sets: Number,
        reps: Number,
        weight: Number,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Workout", workoutSchema);
