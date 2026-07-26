"use strict";

const { execFile } = require("child_process");

/**
 * Verifies that the Docker CLI is installed and can reach the daemon.
 *
 * Runs `docker version` once at startup. Resolves on success, rejects on
 * any failure (binary not found, socket unreachable, permission denied, etc.).
 *
 * @returns {Promise<void>}
 */
function verifyDocker() {
  return new Promise((resolve, reject) => {
    execFile("docker", ["version"], { timeout: 10_000 }, (err, _stdout, stderr) => {
      if (err) {
        // err.code === "ENOENT"  → docker binary not found
        // non-zero exit          → daemon unreachable / socket permission denied
        const detail = stderr?.trim() || err.message;
        return reject(new Error(detail));
      }
      resolve();
    });
  });
}

/**
 * Verifies that the runner image exists in the local Docker image store.
 *
 * Runs `docker image inspect <image>` once at startup. Resolves on success,
 * rejects if the image is not found or the inspect command fails.
 *
 * @param {string} image  Full image reference, e.g. "easycode-runner:latest"
 * @returns {Promise<void>}
 */
function verifyRunnerImage(image) {
  return new Promise((resolve, reject) => {
    execFile("docker", ["image", "inspect", image], { timeout: 10_000 }, (err, _stdout, stderr) => {
      if (err) {
        const detail = stderr?.trim() || err.message;
        return reject(new Error(detail));
      }
      resolve();
    });
  });
}

module.exports = { verifyDocker, verifyRunnerImage };
