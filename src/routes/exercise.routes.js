const express = require("express");
const router = express.Router();
const Exercise = require("../models/exercise.model");
const {
  auth,
  checkRole,
  checkPermission,
} = require("../middleware/auth.middleware");

// Get all exercises (public + user's private)
router.get("/", auth, checkPermission(["READ"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { visibility: "public" },
        { visibility: "private", user: req.user.id },
      ],
    };

    const exercises = await Exercise.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Exercise.countDocuments(query);

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

// Get exercise by ID (only if public or user's private)
router.get("/:id", auth, checkPermission(["READ"]), async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (
      !exercise ||
      (exercise.visibility === "private" &&
        exercise.user &&
        exercise.user.toString() !== req.user.id)
    ) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new exercise (allow setting visibility)
router.post("/", auth, checkPermission(["WRITE"]), async (req, res) => {
  try {
    const { visibility = "private" } = req.body;
    const exercise = new Exercise({
      ...req.body,
      user: req.user.id,
      isCustom: true,
      visibility,
    });
    const savedExercise = await exercise.save();
    res.status(201).json(savedExercise);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update exercise (only if user's own private or creator of public)
router.put("/:id", auth, checkPermission(["UPDATE"]), async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    // Only allow update if:
    // - private and user is owner
    // - public and user is creator
    if (
      (exercise.visibility === "private" &&
        exercise.user &&
        exercise.user.toString() !== req.user.id) ||
      (exercise.visibility === "public" &&
        exercise.user &&
        exercise.user.toString() !== req.user.id)
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

// Delete exercise (only if user's own private or creator of public)
router.delete("/:id", auth, checkPermission(["DELETE"]), async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    if (
      (exercise.visibility === "private" &&
        exercise.user &&
        exercise.user.toString() !== req.user.id) ||
      (exercise.visibility === "public" &&
        exercise.user &&
        exercise.user.toString() !== req.user.id)
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

// Search exercises (public + user's private)
router.get(
  "/search/:query",
  auth,
  checkPermission(["READ"]),
  async (req, res) => {
    try {
      const query = {
        $and: [
          { $text: { $search: req.params.query } },
          {
            $or: [
              { visibility: "public" },
              { visibility: "private", user: req.user.id },
            ],
          },
        ],
      };
      const exercises = await Exercise.find(query, {
        score: { $meta: "textScore" },
      })
        .sort({ score: { $meta: "textScore" } })
        .limit(10);

      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
