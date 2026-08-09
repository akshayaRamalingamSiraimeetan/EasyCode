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
# /app/judge/temp is the fallback path used by runners when JUDGE_TEMP_DIR
# is not set (TEMP_DIR = path.join(__dirname, "..", "temp")).
# Create it here and hand ownership to appuser so the process can write
# workspace subdirectories without needing JUDGE_TEMP_DIR at all.
# In production you should still mount a host path via JUDGE_TEMP_DIR so
# runner containers spawned by the host daemon can resolve the same files.
#RUN mkdir -p /app/judge/temp && chown appuser:appgroup /app/judge/temp

RUN mkdir -p /tmp/judge-workspace \
    && mkdir -p /app/judge/temp \
    && chown -R appuser:appgroup /tmp/judge-workspace /app/judge/temp
# ── Entrypoint ────────────────────────────────────────────────────────────────
# Runs as root so it can inspect the socket GID and create a matching group,
# then drops to appuser before exec-ing the Node process.
COPY judge/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 7000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
