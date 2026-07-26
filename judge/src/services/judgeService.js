"use strict";

/**
 * judgeService.js
 *
 * Orchestrates language runners. Owns all verdict logic:
 * output comparison, passed/total counts, and status mapping.
 *
 * This file is an exact copy of the original judgeService — no logic changed.
 */

const pythonRunner = require("../runners/pythonRunner");
const cRunner      = require("../runners/cRunner");
const cppRunner    = require("../runners/cppRunner");
const javaRunner   = require("../runners/javaRunner");

// ─── Runner registry ──────────────────────────────────────────────────────────

const runners = {
  python: pythonRunner,
  c:      cRunner,
  cpp:    cppRunner,
  java:   javaRunner,
};

// ─── Private helpers ──────────────────────────────────────────────────────────

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
 * Single-run execution.  Used by POST /execute.
 *
 * @param {string} language
 * @param {string} code
 * @param {string} input
 * @returns {Promise<{ status: string, stdout: string, stderr: string }>}
 */
async function execute(language, code, input) {
  const runner = runners[language];
  if (!runner) throw new Error(`Unsupported language: ${language}`);
  return runner.execute(code, input);
}

/**
 * Multi-testcase judging.  Used by POST /judge.
 *
 * @param {string} language
 * @param {string} code
 * @param {{ input: string, expectedOutput: string }[]} testCases
 * @returns {Promise<object>} verdict
 */
async function judge(language, code, testCases) {
  const runner = runners[language];
  if (!runner) throw new Error(`Unsupported language: ${language}`);

  const total = testCases.length;

  const runnerResult = await runner.judge(code, testCases);

  if (runnerResult.compilationError) {
    return {
      status: "compilation_error",
      passed: 0,
      total,
      stderr: runnerResult.compileResult.stderr,
    };
  }

  for (let i = 0; i < runnerResult.results.length; i++) {
    const runResult = runnerResult.results[i];
    const testCase  = testCases[i];

    if (runResult.status !== "success") {
      return _buildExecutionFailure(runResult.status, runResult, i, total, i + 1);
    }

    const actual   = runResult.stdout.trimEnd();
    const expected = testCase.expectedOutput.trimEnd();

    if (actual !== expected) {
      return {
        status: "wrong_answer",
        passed: i,
        total,
        failedTestCase: i + 1,
        expectedOutput: expected,
        actualOutput:   actual,
      };
    }
  }

  return { status: "accepted", passed: total, total };
}

module.exports = { execute, judge };
