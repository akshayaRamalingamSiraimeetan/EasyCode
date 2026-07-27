FROM node:22-alpine

# docker-cli  — lets the service spawn sandboxed containers via the host daemon
# su-exec     — minimal setuid helper to drop from root to appuser after the
#               entrypoint has fixed socket permissions (safer than gosu on Alpine)
RUN apk add --no-cache docker-cli su-exec

# Create appuser/appgroup. No docker group is created here — the entrypoint
# creates a matching group at runtime based on the socket's actual GID.
RUN addgroup -S appgroup && \
    adduser  -S appuser -G appgroup

WORKDIR /app/judge

# ── Dependencies (cached layer) ───────────────────────────────────────────────
COPY judge/package.json judge/package-lock.json ./
RUN npm ci --omit=dev

# ── Application source ────────────────────────────────────────────────────────
COPY judge/judgeService.js   ./judgeService.js
COPY judge/dockerExecutor.js ./dockerExecutor.js
COPY judge/runners/          ./runners/
COPY judge/src/              ./src/

# ── Runtime workspace for code execution sandboxes ───────────────────────────
# Creates the default fallback path used when JUDGE_TEMP_DIR is not set.
# For containerised deployments, JUDGE_TEMP_DIR must point to a host path
# that is bind-mounted into this container at the same absolute path so that
# runner containers spawned by the host daemon can resolve it.
# See .env.example for the required docker run flags.
RUN mkdir -p /tmp/judge-workspace && chown appuser:appgroup /tmp/judge-workspace

# ── Entrypoint ────────────────────────────────────────────────────────────────
# Runs as root so it can inspect the socket GID and create a matching group,
# then drops to appuser before exec-ing the Node process.
COPY judge/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 7000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
