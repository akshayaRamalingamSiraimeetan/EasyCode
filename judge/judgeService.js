const pythonRunner = require("./runners/pythonRunner");
const cRunner = require("./runners/cRunner");
const cppRunner = require("./runners/cppRunner");
const javaRunner = require("./runners/javaRunner");

// ─── Runner registry ──────────────────────────────────────────────────────────

const runners = {
  python: pythonRunner,
  c: cRunner,
  cpp: cppRunner,
  java: javaRunner,
};

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Builds a verdict object for a runtime-class failure (non-SUCCESS execution status).
 * Keeps the iteration loop clean — no inline object literals per failure type.
 */
function _buildExecutionFailure(status, runResult, passed, total, failedTestCase) {
  return {
    status,
    passed,
    total,
    failedTestCase,
    stderr: runResult.stderr,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Single-run execution. Used by the "Run Code" endpoint.
 * Unchanged from the original — delegates directly to the runner.
 */
async function execute(language, code, input) {
  const runner = runners[language];

  if (!runner) {
    throw new Error(`Unsupported language: ${language}`);
  }

  return runner.execute(code, input);
}

/**
 * Multi-testcase judging. Used by the "Submit" endpoint.
 *
 * Selects the runner, delegates execution, then owns all verdict logic:
 * output normalization, comparison, passed/total counts, and status mapping.
 *
 * @param {string} language
 * @param {string} code
 * @param {{ input: string, expectedOutput: string }[]} testCases  sorted by orderIndex
 * @returns verdict object — one of:
 *   { status: "accepted",             passed, total }
 *   { status: "wrong_answer",         passed, total, failedTestCase, expectedOutput, actualOutput }
 *   { status: "runtime_error",        passed, total, failedTestCase, stderr }
 *   { status: "time_limit_exceeded",  passed, total, failedTestCase, stderr }
 *   { status: "output_limit_exceeded",passed, total, failedTestCase, stderr }
 *   { status: "compilation_error",    passed, total, stderr }
 */
async function judge(language, code, testCases) {
  const runner = runners[language];

  if (!runner) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const total = testCases.length;

  // Delegate all execution to the runner
  const runnerResult = await runner.judge(code, testCases);
  console.log("[judgeService] runnerResult =", JSON.stringify(runnerResult));

  // Compilation failed — no test cases were executed
  if (runnerResult.compilationError) {
    const verdict = {
      status: "compilation_error",
      passed: 0,
      total,
      stderr: runnerResult.compileResult.stderr,
    };
    console.log("[judgeService] returning =", JSON.stringify(verdict));
    return verdict;
  }

  // Iterate execution results alongside test cases
  for (let i = 0; i < runnerResult.results.length; i++) {
    const runResult = runnerResult.results[i];
    const testCase = testCases[i];

    // Execution failed — return immediately with context
    if (runResult.status !== "success") {
      const verdict = _buildExecutionFailure(
        runResult.status,
        runResult,
        i,
        total,
        i + 1,
      );
      console.log("[judgeService] returning =", JSON.stringify(verdict));
      return verdict;
    }

    // Compare outputs — trim trailing whitespace only
    const actual = runResult.stdout.trimEnd();
    const expected = testCase.expectedOutput.trimEnd();

    if (actual !== expected) {
      const verdict = {
        status: "wrong_answer",
        passed: i,
        total,
        failedTestCase: i + 1,
        expectedOutput: expected,
        actualOutput: actual,
      };
      console.log("[judgeService] returning =", JSON.stringify(verdict));
      return verdict;
    }
  }

  const verdict = {
    status: "accepted",
    passed: total,
    total,
    executionTime:  runnerResult.executionTime  ?? null,
    peakMemoryKB:   runnerResult.peakMemoryKB   ?? null,
    results: runnerResult.results.map((r) => ({
      executionTime: r.executionTime ?? null,
      memoryKB:      r.memoryKB      ?? null,
    })),
  };
  console.log("[judgeService] returning =", JSON.stringify(verdict));
  return verdict;
}

module.exports = { execute, judge };
