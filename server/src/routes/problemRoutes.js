const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/authorizeAdmin");

const {
  createProblem,
} = require("../controllers/problemController");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeAdmin,
  createProblem
);

module.exports = router;