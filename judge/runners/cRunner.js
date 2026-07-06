const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { spawn } = require("child_process");

function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Failed to delete:", filePath);
    }
  });
}

async function execute(code, input) {
  return new Promise((resolve, reject) => {
    const fileName = `${uuid()}.c`;
    const filePath = path.join(__dirname, "..", "temp", fileName);
    const executableName = `${uuid()}.exe`;
    const executablePath = path.join(__dirname, "..", "temp", executableName);

    fs.writeFileSync(filePath, code);

    const gccProcess = spawn("gcc", [filePath, "-o", executablePath]);

    let compileError = "";
    gccProcess.stderr.on("data", (data) => {
      compileError += data.toString();
    });

    gccProcess.on("close", (code) => {
      if (code !== 0) {
        console.log("GCC exit code:", code);
        console.log("Compiler stderr:", compileError);
        deleteFile(filePath);
        return reject(new Error(compileError));
      }
      const programProcess = spawn(executablePath);

      let stdout = "";
      programProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      let stderr = "";
      programProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      programProcess.stdin.write(input || "");
      programProcess.stdin.end();

      programProcess.on("close", () => {
        deleteFile(filePath);
        deleteFile(executablePath);
        resolve({
          stdout,
          stderr,
        });
      });
    });
  });
}

module.exports = {
  execute,
};
