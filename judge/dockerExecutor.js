const { spawn } = require("child_process");
const path = require("path");

const IMAGE = "easycode-runner";

const TEMP_DIR = path.join(__dirname, "temp");

const OUTPUT_LIMIT = 1 * 1024 * 1024; // 1 MB

// Special exit code used to indicate output limit exceeded.
const OLE_EXIT_CODE = 200;

/**
 * Runs a command inside an ephemeral Docker container.
 *
 * Output limiting:
 * - Enforced inside container using `head`.
 * - Prevents huge outputs reaching Node.
 * - Exit code 200 is reserved for output-limit-exceeded.
 */
function runInDocker({
  command,
  args = [],
  cwd = "/workspace",
  stdin = "",
  timeout = 5000,
  checkOutputLimit = true,
}) {
  return new Promise((resolve) => {
    let settled = false;

    function finish(result) {
      if (settled) return;
      settled = true;
      resolve(result);
    }

    const containerWorkspaceRoot = "/workspace";

    const relativeTail = cwd.startsWith(containerWorkspaceRoot)
      ? cwd.slice(containerWorkspaceRoot.length)
      : "";

    const hostMountDir = relativeTail
      ? path.join(TEMP_DIR, ...relativeTail.split("/").filter(Boolean))
      : TEMP_DIR;


    function shQuote(s) {
      return `'${s.replace(/'/g, "'\\''")}'`;
    }


    const userCmd = [command, ...args]
      .map(shQuote)
      .join(" ");


    // Docker flags shared by both execution paths.
    const baseDockerArgs = [
      "run",
      "--rm",
      "-i",
      "-w", containerWorkspaceRoot,
      "-v", `${hostMountDir}:${containerWorkspaceRoot}`,
      "--network", "none",
      "--memory", "256m",
      "--memory-swap", "256m",
      "--cpus", "1",
      "--pids-limit", "64",
      "--read-only",
      "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m",
      IMAGE,
    ];

    // checkOutputLimit=true (default, execution phase):
    //   Wrap with head(1) so the limit is enforced inside the container at
    //   kernel speed — user process gets SIGPIPE before data reaches Node.
    //
    // checkOutputLimit=false (compilation phase):
    //   Run the compiler directly so full error output is returned as-is and
    //   cannot be misidentified as output-limit-exceeded.
    const headLimit = OUTPUT_LIMIT + 1;

    const wrapperScript =
      `RC_FILE=$(mktemp /tmp/.rc.XXXXXX); ` +
      `{ ${userCmd}; echo $? > "$RC_FILE"; } 2>&1 | head -c ${headLimit}; ` +
      `RC=$(cat "$RC_FILE" 2>/dev/null || echo 1); rm -f "$RC_FILE"; ` +
      `if [ "$RC" = "141" ]; then exit ${OLE_EXIT_CODE}; fi; ` +
      `exit "$RC"`;

    const dockerArgs = checkOutputLimit
      ? [...baseDockerArgs, "bash", "-c", wrapperScript]
      : [...baseDockerArgs, command, ...args];


    const docker = spawn("docker", dockerArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });


    let stdout = "";
    let stderr = "";

    let stdoutBytes = 0;
    let stderrBytes = 0;

    let timedOut = false;
    let outputLimitExceeded = false;


    // Safety-net output limiter.
    docker.stdout.on("data", (data) => {
      if (outputLimitExceeded) return;

      stdoutBytes += data.length;

      if (stdoutBytes > OUTPUT_LIMIT) {
        outputLimitExceeded = true;
        stdout = "";

        docker.kill("SIGKILL");
        return;
      }

      stdout += data.toString();
    });


    docker.stderr.on("data", (data) => {
      if (outputLimitExceeded) return;

      stderrBytes += data.length;

      if (stderrBytes > OUTPUT_LIMIT) {
        outputLimitExceeded = true;
        stderr = "";

        docker.kill("SIGKILL");
        return;
      }

      stderr += data.toString();
    });


    docker.stdin.write(stdin);
    docker.stdin.end();


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
        outputLimitExceeded: false,
      });
    });



    docker.on("close", (exitCode, signal) => {
      clearTimeout(timer);


      const didExceedOutputLimit =
        checkOutputLimit && (exitCode === OLE_EXIT_CODE || outputLimitExceeded);


      finish({
        exitCode,
        signal,

        stdout: didExceedOutputLimit ? "" : stdout,

        stderr: didExceedOutputLimit
          ? "Output limit exceeded"
          : stderr,


        timedOut:
          didExceedOutputLimit
            ? false
            : timedOut,


        outputLimitExceeded:
          didExceedOutputLimit,
      });
    });
  });
}


module.exports = {
  runInDocker,
};