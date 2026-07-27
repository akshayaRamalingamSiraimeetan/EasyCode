"use strict";

require("dotenv").config();

const app            = require("./app");
const { verifyDocker, verifyRunnerImage } = require("./utils/verifyDocker");

const PORT         = process.env.PORT         || 7000;
const RUNNER_IMAGE = process.env.RUNNER_IMAGE || "easycode-runner:latest";

async function start() {
  // ── Startup configuration log ─────────────────────────────────────────────
  const JUDGE_TEMP_DIR_ENV  = process.env.JUDGE_TEMP_DIR;
  const HOST_TEMP_DIR_ENV   = process.env.HOST_JUDGE_TEMP_DIR;
  const DOCKER_SOCKET       = process.env.DOCKER_SOCKET  || "/var/run/docker.sock";
  const TEMP_DIR_RESOLVED   = JUDGE_TEMP_DIR_ENV || require("path").join(__dirname, "..", "temp");

  console.log("[Judge API] ── startup configuration ──────────────────────────");
  console.log("[Judge API] process.cwd()        :", process.cwd());
  console.log("[Judge API] __dirname            :", __dirname);
  console.log("[Judge API] JUDGE_TEMP_DIR       :", JUDGE_TEMP_DIR_ENV ? `${JUDGE_TEMP_DIR_ENV} (from env)` : `${TEMP_DIR_RESOLVED} (fallback)`);
  console.log("[Judge API] HOST_JUDGE_TEMP_DIR  :", HOST_TEMP_DIR_ENV  ? `${HOST_TEMP_DIR_ENV} (from env)`  : `(not set — defaults to JUDGE_TEMP_DIR)`);
  console.log("[Judge API] RUNNER_IMAGE         :", RUNNER_IMAGE);
  console.log("[Judge API] DOCKER_SOCKET        :", DOCKER_SOCKET);
  console.log("[Judge API] PORT                 :", PORT);
  console.log("[Judge API] ────────────────────────────────────────────────────");
  // ── Docker connectivity check ─────────────────────────────────────────────
  try {
    await verifyDocker();
    console.log("[Judge API] Docker connection verified.");
  } catch (err) {
    console.error("[Judge API] Docker is unavailable:", err.message);
    console.error("[Judge API] Ensure the Docker daemon is running and the socket is accessible.");
    process.exit(1);
  }

  // ── Runner image check ────────────────────────────────────────────────────
  try {
    await verifyRunnerImage(RUNNER_IMAGE);
    console.log("[Judge API] Runner image verified.");
  } catch (err) {
    console.error(`[Judge API] Runner image "${RUNNER_IMAGE}" not found:`, err.message);
    console.error(`[Judge API] Build or pull the image before starting the service.`);
    process.exit(1);
  }

  // ── Start HTTP server ─────────────────────────────────────────────────────
  app.listen(PORT, () => {
    console.log(`[Judge API] Listening on port ${PORT}`);
  });
}

start();
