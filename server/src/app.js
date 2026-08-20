const express = require("express");
const cors = require("cors");
const { name: SERVICE_NAME, version: SERVICE_VERSION } = require("../package.json");

const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const compilerRoutes = require("./routes/compilerRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adminRoutes = require("./routes/adminRoutes");

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

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server / curl requests that carry no Origin header
    if (!origin) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Blocked — reject cleanly
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
  optionsSuccessStatus: 204,
};

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors(corsOptions));
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/compiler", compilerRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

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

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status ?? 500).json({
    success: false,
    message: err.message ?? "Internal server error.",
  });
});

module.exports = app;
