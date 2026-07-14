const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { spawn } = require("child_process");

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

/**
 * Kills a process and its entire child process tree.
 * Uses taskkill on Windows to ensure child JVM processes are also terminated,
 * which allows the 'close' event to fire reliably.
 */
function killProcessTree(proc) {
  if (process.platform === "win32") {
    spawn("taskkill", ["/F", "/T", "/PID", proc.pid.toString()], { stdio: "ignore" });
  } else {
    proc.kill("SIGKILL");
  }
}

/**
 * Executes Java code in an isolated per-submission workspace.
 *
 * Workspace layout:
 *   temp/<uuid>/
 *     Main.java
 *     Main.class
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

    const sourcePath = path.join(workspacePath, "Main.java");
    fs.writeFileSync(sourcePath, code);

    // ── 2. Compile ────────────────────────────────────────────────────────────
    const compilerProcess = spawn("javac", ["Main.java"], {
      cwd: workspacePath,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let compileError = "";
    compilerProcess.stderr.on("data", (data) => { compileError += data.toString(); });

    compilerProcess.on("error", (err) => {
      deleteWorkspace(workspacePath);
      settle({ status: Status.COMPILATION_ERROR, stdout: "", stderr: `Compiler error: ${err.message}` });
    });

    compilerProcess.on("close", (exitCode) => {
      if (exitCode !== 0) {
        deleteWorkspace(workspacePath);
        return settle({ status: Status.COMPILATION_ERROR, stdout: "", stderr: compileError });
      }

      // ── 3. Execute ────────────────────────────────────────────────────────
      const programProcess = spawn("java", ["Main"], {
        cwd: workspacePath,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      programProcess.stdout.on("data", (data) => { stdout += data.toString(); });
      programProcess.stderr.on("data", (data) => { stderr += data.toString(); });

      programProcess.stdin.write(input || "");
      programProcess.stdin.end();

      // ── 4. Timeout ──────────────────────────────────────────────────────────
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        killProcessTree(programProcess);
      }, 5000);

      programProcess.on("error", (err) => {
        clearTimeout(timeout);
        deleteWorkspace(workspacePath);
        settle({ status: Status.RUNTIME_ERROR, stdout, stderr: `Spawn error: ${err.message}` });
      });

      programProcess.on("close", (exitCode, signal) => {
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
  });
}

module.exports = { execute, Status };
