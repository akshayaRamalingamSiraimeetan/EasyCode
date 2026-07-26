"use strict";

const express        = require("express");
const judgeRoutes    = require("./routes/judgeRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

// ── Parse JSON bodies ────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// ── Judge routes ─────────────────────────────────────────────────────────────
app.use("/", judgeRoutes);

// ── Centralized error handler (must be last) ─────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
