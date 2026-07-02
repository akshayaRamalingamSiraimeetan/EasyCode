const Problem = require("../models/Problem");

/*
 Create a new problem
 */
const createProblem = async (req, res) => {
  try {
    const { title, description, difficulty, constraints } = req.body;

    // Validate input
    if (!title || !description || !difficulty) {
      return res.status(400).json({
        success: false,
        message: "Title, description and difficulty are required.",
      });
    }

    // Check duplicate title
    const existingProblem = await Problem.findOne({ title });

    if (existingProblem) {
      return res.status(409).json({
        success: false,
        message: "Problem with this title already exists.",
      });
    }

    // Create problem
    const problem = new Problem({
      title,
      description,
      difficulty,
      constraints,
      createdBy: req.user.id,
    });

    await problem.save();

    return res.status(201).json({
      success: true,
      message: "Problem created successfully.",
      problem,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/*
 * Get all problems
 */
const getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find({})
      .sort({ createdAt: -1 })
      .select("-_id -__v");

    return res.status(200).json({
      success: true,
      count: problems.length,
      problems,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/*
 * Get problem by UUID
 */
const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await Problem.findOne({ id }).select("-_id -__v");

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    return res.status(200).json({
      success: true,
      problem,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/*
 * Update Problem
 */
const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const { title, description, difficulty, constraints } = req.body;

    const problem = await Problem.findOne({ id });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    // Ownership check
    if (problem.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this problem.",
      });
    }

    problem.title = title ?? problem.title;
    problem.description = description ?? problem.description;
    problem.difficulty = difficulty ?? problem.difficulty;
    problem.constraints = constraints ?? problem.constraints;

    problem.updatedAt = new Date();

    await problem.save();

    return res.status(200).json({
      success: true,
      message: "Problem updated successfully.",
      problem,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/*
 * Delete Problem
 */
const deleteProblem = async (req, res) => {
  try {

    const { id } = req.params;

    const problem = await Problem.findOne({ id });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    if (problem.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this problem.",
      });
    }

    await Problem.deleteOne({ id });

    return res.status(200).json({
      success: true,
      message: "Problem deleted successfully.",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });

  }
};

module.exports = {
  createProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
};
