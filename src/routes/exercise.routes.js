const express = require("express");
const router = express.Router();
const Exercise = require("../models/exercise.model");
const {
  auth,
  checkRole,
  checkPermission,
} = require("../middleware/auth.middleware");

// Get all exercises with pagination
router.get("/", auth, checkPermission(["READ"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const exercises = await Exercise.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Exercise.countDocuments();

    res.json({
      exercises,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalExercises: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get exercise by ID
router.get("/:id", auth, checkPermission(["READ"]), async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new exercise
router.post("/", auth, checkPermission(["WRITE"]), async (req, res) => {
  try {
    const exercise = new Exercise({
      ...req.body,
      createdBy: req.user.id,
    });
    const savedExercise = await exercise.save();
    res.status(201).json(savedExercise);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update exercise
router.put("/:id", auth, checkPermission(["UPDATE"]), async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    // Check if user is the creator or has admin role
    if (
      exercise.createdBy.toString() !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this exercise" });
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedExercise);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete exercise
router.delete("/:id", auth, checkPermission(["DELETE"]), async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    // Check if user is the creator or has admin role
    if (
      exercise.createdBy.toString() !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this exercise" });
    }

    await exercise.remove();
    res.json({ message: "Exercise deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search exercises
router.get(
  "/search/:query",
  auth,
  checkPermission(["READ"]),
  async (req, res) => {
    try {
      const exercises = await Exercise.find(
        { $text: { $search: req.params.query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(10);

      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
