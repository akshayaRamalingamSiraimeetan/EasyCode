require("dotenv").config();

// [DIAGNOSTIC PROBE] — Remove after confirming correct image is running in ECS
// Fires before any async code so it always appears in CloudWatch regardless of DB state
const fs = require("fs");
const path = require("path");
console.log("========== IMAGE VERIFICATION PROBE ==========");
console.log("[Probe] Time        :", new Date().toISOString());
console.log("[Probe] process.cwd():", process.cwd());
console.log("[Probe] __filename  :", __filename);
const serverFilePath = "/app/server/src/server.js";
try {
  const lines = fs.readFileSync(serverFilePath, "utf8").split("\n").slice(0, 25).join("\n");
  console.log(`[Probe] First 25 lines of ${serverFilePath}:\n`, lines);
} catch (e) {
  console.log("[Probe] Could not read", serverFilePath, "—", e.message);
}
console.log("[Probe] BUILD_TAG   :", process.env.BUILD_TAG ?? "(not set — add BUILD_TAG env var to task definition)");
console.log("===============================================");
// [END DIAGNOSTIC PROBE]

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      // [DIAGNOSTIC] Print startup environment so CloudWatch confirms the running config
      console.log("========== SERVER STARTUP ==========");
      console.log("[Server] Environment:", process.env.NODE_ENV ?? "development");
      console.log("[Server] PORT:", PORT);
      console.log("[Server] AI_SERVICE_URL:", process.env.AI_SERVICE_URL ?? "http://localhost:6001 (default)");
      console.log("[Server] Running on http://localhost:" + PORT);
      console.log("=====================================");
    });
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    console.error("Server will not start without a database connection.");
    process.exit(1);
  }
};

startServer();
