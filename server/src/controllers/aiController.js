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

    // [DIAGNOSTIC] Log exactly what we are about to send
    console.log("[postJSON] URL:", url);
    console.log("[postJSON] Method: POST");
    console.log("[postJSON] Payload bytes:", Buffer.byteLength(data));

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
      let bytesReceived = 0;

      // [DIAGNOSTIC] Log status and headers as soon as they arrive
      console.log("[postJSON] HTTP status:", res.statusCode);
      console.log("[postJSON] headers:", res.headers);

      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
        bytesReceived += Buffer.byteLength(chunk);
      });
      res.on("end", () => {
        // [DIAGNOSTIC] Response body fully received
        console.log("[postJSON] response finished");
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          reject(new Error("AI service returned non-JSON response."));
        }
      });
    });

    // [DIAGNOSTIC] Socket lifecycle — tells us how far the TCP handshake got
    req.on("socket", () => console.log("[postJSON] socket assigned"));

    req.on("timeout", () => {
      console.log("[postJSON] request timeout");
      req.destroy();
      reject(new Error("HTTP request timeout"));
    });

    req.on("error", (err) => {
      // [DIAGNOSTIC] Transport-level error — ECONNREFUSED, ETIMEDOUT, ENOTFOUND, etc.
      console.error("[postJSON] request error:", err);
    });

    req.write(data);
    req.end();
  });
};

/**
 * POST /api/ai/hint
 */
const getHint = async (req, res) => {
  // -----------------------------------------------------------------------
  // [DIAGNOSTIC] ENTRY — outside every try/catch block.
  // If this never appears in CloudWatch, getHint is not being called at all.
  // -----------------------------------------------------------------------
  console.log("========== AI HINT REQUEST (ENTRY) ==========");
  console.log("[ENTRY] Time:", new Date().toISOString());
  console.log("[ENTRY] Body:", req.body);

  try {
    const { problemId, language, userCode, hintLevel } = req.body;

    console.log("[AIController] User:", req.user?.id);
    console.log("[AIController] Problem:", problemId);
    console.log("[AIController] Language:", language);
    console.log("[AIController] Hint Level:", hintLevel);

    const aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://localhost:6001";
    console.log("[AIController] AI_SERVICE_URL:", aiServiceUrl);

    if (!problemId || !language || !hintLevel) {
      console.log("[AIController] Rejecting: missing required fields");
      return res.status(400).json({
        success: false,
        message: "Fields 'problemId', 'language', and 'hintLevel' are required.",
      });
    }

    console.log("[AIController] Fetching problem from MongoDB...");

    // Fetch problem — the server owns the DB, the AI service does not
    const problem = await Problem.findOne({ id: problemId }).select(
      "title description difficulty constraints"
    );

    if (!problem) {
      console.log("[AIController] Problem not found:", problemId);
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    console.log("[AIController] Problem loaded. Title:", problem.title);

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

    console.log("[AIController] Forwarding to AI service:", `${aiServiceUrl}/hint`);
    console.log("[AIController] Description length:", (problem.description ?? "").length);
    console.log("[AIController] User code length:", (userCode ?? "").length);

    const start = Date.now();
    let aiResponse;

    try {
      aiResponse = await postJSON(`${aiServiceUrl}/hint`, payload);
      console.log("[AIController] AI service responded. Elapsed:", Date.now() - start, "ms");
    } catch (networkErr) {
      // -----------------------------------------------------------------------
      // [DIAGNOSTIC] Full property dump — identifies the exact transport failure
      // -----------------------------------------------------------------------
      console.error("========== AI REQUEST FAILED ==========");
      console.error("message:", networkErr.message);
      console.error("code:", networkErr.code);
      console.error("errno:", networkErr.errno);
      console.error("name:", networkErr.name);
      console.error("cause:", networkErr.cause);
      console.error("stack:", networkErr.stack);
      if (networkErr.response) {
        console.error("response status:", networkErr.response.status);
        console.error("response body:", networkErr.response.data);
      }
      if (networkErr.cause) {
        console.error("cause:", networkErr.cause);
      }
      console.error("Elapsed:", Date.now() - start, "ms");
      return res.status(503).json({
        success: false,
        message: "AI service is currently unavailable. Please try again later.",
      });
    }

    if (!aiResponse.body.success) {
      console.error("[AIController] AI service non-success body:", JSON.stringify(aiResponse.body));
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
    console.error("========== AI CONTROLLER UNEXPECTED ERROR ==========");
    console.error(error);
    console.error("message:", error.message);
    console.error("stack:", error.stack);
    console.error("code:", error.code);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = { getHint };
