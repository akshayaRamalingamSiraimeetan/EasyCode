const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { runInDocker } = require("../dockerExecutor");

const TEMP_DIR = path.join(__dirname, "..", "temp");

const Status = {
  SUCCESS: "success",
  RUNTIME_ERROR: "runtime_error",
  TIME_LIMIT_EXCEEDED: "time_limit_exceeded",
};

function deleteWorkspace(workspacePath) {
  setImmediate(() => {
    try {
      fs.rmSync(workspacePath, {
        recursive: true,
        force: true,
      });
    } catch (err) {
      console.error("Failed to delete workspace:", err.message);
    }
  });
}

async function execute(code, input) {
  const workspaceId = uuid();
  const workspacePath = path.join(TEMP_DIR, workspaceId);

  fs.mkdirSync(workspacePath, { recursive: true });

  const sourcePath = path.join(workspacePath, "solution.py");
  fs.writeFileSync(sourcePath, code);

  const result = await runInDocker({
    command: "python3",
    args: ["solution.py"],
    cwd: `/workspace/${workspaceId}`,
    stdin: input,
    timeout: 2000,
  });

  deleteWorkspace(workspacePath);

  if (result.timedOut) {
    return {
      status: Status.TIME_LIMIT_EXCEEDED,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  if (result.exitCode !== 0) {
    return {
      status: Status.RUNTIME_ERROR,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  return {
    status: Status.SUCCESS,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

module.exports = {
  execute,
  Status,
};