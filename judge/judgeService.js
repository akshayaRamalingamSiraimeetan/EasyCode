const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

async function execute(code, input) {
  return new Promise((resolve, reject) => {
    const fileName = `${uuid()}.py`;

    const filePath = path.join(__dirname, "temp", fileName);

    fs.writeFileSync(filePath, code);
    //console.log(fileName);
    const pythonProcess = spawn("python", [filePath]);
    
    pythonProcess.stdin.write(input || "");
    pythonProcess.stdin.end();

    let stdout = "";
    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    let stderr = "";
    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", () => {
      fs.unlink(filePath, () => {});

      resolve({
        stdout,
        stderr,
      });
    });
  });
}

module.exports = {
  execute,
};
