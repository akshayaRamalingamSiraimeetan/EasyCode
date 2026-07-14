const { spawn } = require("child_process");

const CONTAINER = "easycode-runner-container";

function runInDocker({
  command,
  args = [],
  cwd = "/workspace",
  stdin = "",
  timeout = 2000,
}) {
  return new Promise((resolve) => {
    let settled = false;

    function finish(result) {
      if (settled) return;
      settled = true;
      resolve(result);
    }

    const docker = spawn(
      "docker",
      [
        "exec",
        "-i",
        "-w",
        cwd,
        CONTAINER,
        command,
        ...args,
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";

    docker.stdout.on("data", (d) => {
      stdout += d.toString();
    });

    docker.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    docker.stdin.write(stdin);
    docker.stdin.end();

    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      docker.kill("SIGKILL");
    }, timeout);

    docker.on("error", (err) => {
      clearTimeout(timer);

      finish({
        exitCode: -1,
        signal: null,
        stdout,
        stderr: err.message,
        timedOut: false,
      });
    });

    docker.on("close", (exitCode, signal) => {
      clearTimeout(timer);

      finish({
        exitCode,
        signal,
        stdout,
        stderr,
        timedOut,
      });
    });
  });
}

module.exports = { runInDocker };