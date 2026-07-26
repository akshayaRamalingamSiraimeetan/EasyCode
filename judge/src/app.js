"use strict";

const express         = require("express");
const judgeRoutes     = require("./routes/judgeRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const { name: SERVICE_NAME, version: SERVICE_VERSION } = require("../package.json");

const app = express();

// ── Parse JSON bodies ────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// ── Root — quick human/browser check ─────────────────────────────────────────
app.get("/", (_req, res) =>
  res.status(200).json({ service: "EasyCode Judge Service", status: "running" })
);

// ── Health — for AWS ALB / load-balancer probes ───────────────────────────────
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// ── Version ──────────────────────────────────────────────────────────────────
app.get("/version", (_req, res) =>
  res.status(200).json({
    service:     SERVICE_NAME,
    version:     SERVICE_VERSION,
    environment: process.env.NODE_ENV ?? "development",
  })
);

// ── Judge routes ─────────────────────────────────────────────────────────────
app.use("/", judgeRoutes);

// ── Centralized error handler (must be last) ─────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
