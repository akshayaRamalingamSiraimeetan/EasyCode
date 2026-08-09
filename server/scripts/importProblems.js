/**
 * importProblems.js
 *
 * Bulk seed importer for EasyCode problems.
 *
 * Usage:
 *   npm run seed          (from the server/ directory)
 *
 * Behaviour:
 *   - Recursively walks  <repo-root>/seed/**\/*.json
 *   - Validates each file against required fields before touching the DB
 *   - Upserts by slug: inserts new, updates existing — never duplicates
 *   - Upserts test cases individually via the compound unique index
 *   - Prints a per-topic + grand-total summary
 *   - A single bad file never aborts the rest of the import
 *
 * Environment:
 *   Reads MONGO_URI from  server/.env  (same file the server itself uses).
 */

"use strict";

require("dotenv").config(); // loads server/.env when run from server/

const path = require("path");
const fs = require("fs");
const connectDB = require("../src/config/db");
const Problem = require("../src/models/Problem");
const TestCase = require("../src/models/TestCase");

// ─── Constants ───────────────────────────────────────────────────────────────

// __dirname  →  <repo-root>/server/scripts
// Climb two levels: scripts → server → repo-root, then enter seed/
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SEED_DIR  = path.join(REPO_ROOT, "seed");

// Sentinel values for the required createdBy / createdByUsername fields.
// These mark problems as system-seeded rather than user-created.
const SEED_AUTHOR_ID = "system";
const SEED_AUTHOR_USERNAME = "seed";

