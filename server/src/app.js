const express = require("express");

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EasyCode API is running..."
  });
});

module.exports = app;