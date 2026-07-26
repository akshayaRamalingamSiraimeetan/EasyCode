const express = require("express");
const cors = require("cors");
const { name: SERVICE_NAME, version: SERVICE_VERSION } = require("../package.json");

const hintRoutes = require("./routes/hintRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Only accept requests from the main Express server
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:5000",
    credentials: true,
  })
);

app.use(express.json());

// Root — quick human/browser check
app.get("/", (_req, res) =>
  res.status(200).json({ service: "EasyCode AI Service", status: "running" })
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

// Routes
app.use("/hint", hintRoutes);

// Future routes — wired in when implemented:
// app.use("/review",    reviewRoutes);
// app.use("/debug",     debugRoutes);
// app.use("/explain",   explainRoutes);
// app.use("/editorial", editorialRoutes);
// app.use("/complexity",complexityRoutes);
// app.use("/chat",      chatRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