// Required top-level keys every seed file must contain
const REQUIRED_FIELDS = [
  "title",
  "slug",
  "difficulty",
  "statement",
  "constraints",
  "examples",
  "starterCode",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Recursively collect every .json file under `dir`.
 * Returns an array of absolute paths.
 */
function collectJsonFiles(dir) {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Derive the topic from a file's path relative to SEED_DIR.
 * e.g.  .../seed/arrays/two-sum.json  →  "arrays"
 */
function topicFromPath(filePath) {
  const rel = path.relative(SEED_DIR, filePath);
  const parts = rel.split(path.sep);
  return parts.length > 1 ? parts[0] : "uncategorized";
}

/**
 * Validate a parsed problem object.
 * Returns an array of error strings (empty = valid).
 */
function validate(data) {
  const errors = [];

  // Required string fields
  for (const field of REQUIRED_FIELDS) {
    if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
      errors.push(`Missing or empty required field: "${field}"`);
    }
  }

  // difficulty enum
  if (data.difficulty && !["Easy", "Medium", "Hard"].includes(data.difficulty)) {
    errors.push(
      `Invalid difficulty "${data.difficulty}". Must be Easy, Medium, or Hard.`
    );
  }

  // examples must be a non-empty array
  if (!Array.isArray(data.examples) || data.examples.length === 0) {
    errors.push(`"examples" must be a non-empty array.`);
  }

  // starterCode must be an object with at least one language key
  if (
    !data.starterCode ||
    typeof data.starterCode !== "object" ||
    Array.isArray(data.starterCode) ||
    Object.keys(data.starterCode).length === 0
  ) {
    errors.push(`"starterCode" must be a non-empty object.`);
  }

  // testCases validation (warn, don't block import)
  const publicTests =
    Array.isArray(data.testCases)
      ? data.testCases.filter((t) => !t.isHidden)
      : [];
  const hiddenTests =
    Array.isArray(data.testCases)
      ? data.testCases.filter((t) => t.isHidden)
      : [];

  if (publicTests.length === 0) {
    errors.push(`No public test cases (isHidden: false) found.`);
  }
  if (hiddenTests.length === 0) {
    errors.push(`No hidden test cases (isHidden: true) found.`);
  }

  return errors;
}

/**
 * Upsert a single test case.
 * Uses the compound unique index { problemId, input, expectedOutput }
 * so running the importer multiple times never creates duplicates.
 */
async function upsertTestCase(problemId, tc, orderIndex) {
  await TestCase.findOneAndUpdate(
    { problemId, input: tc.input, expectedOutput: tc.expectedOutput },
    {
      $set: {
        isHidden: tc.isHidden ?? false,
        orderIndex: tc.orderIndex ?? orderIndex,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        problemId,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        createdAt: new Date(),
      },
    },
    { upsert: true, new: false }
  );
}

/**
 * Import one problem file.
 * Returns { action: "inserted"|"updated"|"skipped", errors: string[] }
 */
async function importFile(filePath) {
  // ── 1. Parse JSON ──────────────────────────────────────────────────────
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return { action: "error", errors: [`Malformed JSON: ${err.message}`] };
  }

  // ── 2. Validate ────────────────────────────────────────────────────────
  const validationErrors = validate(data);
  if (validationErrors.length > 0) {
    return { action: "skipped", errors: validationErrors };
  }

  const topic = topicFromPath(filePath);

  // ── 3. Build the problem document fields ──────────────────────────────
  const folderTopic = topicFromPath(filePath);

  const problemFields = {
    slug: data.slug.trim().toLowerCase(),
    title: data.title.trim(),
    description: data.statement,        // seed uses "statement", schema uses "description"
    difficulty: data.difficulty,
    constraints: data.constraints ?? "",
    // Prefer an explicit topic in the JSON; fall back to the folder name
    topic: data.topic ? data.topic.trim() : folderTopic,
    tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    inputFormat: data.inputFormat ?? "",
    outputFormat: data.outputFormat ?? "",
    examples: (data.examples ?? []).map((ex) => ({
      input: ex.input ?? "",
      output: ex.output ?? "",
      explanation: ex.explanation ?? "",
    })),
    starterCode: {
      python: data.starterCode.python ?? "",
      cpp: data.starterCode.cpp ?? "",
      java: data.starterCode.java ?? "",
      c: data.starterCode.c ?? "",
    },
    updatedAt: new Date(),
  };

  // ── 4. Upsert problem ─────────────────────────────────────────────────
  const existing = await Problem.findOne({ slug: problemFields.slug });
  let action;
  let problemId;

  if (!existing) {
    // Insert
    const newProblem = new Problem({
      ...problemFields,
      createdBy: SEED_AUTHOR_ID,
      createdByUsername: SEED_AUTHOR_USERNAME,
      createdAt: new Date(),
    });
    await newProblem.save();
    problemId = newProblem.id;
    action = "inserted";
  } else {
    // Update every field — but preserve the original createdBy/createdAt
    Object.assign(existing, problemFields);
    await existing.save();
    problemId = existing.id;
    action = "updated";
  }

  // ── 5. Upsert test cases ──────────────────────────────────────────────
  const testCases = Array.isArray(data.testCases) ? data.testCases : [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    if (!tc.input || tc.expectedOutput === undefined) continue; // skip malformed rows
    await upsertTestCase(problemId, tc, i);
  }

  return { action, errors: [] };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Connect using the exact same function the server uses
  await connectDB();
  console.log("✔  MongoDB connected\n");

  // Collect all seed files
  if (!fs.existsSync(SEED_DIR)) {
    console.error(`Seed directory not found: ${SEED_DIR}`);
    process.exit(1);
  }

  const files = collectJsonFiles(SEED_DIR);
  if (files.length === 0) {
    console.log("No JSON files found under", SEED_DIR);
    process.exit(0);
  }

  // Organise by topic for the summary
  const topicStats = {}; // { topic: { inserted, updated, skipped, errors } }
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const filePath of files) {
    const topic = topicFromPath(filePath);
    if (!topicStats[topic]) {
      topicStats[topic] = { inserted: 0, updated: 0, skipped: 0, errors: 0 };
    }

    const relPath = path.relative(SEED_DIR, filePath);
    let result;

    try {
      result = await importFile(filePath);
    } catch (err) {
      // Unexpected runtime error — log and continue
      result = { action: "error", errors: [err.message] };
    }

    if (result.errors.length > 0) {
      console.error(`  ✗  ${relPath}`);
      for (const e of result.errors) {
        console.error(`       • ${e}`);
      }
    }

    switch (result.action) {
      case "inserted":
        topicStats[topic].inserted++;
        totalInserted++;
        break;
      case "updated":
        topicStats[topic].updated++;
        totalUpdated++;
        break;
      case "skipped":
        topicStats[topic].skipped++;
        totalSkipped++;
        break;
      case "error":
        topicStats[topic].errors++;
        totalErrors++;
        break;
    }
  }

  // ── Print summary ──────────────────────────────────────────────────────
  const LINE = "=".repeat(50);
  console.log("\n" + LINE);

  for (const [topic, stats] of Object.entries(topicStats)) {
    // Convert kebab-case folder name to a readable title
    const label = topic
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    console.log(`\n${label}`);
    if (stats.inserted) console.log(`  Inserted : ${stats.inserted}`);
    if (stats.updated)  console.log(`  Updated  : ${stats.updated}`);
    if (stats.skipped)  console.log(`  Skipped  : ${stats.skipped}`);
    if (stats.errors)   console.log(`  Errors   : ${stats.errors}`);
    if (!stats.inserted && !stats.updated && !stats.skipped && !stats.errors) {
      console.log(`  (no files)`);
    }
  }

  console.log("\n" + LINE);
  console.log(`Total files : ${files.length}`);
  console.log(`Inserted    : ${totalInserted}`);
  console.log(`Updated     : ${totalUpdated}`);
  console.log(`Skipped     : ${totalSkipped}`);
  console.log(`Errors      : ${totalErrors}`);
  console.log(LINE + "\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
