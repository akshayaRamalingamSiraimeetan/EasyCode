"use strict";

const fs   = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { runInDocker } = require("../dockerExecutor");

const TEMP_DIR = path.join(__dirname, "..", "..", "temp");

const Status = {
  SUCCESS:              "success",
  RUNTIME_ERROR:        "runtime_error",
  TIME_LIMIT_EXCEEDED:  "time_limit_exceeded",
  COMPILATION_ERROR:    "compilation_error",
  OUTPUT_LIMIT_EXCEEDED:"output_limit_exceeded",
};

// ─── Private helpers ──────────────────────────────────────────────────────────

function _deleteWorkspace(workspacePath) {
  setImmediate(() => {
    try {
      fs.rmSync(workspacePath, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to delete workspace:", workspacePath, err.message);
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

async function execute(code, input) {
  const workspaceId   = uuid();
  const workspacePath = path.join(TEMP_DIR, workspaceId);

  fs.mkdirSync(workspacePath, { recursive: true });
  fs.writeFileSync(path.join(workspacePath, "Main.java"), code);

  const compileResult = await runInDocker({
    command: "javac",
    args:    ["Main.java"],
    cwd:     `/workspace/${workspaceId}`,
    checkOutputLimit: false,
  });

  if (compileResult.exitCode !== 0) {
    _deleteWorkspace(workspacePath);
    return { status: Status.COMPILATION_ERROR, stdout: "", stderr: compileResult.stderr };
  }

  const runResult = await runInDocker({
    command: "java",
    args:    ["Main"],
    cwd:     `/workspace/${workspaceId}`,
    stdin:   input,
    timeout: 5000,
  });

  _deleteWorkspace(workspacePath);
  return _mapRunResult(runResult);
}

async function judge(code, testCases) {
  const workspaceId   = uuid();
  const workspacePath = path.join(TEMP_DIR, workspaceId);
  const results       = [];

  try {
    fs.mkdirSync(workspacePath, { recursive: true });
    fs.writeFileSync(path.join(workspacePath, "Main.java"), code);

    const compileResult = await runInDocker({
      command: "javac",
      args:    ["Main.java"],
      cwd:     `/workspace/${workspaceId}`,
      checkOutputLimit: false,
    });

    if (compileResult.exitCode !== 0) {
      return {
        compilationError: true,
        compileResult: { status: Status.COMPILATION_ERROR, stdout: "", stderr: compileResult.stderr },
        results: [],
      };
    }

    for (const testCase of testCases) {
      const runResult = await runInDocker({
        command: "java",
        args:    ["Main"],
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
