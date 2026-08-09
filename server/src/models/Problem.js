const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, default: "" },
    output: { type: String, default: "" },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const starterCodeSchema = new mongoose.Schema(
  {
    python: { type: String, default: "" },
    cpp: { type: String, default: "" },
    java: { type: String, default: "" },
    c: { type: String, default: "" },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },

  // URL-friendly identifier — used by the seed importer for upsert keying
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,   // allows null/undefined without violating uniqueness
    unique: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
  },

  // Problem statement (maps to "statement" in seed JSON)
  description: {
    type: String,
    required: true,
  },

  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true,
  },

  constraints: {
    type: String,
    default: "",
  },

  // Topic / category derived from the seed folder name (e.g. "arrays", "graphs")
  topic: {
    type: String,
    default: "",
    trim: true,
  },

  inputFormat: {
    type: String,
    default: "",
  },

  outputFormat: {
    type: String,
    default: "",
  },

  examples: {
    type: [exampleSchema],
    default: [],
  },

  starterCode: {
    type: starterCodeSchema,
    default: () => ({}),
  },

  createdBy: {
    type: String,
    required: true,
  },

  createdByUsername: {
    type: String,
    required: true,
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

module.exports = mongoose.model("Problem", problemSchema);