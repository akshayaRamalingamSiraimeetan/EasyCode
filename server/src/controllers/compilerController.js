const judge = require("../../../judge/judgeService");
const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");
const Submission = require("../models/Submission");

/*
 * Run code against all PUBLIC test cases, then optionally against custom input.
 * POST /api/compiler/run
 * Run executions are NEVER saved to the Submission collection.
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

    const problem = await Problem.findOne({ id: problemId });
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found." });
    }

    const publicTestCases = await TestCase.find({ problemId, isHidden: false })
      .sort({ orderIndex: 1 })
      .select("-_id -__v");

    const results = [];

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

      if (runResult.status !== "success") {
        results.push({
          type: "public",
          name: `Test ${i + 1}`,
          status: runResult.status,
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
 * Saves a Submission document for every attempt regardless of verdict.
 * POST /api/compiler/submit
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

    // ── Persist every submission attempt ────────────────────────────────────
    // Fire-and-forget style: we don't let a DB write failure break the
    // response. The verdict is already computed so we send it regardless.
    try {
      await Submission.create({
        userId:       req.user.id,
        username:     req.user.username,
        problemId:    problem.id,
        problemTitle: problem.title,
        language,
        code,
        verdict:      verdict.status,
        passed:       verdict.passed  ?? 0,
        total:        verdict.total   ?? testCases.length,
      });
    } catch (saveErr) {
      // Log but do not surface to the user — the verdict is still valid.
      console.error("[Submission] Failed to save submission:", saveErr.message);
    }

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
