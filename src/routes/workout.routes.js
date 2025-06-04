const express = require("express");
const router = express.Router();
const Workout = require("../models/workout.model");
const { auth, checkPermission } = require("../middleware/auth.middleware");

// Get all workouts for the authenticated user with pagination
router.get("/", auth, checkPermission(["READ"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const workouts = await Workout.find({ user: req.user.id })
      .populate("exercises.exercise")
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });

    const total = await Workout.countDocuments({ user: req.user.id });

    res.json({
      workouts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalWorkouts: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get workout by ID
router.get("/:id", auth, checkPermission(["READ"]), async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("exercises.exercise");

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    res.json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new workout
router.post("/", auth, checkPermission(["WRITE"]), async (req, res) => {
  try {
    const workout = new Workout({
      ...req.body,
      user: req.user.id,
    });
    const savedWorkout = await workout.save();
    const populatedWorkout = await Workout.findById(savedWorkout._id).populate(
      "exercises.exercise"
    );
    res.status(201).json(populatedWorkout);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update workout
router.put("/:id", auth, checkPermission(["UPDATE"]), async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    const updatedWorkout = await Workout.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("exercises.exercise");

    res.json(updatedWorkout);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete workout
router.delete("/:id", auth, checkPermission(["DELETE"]), async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    await workout.remove();
    res.json({ message: "Workout deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
