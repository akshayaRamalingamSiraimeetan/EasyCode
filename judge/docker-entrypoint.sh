#!/bin/sh
set -e

# RUN_MODE controls which user the Node process runs as.
#   auto    — inspect the socket GID and configure access if possible,
#             then drop to appuser (default when RUN_MODE is unset)
#   appuser — always run as appuser without inspecting the socket
#   root    — run as root (local development on Docker Desktop / WSL2 only)
RUN_MODE="${RUN_MODE:-auto}"

# Validate early — catch typos like RUN_MODE=ROOT or RUN_MODE=yes before
# they silently fall through to the wrong execution path.
case "$RUN_MODE" in
  auto|appuser|root) ;;
  *)
    echo "[entrypoint] Invalid RUN_MODE: '$RUN_MODE'. Valid values: auto, appuser, root."
    exit 1
    ;;
esac

SOCKET="${DOCKER_SOCKET:-/var/run/docker.sock}"

# ── root ─────────────────────────────────────────────────────────────────────
if [ "$RUN_MODE" = "root" ]; then
  echo "[entrypoint] RUN_MODE=root — running as root."
  exec "$@"
fi

# ── appuser (explicit, skip socket inspection) ───────────────────────────────
if [ "$RUN_MODE" = "appuser" ]; then
  echo "[entrypoint] RUN_MODE=appuser — running as appuser."
  exec su-exec appuser "$@"
fi

# ── auto (default) ────────────────────────────────────────────────────────────
# No socket present — run as appuser, let verifyDocker() report the failure.
if [ ! -S "$SOCKET" ]; then
  echo "[entrypoint] Docker socket not found at $SOCKET — running as appuser."
  exec su-exec appuser "$@"
fi

SOCKET_GID=$(stat -c '%g' "$SOCKET")

if [ "$SOCKET_GID" != "0" ]; then
  # Group-owned socket (EC2 / Linux): create a matching group and add appuser.
  if ! getent group "$SOCKET_GID" > /dev/null 2>&1; then
    addgroup -g "$SOCKET_GID" -S docker-host
  fi
  DOCKER_GROUP=$(getent group "$SOCKET_GID" | cut -d: -f1)
  adduser appuser "$DOCKER_GROUP" 2>/dev/null || true
  echo "[entrypoint] Docker socket GID $SOCKET_GID — configured runtime group '$DOCKER_GROUP', running as appuser."
else
  # Root-owned socket (Docker Desktop / WSL2): cannot grant group access.
  echo "[entrypoint] Docker socket is owned by root (GID 0). Running as appuser. If Docker verification fails on Docker Desktop, rerun with RUN_MODE=root."
fi

exec su-exec appuser "$@"
