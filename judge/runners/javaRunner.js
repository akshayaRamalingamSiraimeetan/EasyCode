const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { runInDocker } = require("../dockerExecutor");

const TEMP_DIR = path.join(__dirname, "..", "temp");

const Status = {
  SUCCESS: "success",
  RUNTIME_ERROR: "runtime_error",
  TIME_LIMIT_EXCEEDED: "time_limit_exceeded",
  COMPILATION_ERROR: "compilation_error",
  OUTPUT_LIMIT_EXCEEDED: "output_limit_exceeded",
};

function deleteWorkspace(workspacePath) {
  setImmediate(() => {
    try {
      fs.rmSync(workspacePath, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to delete workspace:", workspacePath, err.message);
    }
  });
}

/**
 * Executes Java code in an isolated per-submission workspace.
 *
 * Resolves with { status, stdout, stderr }. Never rejects.
 */
async function execute(code, input) {
  return new Promise(async (resolve) => {
    let settled = false;

    function settle(result) {
      if (settled) return;
      settled = true;
      resolve(result);
    }

    // 1. Create workspace
    const workspaceId = uuid();
    const workspacePath = path.join(TEMP_DIR, workspaceId);

    fs.mkdirSync(workspacePath, { recursive: true });

    // 2. Write source
    const sourcePath = path.join(workspacePath, "Main.java");
    fs.writeFileSync(sourcePath, code);

    // 3. Compile inside Docker
    const compileResult = await runInDocker({
      command: "javac",
      args: ["Main.java"],
      cwd: `/workspace/${workspaceId}`,
      checkOutputLimit: false,
    });

    if (compileResult.exitCode !== 0) {
      deleteWorkspace(workspacePath);

      return settle({
        status: Status.COMPILATION_ERROR,
        stdout: "",
        stderr: compileResult.stderr,
      });
    }

    // 4. Execute inside Docker
    const executionResult = await runInDocker({
      command: "java",
      args: ["Main"],
      cwd: `/workspace/${workspaceId}`,
      stdin: input,
      timeout: 5000,
    });

    deleteWorkspace(workspacePath);

    if (executionResult.timedOut) {
      return settle({
        status: Status.TIME_LIMIT_EXCEEDED,
        stdout: executionResult.stdout,
        stderr: executionResult.stderr,
      });
    }

    if (executionResult.outputLimitExceeded) {
      return settle({
        status: Status.RUNTIME_ERROR,
        stdout: "",
        stderr: "Output limit exceeded",
      });
    }

    if (executionResult.exitCode !== 0) {
      return settle({
        status: Status.RUNTIME_ERROR,
        stdout: executionResult.stdout,
        stderr: executionResult.stderr,
      });
    }

    return settle({
      status: Status.SUCCESS,
      stdout: executionResult.stdout,
      stderr: executionResult.stderr,
    });
  });
}

module.exports = { execute, Status };