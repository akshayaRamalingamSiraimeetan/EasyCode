require("dotenv").config();

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
