const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { runInDocker } = require("../dockerExecutor");

const TEMP_DIR = process.env.JUDGE_TEMP_DIR || path.join(__dirname, "..", "temp");

const Status = {
  SUCCESS: "success",
  RUNTIME_ERROR: "runtime_error",
  TIME_LIMIT_EXCEEDED: "time_limit_exceeded",
  COMPILATION_ERROR: "compilation_error",
  OUTPUT_LIMIT_EXCEEDED: "output_limit_exceeded",
};

// ─── Private helpers ──────────────────────────────────────────────────────────

function _createWorkspace() {
  const workspaceId   = uuid();
  const workspacePath = path.join(TEMP_DIR, workspaceId);
  // mode 0o777 + chmodSync: the runner container executes as a different UID
  // (runner) than the judge process that creates this directory. Setting world-
  // writable permissions ensures the runner can write compiled artifacts into
  // the shared bind-mounted workspace regardless of UID mapping on any host OS.
  // chmodSync is required because mkdirSync's mode option is subject to umask.
  fs.mkdirSync(workspacePath, { recursive: true, mode: 0o777 });
  fs.chmodSync(workspacePath, 0o777);
  return { workspaceId, workspacePath };
}

function _deleteWorkspace(workspacePath) {
  setImmediate(() => {
    try {
      fs.rmSync(workspacePath, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to delete workspace:", workspacePath, err.message);
    }
  });
}

/**
 * Compiles the source file already written in the workspace.
 * Returns the raw runInDocker result.
 */
async function _compile({ workspaceId, compiler, sourceFileName, executableName, compilerArgs = [] }) {
  return runInDocker({
    command: compiler,
    args: [sourceFileName, "-o", executableName, ...compilerArgs],
    cwd: `/workspace/${workspaceId}`,
    timeout: 10000,
    checkOutputLimit: false,
  });
}

/**
 * Runs the compiled executable from /workspace where it was written by _compile.
 * Returns { status, stdout, stderr, executionTime, memoryKB }.
 */
async function _runOne({ workspaceId, executableName, input }) {
  const t0 = Date.now();
  const runResult = await runInDocker({
    command: `./${executableName}`,
    cwd: `/workspace/${workspaceId}`,
    stdin: input,
    timeout: 2000,
    measureMemory: true,
  });
  const executionTime = Date.now() - t0;
  const memoryKB = runResult.memoryKB ?? null;

  if (runResult.timedOut) {
    return { status: Status.TIME_LIMIT_EXCEEDED, stdout: runResult.stdout, stderr: runResult.stderr, executionTime, memoryKB };
  }

  if (runResult.outputLimitExceeded) {
    return { status: Status.OUTPUT_LIMIT_EXCEEDED, stdout: "", stderr: "Output limit exceeded", executionTime, memoryKB };
  }

  if (runResult.exitCode !== 0) {
    return { status: Status.RUNTIME_ERROR, stdout: runResult.stdout, stderr: runResult.stderr, executionTime, memoryKB };
  }

  return { status: Status.SUCCESS, stdout: runResult.stdout, stderr: runResult.stderr, executionTime, memoryKB };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Single-run execution. Used by the "Run Code" endpoint.
 * Behaviour is unchanged from the original implementation.
 */
async function execute({ code, input, sourceFileName, executableName, compiler, compilerArgs = [] }) {
  const { workspaceId, workspacePath } = _createWorkspace();

  fs.writeFileSync(path.join(workspacePath, sourceFileName), code);

  const compileResult = await _compile({ workspaceId, compiler, sourceFileName, executableName, compilerArgs });

  if (compileResult.exitCode !== 0) {
    _deleteWorkspace(workspacePath);
    return { status: Status.COMPILATION_ERROR, stdout: "", stderr: compileResult.stderr };
  }

  const result = await _runOne({ workspaceId, executableName, input });

  _deleteWorkspace(workspacePath);

  return result;
}

/**
 * Multi-testcase execution. Used by the "Submit" endpoint.
 * Compiles once, executes once per test case, stops on first non-SUCCESS result.
 *
 * Returns { compilationError, compileResult?, results }:
 *   - compilationError: true  → compileResult contains the compiler output, results is []
 *   - compilationError: false → results is an array of { status, stdout, stderr }, one per
 *                               test case executed (may be fewer than testCases.length if
 *                               an execution failure caused early exit)
 *
 * Comparison and verdict generation are the responsibility of judgeService.
 *
 * @param {string} code
 * @param {{ input: string }[]} testCases  sorted by orderIndex
 * @param {{ sourceFileName, executableName, compiler, compilerArgs? }} compilerConfig
 */
async function judge(code, testCases, { sourceFileName, executableName, compiler, compilerArgs = [] }) {
  const { workspaceId, workspacePath } = _createWorkspace();
  const results = [];

  try {
    fs.writeFileSync(path.join(workspacePath, sourceFileName), code);

    // Compile once
    const compileResult = await _compile({ workspaceId, compiler, sourceFileName, executableName, compilerArgs });

    if (compileResult.exitCode !== 0) {
      return {
        compilationError: true,
        compileResult: { status: Status.COMPILATION_ERROR, stdout: "", stderr: compileResult.stderr },
        results: [],
      };
    }

    // Execute once per test case, stop on first execution failure
    for (const testCase of testCases) {
      const result = await _runOne({ workspaceId, executableName, input: testCase.input });
      results.push(result);

      if (result.status !== Status.SUCCESS) {
        break;
      }
    }

    const maxExecutionTime = results.reduce((max, r) => Math.max(max, r.executionTime ?? 0), 0);
    const peakMemoryKB = results.reduce((max, r) => {
      if (r.memoryKB == null) return max;
      return max === null ? r.memoryKB : Math.max(max, r.memoryKB);
    }, null);
    const runnerReturn = { compilationError: false, results, executionTime: maxExecutionTime, peakMemoryKB };
    console.log("[RUNNER compiledRunner]", JSON.stringify({ executionTime: maxExecutionTime, peakMemoryKB, resultCount: results.length, firstResult: results[0] }));
    return runnerReturn;

  } finally {
    _deleteWorkspace(workspacePath);
  }
}

module.exports = { execute, judge, Status };
