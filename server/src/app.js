const express = require("express");

const app = express();
const authRoutes = require("./routes/authRoutes");

// Middleware to parse JSON request bodies
app.use(express.json());
app.use("/api/auth", authRoutes);
// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EasyCode API is running..."
  });
});

module.exports = app;