const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const submissionSchema = new mongoose.Schema({
  // Custom UUID — same convention as Problem, User, TestCase
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },

  // Denormalized from the User document so the submissions list
  // never needs to join to the users collection.
  userId: {
    type: String,
    required: true,
  },

  username: {
    type: String,
    required: true,
  },

  // Denormalized from the Problem document for the same reason.
  problemId: {
    type: String,
    required: true,
  },

  problemTitle: {
    type: String,
    required: true,
  },

  language: {
    type: String,
    required: true,
    enum: ["python", "cpp", "c", "java"],
  },

  // Full source code at submission time.
  code: {
    type: String,
    required: true,
  },

  // Verdict string — mirrors judgeService output statuses.
  verdict: {
    type: String,
    required: true,
    enum: [
      "accepted",
      "wrong_answer",
      "runtime_error",
      "compilation_error",
      "time_limit_exceeded",
      "output_limit_exceeded",
    ],
  },

  // How many test cases passed out of the total attempted.
  passed: {
    type: Number,
    default: 0,
  },

  total: {
    type: Number,
    default: 0,
  },

  // Optional runtime in ms — not always available.
  runtime: {
    type: Number,
    default: null,
  },

  submittedAt: {
    type: Date,
    default: Date.now,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Most common query: a user's own submissions, newest first.
submissionSchema.index({ userId: 1, submittedAt: -1 });

// Per-problem submissions for one user.
submissionSchema.index({ userId: 1, problemId: 1, submittedAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
