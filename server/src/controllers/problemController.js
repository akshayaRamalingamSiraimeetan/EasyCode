const Problem = require("../models/Problem");

/*
 Create a new problem
 */
const createProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      constraints,
    } = req.body;

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

module.exports = {
  createProblem,
};