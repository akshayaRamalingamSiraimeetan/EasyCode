const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const {
  getMySubmissions,
  getSubmissionsByProblem,
  getSubmissionById,
} = require("../controllers/submissionController");

const router = express.Router();

// All submission routes require authentication.
router.use(authenticate);

// /me must be registered before /:id so Express doesn't treat "me" as an id.
router.get("/me", getMySubmissions);
router.get("/problem/:problemId", getSubmissionsByProblem);
router.get("/:id", getSubmissionById);

module.exports = router;
