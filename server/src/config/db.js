const mongoose = require("mongoose");

const connectDB = async () => {
  // Temporary workaround for Windows/Docker DNS SRV resolution issue.
  // Remove if the system DNS is fixed.
  require("dns").setServers(["8.8.8.8", "8.8.4.4"]);

  await mongoose.connect(process.env.MONGO_URI);
};

module.exports = connectDB;
