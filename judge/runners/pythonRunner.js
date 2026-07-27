const fs   = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { runInDocker } = require("../dockerExecutor");

// JUDGE_TEMP_DIR — container-visible path for workspace files.
// See dockerExecutor.js for the HOST_JUDGE_TEMP_DIR counterpart.
const TEMP_DIR = process.env.JUDGE_TEMP_DIR || path.join(__dirname, "..", "temp");

const Status = {
  SUCCESS:               "success",
  RUNTIME_ERROR:         "runtime_error",
  TIME_LIMIT_EXCEEDED:   "time_limit_exceeded",
  OUTPUT_LIMIT_EXCEEDED: "output_limit_exceeded",
};

// ─── Private helpers ──────────────────────────────────────────────────────────

function _deleteWorkspace(workspacePath) {
  setImmediate(() => {
    try {
      fs.rmSync(workspacePath, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to delete workspace:", err.message);
    }
  });
}

function _mapRunResult(result) {
  if (result.timedOut)            return { status: Status.TIME_LIMIT_EXCEEDED,   stdout: result.stdout, stderr: result.stderr };
  if (result.outputLimitExceeded) return { status: Status.OUTPUT_LIMIT_EXCEEDED, stdout: "",            stderr: "Output limit exceeded" };
  if (result.exitCode !== 0)      return { status: Status.RUNTIME_ERROR,         stdout: result.stdout, stderr: result.stderr };
  return                                 { status: Status.SUCCESS,                stdout: result.stdout, stderr: result.stderr };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Single-run execution. Used by the "Run Code" endpoint.
 */
async function execute(code, input) {
  const workspaceId   = uuid();
  const workspacePath = path.join(TEMP_DIR, workspaceId);

  // mode 0o777 + chmodSync: runner container uses a different UID — see compiledRunner.js
  fs.mkdirSync(workspacePath, { recursive: true, mode: 0o777 });
  fs.chmodSync(workspacePath, 0o777);
  fs.writeFileSync(path.join(workspacePath, "solution.py"), code);

  const result = await runInDocker({
    command: "python3",
    args:    ["solution.py"],
    cwd:     `/workspace/${workspaceId}`,
    stdin:   input,
    timeout: 5000,
  });

  _deleteWorkspace(workspacePath);
  return _mapRunResult(result);
}

/**
 * Multi-testcase execution. Used by the "Submit" endpoint.
 * Writes the source file once, executes once per test case,
 * stops on first non-SUCCESS result.
 *
 * Returns { compilationError: false, results } to match the uniform
 * contract across all runners. Python has no compile step.
 *
 * @param {string} code
 * @param {{ input: string }[]} testCases  sorted by orderIndex
 */
async function judge(code, testCases) {
  const workspaceId   = uuid();
  const workspacePath = path.join(TEMP_DIR, workspaceId);
  const results       = [];

  try {
    // mode 0o777 + chmodSync: runner container uses a different UID — see compiledRunner.js
    fs.mkdirSync(workspacePath, { recursive: true, mode: 0o777 });
    fs.chmodSync(workspacePath, 0o777);
    fs.writeFileSync(path.join(workspacePath, "solution.py"), code);

    for (const testCase of testCases) {
      const runResult = await runInDocker({
        command: "python3",
        args:    ["solution.py"],
        cwd:     `/workspace/${workspaceId}`,
        stdin:   testCase.input,
        timeout: 5000,
      });

      const result = _mapRunResult(runResult);
      results.push(result);
      if (result.status !== Status.SUCCESS) break;
    }

    return { compilationError: false, results };
  } finally {
    _deleteWorkspace(workspacePath);
  }
}

module.exports = { execute, judge, Status };
