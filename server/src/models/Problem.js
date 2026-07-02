const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const problemSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
  },

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

  createdBy: {
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