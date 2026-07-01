const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Temporary workaround for Windows/Docker DNS SRV resolution issue.
    // Remove if the system DNS is fixed.
    require("dns").setServers(["8.8.8.8", "8.8.4.4"]);

    console.log(process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error);
  }
};

module.exports = connectDB;
