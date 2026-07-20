require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    console.error("Server will not start without a database connection.");
    process.exit(1);
  }
};

startServer();