const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function execute(code, input) {
  return new Promise((resolve, reject) => {
    // Generate unique filename
    const fileName = `${uuid()}.py`;
    const filePath = path.join(__dirname, "..", "temp", fileName);
    // Write code to file
    fs.writeFileSync(filePath, code);

    // Start Python process
    const pythonProcess = spawn("python", [filePath]);

    let timedOut = false;

    // Kill process after 2 seconds
    const timeout = setTimeout(() => {
      timedOut = true;

      pythonProcess.kill();
    }, 2000);

    // Send stdin
    pythonProcess.stdin.write(input || "");
    pythonProcess.stdin.end();

    let stdout = "";
    let stderr = "";

    // Capture stdout
    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    // Capture stderr
    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Process finished
    pythonProcess.on("close", (code, signal) => {
      clearTimeout(timeout);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Failed to delete temp file:", err);
        }
      });

      if (timedOut) {
        return reject(new Error("Execution timed out"));
      }

      resolve({
        stdout,
        stderr,
      });
    });

    // Process failed to start
    pythonProcess.on("error", (error) => {
      clearTimeout(timeout);

      fs.unlink(filePath, () => {});

      reject(error);
    });
  });
}

module.exports = {
  execute,
};
