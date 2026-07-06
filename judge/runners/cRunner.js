const compiledRunner = require("./compiledRunner");

async function execute(code, input) {
  return compiledRunner.execute({
    code,
    input,
    extension: "c",
    compiler: "gcc",
    createRunCommand(executablePath) {
      return {
        command: executablePath,
        args: [],
      };
    },
  });
}

module.exports = {
  execute,
};
