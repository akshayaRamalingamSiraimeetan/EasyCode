const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { v4: uuid } = require("uuid");

async function execute(code) {
  return new Promise((resolve, reject) => {
    const fileName = `${uuid()}.py`;

    const filePath = path.join(__dirname, "temp", fileName);

    fs.writeFileSync(filePath, code);
    console.log(fileName);
    exec(`python "${filePath}"`, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }

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
