const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { spawn } = require("child_process");

const TEMP_DIR = path.join(__dirname, "..", "temp");

const Status = {
  SUCCESS: "success",
  RUNTIME_ERROR: "runtime_error",
  TIME_LIMIT_EXCEEDED: "time_limit_exceeded",
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
 * Executes Python code in an isolated per-submission workspace.
 *
 * Workspace layout:
 *   temp/<uuid>/
 *     solution.py
 *
 * Resolves with { status, stdout, stderr }. Never rejects.
 */
async function execute(code, input) {
  return new Promise((resolve) => {
    let settled = false;
    function settle(result) {
      if (settled) return;
      settled = true;
      resolve(result);
    }

    // ── 1. Create isolated workspace ──────────────────────────────────────────
    const workspaceId = uuid();
    const workspacePath = path.join(TEMP_DIR, workspaceId);
    fs.mkdirSync(workspacePath, { recursive: true });

    const sourcePath = path.join(workspacePath, "solution.py");

    // ── 2. Write source file ──────────────────────────────────────────────────
    fs.writeFileSync(sourcePath, code);

    // ── 3. Execute ────────────────────────────────────────────────────────────
    const pythonProcess = spawn("python", ["solution.py"], {
      cwd: workspacePath,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => { stdout += data.toString(); });
    pythonProcess.stderr.on("data", (data) => { stderr += data.toString(); });

    pythonProcess.stdin.write(input || "");
    pythonProcess.stdin.end();

    // ── 4. Timeout ────────────────────────────────────────────────────────────
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      pythonProcess.kill("SIGKILL");
    }, 2000);

    // ── 5. Process startup failure ────────────────────────────────────────────
    pythonProcess.on("error", (err) => {
      clearTimeout(timeout);
      deleteWorkspace(workspacePath);
      settle({ status: Status.RUNTIME_ERROR, stdout, stderr: `Spawn error: ${err.message}` });
    });

    // ── 6. Process finished ───────────────────────────────────────────────────
    pythonProcess.on("close", (exitCode, signal) => {
      clearTimeout(timeout);
      deleteWorkspace(workspacePath);

      if (timedOut) {
        return settle({ status: Status.TIME_LIMIT_EXCEEDED, stdout, stderr });
      }
      if (exitCode !== 0 || signal !== null) {
        return settle({ status: Status.RUNTIME_ERROR, stdout, stderr });
      }
      settle({ status: Status.SUCCESS, stdout, stderr });
    });
  });
}

module.exports = { execute, Status };
