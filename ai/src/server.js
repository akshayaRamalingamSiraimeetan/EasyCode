require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 6001;

app.listen(PORT, () => {
  // [DIAGNOSTIC] Print startup environment so CloudWatch confirms the running config
  console.log("========== AI SERVICE STARTUP ==========");
  console.log("[AI Service] Environment:", process.env.NODE_ENV ?? "development");
  console.log("[AI Service] PORT:", PORT);
  console.log("[AI Service] MODEL:", process.env.MODEL ?? "gemini-flash-latest (default)");
  // Intentionally NOT logging GEMINI_API_KEY
  console.log("[AI Service] Running on http://localhost:" + PORT);
  console.log("=========================================");
});
