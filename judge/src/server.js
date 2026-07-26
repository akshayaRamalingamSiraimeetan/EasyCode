"use strict";

require("dotenv").config();

const app            = require("./app");
const { verifyDocker, verifyRunnerImage } = require("./utils/verifyDocker");

const PORT         = process.env.PORT         || 7000;
const RUNNER_IMAGE = process.env.RUNNER_IMAGE || "easycode-runner:latest";

async function start() {
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
