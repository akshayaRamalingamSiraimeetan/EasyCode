const judge = require("../../../judge/judgeService");
const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");

/*
 * Run code against custom input (no test cases).
 * Unchanged from the original implementation.
 */
const runCode = async (req, res) => {
  try {
    const { language, code, input } = req.body;

    const result = await judge.execute(language, code, input);

    return res.status(200).json({
      success: result.status === "success",
      status: result.status,
      output: result.stdout,
      error: result.stderr,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: "internal_error",
      message: error.message,
    });
  }
};

/*
 * Submit solution for judging against all stored test cases.
 * POST /api/compiler/submit
 */
const submitSolution = async (req, res) => {
  try {
    const { language, code, problemId } = req.body;

    // Validate required fields
    if (!language || !code || !problemId) {
      return res.status(400).json({
        success: false,
        message: "language, code, and problemId are required.",
      });
    }

    // Fetch the problem
    const problem = await Problem.findOne({ id: problemId });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    // Fetch all test cases sorted by display order
    const testCases = await TestCase.find({ problemId })
      .sort({ orderIndex: 1 })
      .select("-_id -__v");

    if (testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No test cases found for this problem.",
      });
    }

    // Delegate all judging to judgeService
    const verdict = await judge.judge(language, code, testCases);

    return res.status(200).json({
      success: verdict.status === "accepted",
      verdict,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      status: "internal_error",
      message: error.message,
    });
  }
};

module.exports = { runCode, submitSolution };
