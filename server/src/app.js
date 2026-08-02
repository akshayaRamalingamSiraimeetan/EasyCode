const express = require("express");
const cors = require("cors");
const { name: SERVICE_NAME, version: SERVICE_VERSION } = require("../package.json");

const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const compilerRoutes = require("./routes/compilerRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// ---------------------------------------------------------------------------
// CORS — build the allowed-origin list once at startup
// ---------------------------------------------------------------------------

const BASE_ORIGINS = [
  "https://codessey.in",
  "https://www.codessey.in",
  "http://localhost:5173",
  "http://localhost:3000",
];

// Merge optional comma-separated env var (e.g. staging URLs)
const ENV_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const ALLOWED_ORIGINS = [...new Set([...BASE_ORIGINS, ...ENV_ORIGINS])];

// Log the final list once so it's visible in CloudWatch at startup
console.log("[CORS] Allowed origins:", ALLOWED_ORIGINS);

const corsOptions = {
  origin(origin, callback) {
    // Log every incoming origin for CloudWatch visibility
    console.log(`[CORS] Incoming origin: ${origin ?? "(no origin)"}`);

    // Allow server-to-server / curl requests that carry no Origin header
    if (!origin) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Blocked — log it and reject cleanly (never throw)
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  // Explicit list keeps the preflight response tight
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  // Tell browsers they may cache the preflight for 10 minutes
  maxAge: 600,
  // Ensures Express sets 204 on preflight, not 200
  optionsSuccessStatus: 204,
};

// ---------------------------------------------------------------------------
// Middleware — order matters
// ---------------------------------------------------------------------------

// 1. Handle OPTIONS preflight for every route first, using the same corsOptions
app.options("*", cors(corsOptions));

// 2. Apply CORS headers to all other requests
app.use(cors(corsOptions));

// 3. Parse JSON bodies
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/compiler", compilerRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/ai", aiRoutes);

// Root — quick human/browser check
app.get("/", (_req, res) =>
  res.status(200).json({ service: "EasyCode Backend", status: "running" })
);

// Health — for AWS ALB / load-balancer probes
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// Version
app.get("/version", (_req, res) =>
  res.status(200).json({
    service:     SERVICE_NAME,
    version:     SERVICE_VERSION,
    environment: process.env.NODE_ENV ?? "development",
  })
);

module.exports = app;
