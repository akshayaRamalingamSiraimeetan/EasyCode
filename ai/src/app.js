const express = require("express");
const cors = require("cors");

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

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EasyCode AI Service is running...",
  });
});

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
