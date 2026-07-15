const judge = require("../../../judge/judgeService");
const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");

/*
 * Run code against all PUBLIC test cases, then optionally against custom input.
 * POST /api/compiler/run
 *
 * Body: { language, code, problemId, input? }
 *
 * Response:
 * {
 *   success: true,
 *   results: [
 *     { type: "public", name: "Test 1", status: "passed"|"wrong_answer"|"runtime_error"|...,
 *       input, expected, output, stderr? },
 *     { type: "custom", name: "Custom Input", status: "executed"|"error",
 *       input, output, stderr? }
 *   ]
 * }
 *
 * Hidden test cases are NEVER executed here.
 * Execution continues past failing public test cases (no early exit).
 */
const runCode = async (req, res) => {
  try {
    const { language, code, problemId, input: customInput } = req.body;

    if (!language || !code || !problemId) {
      return res.status(400).json({
        success: false,
        message: "language, code, and problemId are required.",
      });
    }

    // Fetch the problem
    const problem = await Problem.findOne({ id: problemId });
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found." });
    }

    // Fetch only public (non-hidden) test cases
    const publicTestCases = await TestCase.find({ problemId, isHidden: false })
      .sort({ orderIndex: 1 })
      .select("-_id -__v");

    const results = [];

    // ── Execute each public test case individually ──────────────────────────
    for (let i = 0; i < publicTestCases.length; i++) {
      const tc = publicTestCases[i];
      let runResult;

      try {
        runResult = await judge.execute(language, code, tc.input);
      } catch (execErr) {
        results.push({
          type: "public",
          name: `Test ${i + 1}`,
          status: "runtime_error",
          input: tc.input,
          expected: tc.expectedOutput,
          output: "",
          stderr: execErr.message,
        });
        continue;
      }

      // Map execution status to verdict status
      if (runResult.status !== "success") {
        results.push({
          type: "public",
          name: `Test ${i + 1}`,
          status: runResult.status, // runtime_error | time_limit_exceeded | etc.
          input: tc.input,
          expected: tc.expectedOutput,
          output: runResult.stdout ?? "",
          stderr: runResult.stderr ?? "",
        });
        continue;
      }

      const actual   = (runResult.stdout ?? "").trimEnd();
      const expected = tc.expectedOutput.trimEnd();

      results.push({
        type: "public",
        name: `Test ${i + 1}`,
        status: actual === expected ? "passed" : "wrong_answer",
        input: tc.input,
        expected: tc.expectedOutput,
        output: runResult.stdout ?? "",
      });
    }

    // ── Execute custom input if provided ────────────────────────────────────
    const hasCustomInput = typeof customInput === "string" && customInput.trim() !== "";

    if (hasCustomInput) {
      let runResult;
      try {
        runResult = await judge.execute(language, code, customInput);
      } catch (execErr) {
        results.push({
          type: "custom",
          name: "Custom Input",
          status: "error",
          input: customInput,
          output: "",
          stderr: execErr.message,
        });
        return res.status(200).json({ success: true, results });
      }

      results.push({
        type: "custom",
        name: "Custom Input",
        status: runResult.status === "success" ? "executed" : runResult.status,
        input: customInput,
        output: runResult.stdout ?? "",
        stderr: runResult.stderr ?? "",
      });
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      status: "internal_error",
      message: error.message,
    });
  }
};

/*
 * Submit solution — judges against ALL test cases (public + hidden).
 * Stops on the first failure. Hidden test case input/output is never exposed.
 * POST /api/compiler/submit  (unchanged semantics)
 */
const submitSolution = async (req, res) => {
  try {
    const { language, code, problemId } = req.body;

    if (!language || !code || !problemId) {
      return res.status(400).json({
        success: false,
        message: "language, code, and problemId are required.",
      });
    }

    const problem = await Problem.findOne({ id: problemId });
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found." });
    }

    const testCases = await TestCase.find({ problemId })
      .sort({ orderIndex: 1 })
      .select("-_id -__v");

    if (testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No test cases found for this problem.",
      });
    }

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
