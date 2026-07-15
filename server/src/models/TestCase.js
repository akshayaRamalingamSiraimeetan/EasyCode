const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const testCaseSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },

  // References the custom UUID id field on Problem, not _id
  problemId: {
    type: String,
    required: true,
  },

  input: {
    type: String,
    required: true,
  },

  expectedOutput: {
    type: String,
    required: true,
  },

  isHidden: {
    type: Boolean,
    default: false,
  },

  orderIndex: {
    type: Number,
    default: 0,
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

// Covers the common query: find by problem, sorted by display order
testCaseSchema.index({ problemId: 1, orderIndex: 1 });

module.exports = mongoose.model("TestCase", testCaseSchema);
