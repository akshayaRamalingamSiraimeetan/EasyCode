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

    // [DIAGNOSTIC] Log connection attempt details
    console.log("[postJSON] Opening HTTP connection...");
    console.log("[postJSON] Host:", parsed.hostname);
    console.log("[postJSON] Port:", options.port);
    console.log("[postJSON] Path:", options.path);

    const req = lib.request(options, (res) => {
      let raw = "";
      let bytesReceived = 0;

      // [DIAGNOSTIC] Log when response headers arrive
      console.log("[postJSON] Response headers received. Status:", res.statusCode);

      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
        bytesReceived += Buffer.byteLength(chunk);
      });
      res.on("end", () => {
        // [DIAGNOSTIC] Log when full response body is received
        console.log("[postJSON] Response completed. Bytes received:", bytesReceived);
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          reject(new Error("AI service returned non-JSON response."));
        }
      });
    });

    // [DIAGNOSTIC] Socket lifecycle events
    req.on("socket", (socket) => {
      socket.on("connect", () => {
        console.log("[postJSON] Socket connected.");
      });
      socket.on("timeout", () => {
        console.error("[postJSON] HTTP request timeout.");
        req.destroy();
        reject(new Error("HTTP request timeout"));
      });
      socket.on("error", (err) => {
        console.error("[postJSON] Socket error:", err.message);
      });
    });

    req.on("error", (err) => {
      // [DIAGNOSTIC] Distinguish common network failure modes
      if (err.code === "ECONNREFUSED") {
        console.error("[postJSON] Connection refused. Is the AI service running?");
      } else if (err.code === "ENOTFOUND") {
        console.error("[postJSON] DNS failure. Could not resolve host:", parsed.hostname);
      } else {
        console.error("[postJSON] Request error:", err.message, "| Code:", err.code);
      }
      reject(err);
    });

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

    // [DIAGNOSTIC] Log every incoming request at the top of the handler
    console.log("========== AI HINT REQUEST ==========");
    console.log("[AIController] Time:", new Date().toISOString());
    console.log("[AIController] User:", req.user?.id);
    console.log("[AIController] Problem:", problemId);
    console.log("[AIController] Language:", language);
    console.log("[AIController] Hint Level:", hintLevel);
    const aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://localhost:6001";
    console.log("[AIController] AI_SERVICE_URL:", aiServiceUrl);
    console.log("[AIController] Request received.");

    if (!problemId || !language || !hintLevel) {
      return res.status(400).json({
        success: false,
        message: "Fields 'problemId', 'language', and 'hintLevel' are required.",
      });
    }

    // [DIAGNOSTIC] Log before DB lookup
    console.log("[AIController] Fetching problem from MongoDB...");

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

    // [DIAGNOSTIC] Log successful DB fetch (no sensitive data)
    console.log("[AIController] Problem loaded successfully. Title:", problem.title);

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

    // [DIAGNOSTIC] Log payload sizes only — never log full content
    console.log("[AIController] Forwarding request to AI service...");
    console.log("[AIController] Destination:", `${aiServiceUrl}/hint`);
    console.log("[AIController] Description length:", (problem.description ?? "").length);
    console.log("[AIController] Constraints length:", (JSON.stringify(problem.constraints ?? "")).length);
    console.log("[AIController] User code length:", (userCode ?? "").length);

    // [DIAGNOSTIC] Measure round-trip time to AI service
    const start = Date.now();
    let aiResponse;

    try {
      aiResponse = await postJSON(`${aiServiceUrl}/hint`, payload);
      // [DIAGNOSTIC] Log successful response with elapsed time
      console.log("[AIController] AI service responded. Elapsed:", Date.now() - start, "ms");
    } catch (networkErr) {
      // [DIAGNOSTIC] Full diagnostics on network failure
      console.error("========== AI REQUEST FAILED ==========");
      console.error("[AIController] AI request FAILED");
      console.error("[AIController] Elapsed:", Date.now() - start, "ms");
      console.error("[AIController] error.message:", networkErr.message);
      console.error("[AIController] error.code:", networkErr.code);
      console.error("[AIController] error.stack:", networkErr.stack);
      return res.status(503).json({
        success: false,
        message: "AI service is currently unavailable. Please try again later.",
      });
    }

    if (!aiResponse.body.success) {
      // [DIAGNOSTIC] Log non-success response from AI service
      console.error("[AIController] AI service returned non-success body:", JSON.stringify(aiResponse.body));
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
    // [DIAGNOSTIC] Catch-all with full stack trace
    console.error("========== AI CONTROLLER UNEXPECTED ERROR ==========");
    console.error("[AIController] error.message:", error.message);
    console.error("[AIController] error.stack:", error.stack);
    console.error("[AIController] error.code:", error.code);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = { getHint };
