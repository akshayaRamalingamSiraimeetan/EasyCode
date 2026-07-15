const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");

/*
 * Create a test case for a problem
 * POST /api/problems/:id/testcases
 */
const createTestCase = async (req, res) => {
  try {
    const { id: problemId } = req.params;
    const { input, expectedOutput, isHidden, orderIndex } = req.body;

    // Validate required fields
    // Use trim() only to check for blank strings — raw values are stored as-is
    // because whitespace can be significant in test case input/output
    if (input === undefined || input === null || input.toString().trim() === "") {
      return res.status(400).json({
        success: false,
        message: "input is required.",
      });
    }

    if (
      expectedOutput === undefined ||
      expectedOutput === null ||
      expectedOutput.toString().trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "expectedOutput is required.",
      });
    }

    if (orderIndex !== undefined && orderIndex < 0) {
      return res.status(400).json({
        success: false,
        message: "orderIndex cannot be negative.",
      });
    }

    // Verify the problem exists
    const problem = await Problem.findOne({ id: problemId });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    // Reject duplicate test cases (same problem + input + expectedOutput)
    const duplicate = await TestCase.findOne({ problemId, input, expectedOutput });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Duplicate test case already exists.",
      });
    }

    const testCase = new TestCase({
      problemId,
      input,
      expectedOutput,
      isHidden: isHidden ?? false,
      orderIndex: orderIndex ?? 0,
    });

    await testCase.save();

    return res.status(201).json({
      success: true,
      message: "Test case created successfully.",
      testCase,
    });
  } catch (error) {
    // Concurrent duplicate insert — Mongo unique index rejected the second write
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate test case already exists.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/*
 * Get all test cases for a problem
 * GET /api/problems/:id/testcases
 */
const getTestCasesByProblem = async (req, res) => {
  try {
    const { id: problemId } = req.params;

    // Verify the problem exists
    const problem = await Problem.findOne({ id: problemId });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    const testCases = await TestCase.find({ problemId })
      .sort({ orderIndex: 1 })
      .select("-_id -__v");

    return res.status(200).json({
      success: true,
      count: testCases.length,
      testCases,
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
 * Update a test case
 * PUT /api/problems/testcases/:tcId
 */
const updateTestCase = async (req, res) => {
  try {
    const { tcId } = req.params;
    const { input, expectedOutput, isHidden, orderIndex } = req.body;

    const testCase = await TestCase.findOne({ id: tcId });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: "Test case not found.",
      });
    }

    testCase.input = input ?? testCase.input;
    testCase.expectedOutput = expectedOutput ?? testCase.expectedOutput;
    testCase.isHidden = isHidden ?? testCase.isHidden;

    if (orderIndex !== undefined && orderIndex < 0) {
      return res.status(400).json({
        success: false,
        message: "orderIndex cannot be negative.",
      });
    }

    testCase.orderIndex = orderIndex ?? testCase.orderIndex;
    testCase.updatedAt = Date.now();

    await testCase.save();

    return res.status(200).json({
      success: true,
      message: "Test case updated successfully.",
      testCase,
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
 * Delete a test case
 * DELETE /api/problems/testcases/:tcId
 */
const deleteTestCase = async (req, res) => {
  try {
    const { tcId } = req.params;

    const testCase = await TestCase.findOne({ id: tcId });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: "Test case not found.",
      });
    }

    await TestCase.deleteOne({ id: tcId });

    return res.status(200).json({
      success: true,
      message: "Test case deleted successfully.",
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
  createTestCase,
  getTestCasesByProblem,
  updateTestCase,
  deleteTestCase,
};
