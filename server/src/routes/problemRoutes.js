const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/authorizeAdmin");

const {
  createProblem,
  getAllProblems,
} = require("../controllers/problemController");

const router = express.Router();
router.get(
  "/",
  authenticate,
  getAllProblems
);

router.post(
  "/",
  authenticate,
  authorizeAdmin,
  createProblem
);

module.exports = router;