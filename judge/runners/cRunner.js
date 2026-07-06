const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

async function execute(code, input) {
  return new Promise((resolve, reject) => {
    const fileName = `${uuid()}.c`;
    const filePath = path.join(__dirname, "..", "temp", fileName);

    fs.writeFileSync(filePath, code);

    resolve({
      stdout: "C source file created",
      stderr: "",
    });
  });
}

module.exports = {
  execute,
};
