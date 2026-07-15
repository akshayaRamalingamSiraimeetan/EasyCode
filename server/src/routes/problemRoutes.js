const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/authorizeAdmin");

const {
  createProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
} = require("../controllers/problemController");

const {
  createTestCase,
  getTestCasesByProblem,
  updateTestCase,
  deleteTestCase,
} = require("../controllers/testCaseController");

const router = express.Router();

// Problem routes
router.get("/", authenticate, getAllProblems);
router.get("/:id", authenticate, getProblemById);
router.put("/:id", authenticate, authorizeAdmin, updateProblem);
router.delete("/:id", authenticate, authorizeAdmin, deleteProblem);
router.post("/", authenticate, authorizeAdmin, createProblem);

// Test case routes (nested under problems)
router.post("/:id/testcases", authenticate, authorizeAdmin, createTestCase);
router.get("/:id/testcases", authenticate, authorizeAdmin, getTestCasesByProblem);
router.put("/testcases/:tcId", authenticate, authorizeAdmin, updateTestCase);
router.delete("/testcases/:tcId", authenticate, authorizeAdmin, deleteTestCase);

module.exports = router;
