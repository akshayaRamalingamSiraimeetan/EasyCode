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

const router = express.Router();

router.get("/", authenticate, getAllProblems);
router.get("/:id", authenticate, getProblemById);
router.put("/:id", authenticate, authorizeAdmin, updateProblem);
router.delete("/:id", authenticate,authorizeAdmin, deleteProblem);
router.post("/", authenticate, authorizeAdmin, createProblem);

module.exports = router;
