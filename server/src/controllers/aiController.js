const https = require("https");
const http = require("http");
const Problem = require("../models/Problem");

/**
 * Lightweight HTTP helper that replaces axios to avoid adding a dependency.
 * Sends a POST request with a JSON body and returns the parsed JSON response.
 */
const postJSON = (url, body) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = lib.request(options, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          reject(new Error("AI service returned non-JSON response."));
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
};

/**
 * POST /api/ai/hint
 *
 * 1. Authenticate user (handled by authMiddleware before this controller)
 * 2. Fetch the full problem from MongoDB
 * 3. Build the payload for the AI service
 * 4. Forward the request to the AI service
 * 5. Return the hint to the client
 *
 * The client never communicates with the AI service directly.
 * The AI service never touches MongoDB.
 */
const getHint = async (req, res) => {
  try {
    const { problemId, language, userCode, hintLevel } = req.body;

    if (!problemId || !language || !hintLevel) {
      return res.status(400).json({
        success: false,
        message: "Fields 'problemId', 'language', and 'hintLevel' are required.",
      });
    }

    // Fetch problem — the server owns the DB, the AI service does not
    const problem = await Problem.findOne({ id: problemId }).select(
      "title description difficulty constraints"
    );

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:6000";

    const payload = {
      problem: {
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        constraints: problem.constraints,
      },
      language,
      userCode: userCode || "",
      hintLevel: Number(hintLevel),
    };

    let aiResponse;

    try {
      aiResponse = await postJSON(`${aiServiceUrl}/hint`, payload);
    } catch (networkErr) {
      console.error("[AIController] Could not reach AI service:", networkErr.message);
      return res.status(503).json({
        success: false,
        message: "AI service is currently unavailable. Please try again later.",
      });
    }

    if (!aiResponse.body.success) {
      return res.status(502).json({
        success: false,
        message: aiResponse.body.message || "AI service returned an error.",
      });
    }

    return res.status(200).json({
      success: true,
      hint: aiResponse.body.hint,
    });
  } catch (error) {
    console.error("[AIController] Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = { getHint };
