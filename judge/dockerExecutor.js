const { spawn } = require("child_process");
const path = require("path");

const IMAGE         = process.env.RUNNER_IMAGE   || "easycode-runner:latest";
const DOCKER_SOCKET = process.env.DOCKER_SOCKET  || "/var/run/docker.sock";

// JUDGE_TEMP_DIR     — container-visible path where the judge process writes
//                      workspace files (source code, compiled binaries, etc.).
//                      Must be writable inside the judge container.
//
// HOST_JUDGE_TEMP_DIR — host-visible path passed to `docker run -v` when
//                       spawning runner containers. The Docker daemon resolves
//                       this path in its own namespace, which may differ from
//                       the judge container's namespace.
//
//                       Falls back to JUDGE_TEMP_DIR when not set.
//                       On Linux this fallback is always correct.
//                       On Docker Desktop (Windows) set this to the Windows
//                       host path (e.g. C:\judge-workspace) so the daemon can
//                       locate the workspace files written by the judge.
const CONTAINER_TEMP_DIR = process.env.JUDGE_TEMP_DIR      || path.join(__dirname, "temp");
const HOST_TEMP_DIR       = process.env.HOST_JUDGE_TEMP_DIR || CONTAINER_TEMP_DIR;

const OUTPUT_LIMIT  = 1 * 1024 * 1024; // 1 MB
const OLE_EXIT_CODE = 200;              // reserved: output limit exceeded

/**
 * Runs a command inside an ephemeral Docker container.
 *
 * Output limiting:
 * - Enforced inside the container using `head -c` (kernel-speed SIGPIPE).
 * - Node-side safety net also enforces the limit.
 * - Exit code 200 is reserved for output-limit-exceeded.
 *
 * @param {object}  opts
 * @param {string}  opts.command
 * @param {string[]} [opts.args]
 * @param {string}  [opts.cwd]              working dir inside the container
 * @param {string}  [opts.stdin]
 * @param {number}  [opts.timeout]          ms, default 5000
 * @param {boolean} [opts.checkOutputLimit] default true
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

    // hostMountDir is the source path for `docker run -v <source>:/workspace`.
    // Uses HOST_TEMP_DIR so the Docker daemon resolves it correctly regardless
    // of whether the judge itself is containerised.
    const hostMountDir = relativeTail
      ? path.join(HOST_TEMP_DIR, ...relativeTail.split("/").filter(Boolean))
      : HOST_TEMP_DIR;

    // Stable container name derived from the workspace UUID.
    // Used to forcibly kill the container on timeout — killing the `docker`
    // CLI child process alone does not stop the container itself.
    const workspaceId   = relativeTail.split("/").filter(Boolean)[0] || "unknown";
    const containerName = `judge-runner-${workspaceId}`;

    function shQuote(s) {
      return `'${s.replace(/'/g, "'\\''")}'`;
    }

    const userCmd = [command, ...args].map(shQuote).join(" ");

    // Docker flags shared by both execution paths.
    const baseDockerArgs = [
      "run",
      "--rm",
      "--name", containerName,
      "-i",
      "-w",           containerWorkspaceRoot,
      "-v",           `${hostMountDir}:${containerWorkspaceRoot}`,
      "--network",    "none",
      "--memory",     "256m",
      "--memory-swap","256m",
      "--cpus",       "1",
      "--pids-limit", "64",
      "--read-only",
      "--tmpfs",      "/tmp:rw,noexec,nosuid,size=64m",
      IMAGE,
    ];

    const headLimit = OUTPUT_LIMIT + 1;

    // checkOutputLimit=true (execution phase):
    //   Wrap with head(1) — output limit enforced at kernel speed inside the
    //   container. User process gets SIGPIPE before data reaches Node.
    //
    // checkOutputLimit=false (compilation phase):
    //   Run the compiler directly so full error output is returned as-is and
    //   cannot be misidentified as output-limit-exceeded.
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
      // Kill the docker CLI child process AND the container itself.
      // Killing only the CLI process leaves the container running —
      // the container must be stopped explicitly via the daemon.
      docker.kill("SIGKILL");
      spawn("docker", ["kill", containerName], { stdio: "ignore" });
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
        stdout:              didExceedOutputLimit ? ""                     : stdout,
        stderr:              didExceedOutputLimit ? "Output limit exceeded" : stderr,
        timedOut:            didExceedOutputLimit ? false                  : timedOut,
        outputLimitExceeded: didExceedOutputLimit,
      });
    });
  });
}

module.exports = { runInDocker };
