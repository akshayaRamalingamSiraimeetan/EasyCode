const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { spawn } = require("child_process");

function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to delete:", filePath);
    }
  });
}

async function execute({ code, input, extension, compiler, createRunCommand }) {
  return new Promise((resolve, reject) => {
    const fileName = `${uuid()}.${extension}`;
    const filePath = path.join(__dirname, "..", "temp", fileName);
    const executableName = `${uuid()}.exe`;
    const executablePath = path.join(__dirname, "..", "temp", executableName);

    fs.writeFileSync(filePath, code);

    const compilerProcess = spawn(compiler, [filePath, "-o", executablePath]);

    let compileError = "";
    compilerProcess.stderr.on("data", (data) => {
      compileError += data.toString();
    });

    compilerProcess.on("close", (code) => {
      if (code !== 0) {
        console.log("G++ exit code:", code);
        console.log("Compiler stderr:", compileError);
        deleteFile(filePath);
        deleteFile(executablePath);
        return reject(new Error(compileError));
      }
      const runConfig = createRunCommand(executablePath);

      const programProcess = spawn(runConfig.command, runConfig.args);
      let stdout = "";
      programProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      let stderr = "";
      programProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      programProcess.on("error", (error) => {
        deleteFile(filePath);
        deleteFile(executablePath);

        reject(error);
      });

      programProcess.stdin.write(input || "");
      programProcess.stdin.end();
      let timedOut = false;

      const timeout = setTimeout(() => {
        timedOut = true;
        programProcess.kill();
      }, 2000);

      programProcess.on("close", (code) => {
        clearTimeout(timeout);

        if (timedOut) {
          deleteFile(filePath);
          deleteFile(executablePath);
          return reject(new Error("Execution timed out"));
        }

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
