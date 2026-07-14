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

async function execute({
  code,
  input,
  sourceFileName,
  executableName,
  compiler,
  compilerArgs = [],
}) {
  return new Promise(async (resolve) => {
    let settled = false;

    function settle(result) {
      if (settled) return;
      settled = true;
      resolve(result);
    }

    const workspaceId = uuid();
    const workspacePath = path.join(TEMP_DIR, workspaceId);

    fs.mkdirSync(workspacePath, { recursive: true });

    const sourcePath = path.join(workspacePath, sourceFileName);

    fs.writeFileSync(sourcePath, code);

    const compileResult = await runInDocker({
      command: compiler,
      args: [
        sourceFileName,
        "-o",
        executableName,
        ...compilerArgs,
      ],
      cwd: `/workspace/${workspaceId}`,
      timeout: 10000,
    });

    if (compileResult.exitCode !== 0) {
      deleteWorkspace(workspacePath);

      return settle({
        status: Status.COMPILATION_ERROR,
        stdout: "",
        stderr: compileResult.stderr,
      });
    }

    const runResult = await runInDocker({
      command: `./${executableName}`,
      cwd: `/workspace/${workspaceId}`,
      stdin: input,
      timeout: 2000,
    });

    deleteWorkspace(workspacePath);

    if (runResult.timedOut) {
      return settle({
        status: Status.TIME_LIMIT_EXCEEDED,
        stdout: runResult.stdout,
        stderr: runResult.stderr,
      });
    }

    if (runResult.exitCode !== 0) {
      return settle({
        status: Status.RUNTIME_ERROR,
        stdout: runResult.stdout,
        stderr: runResult.stderr,
      });
    }

    return settle({
      status: Status.SUCCESS,
      stdout: runResult.stdout,
      stderr: runResult.stderr,
    });
  });
}

module.exports = { execute, Status };