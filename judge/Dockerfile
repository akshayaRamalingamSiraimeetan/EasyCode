FROM node:22-alpine

# Install the Docker CLI so the service can spawn containers at runtime.
# The Docker *daemon* is NOT installed — the host socket is bind-mounted in.
RUN apk add --no-cache docker-cli

# Create a non-root user and add it to a docker group (gid 999 matches the
# typical docker group on EC2/Linux hosts so the socket is accessible).
RUN addgroup -S docker && \
    addgroup -S appgroup && \
    adduser  -S appuser -G appgroup && \
    adduser  appuser docker

WORKDIR /app/judge

# Copy dependency manifests first to leverage Docker layer caching
COPY judge/package.json judge/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy original execution logic (untouched — these are the real implementation files)
COPY judge/judgeService.js   ./judgeService.js
COPY judge/dockerExecutor.js ./dockerExecutor.js
COPY judge/runners/          ./runners/

# Copy Express API layer
COPY judge/src/              ./src/

# Create temp dir for execution workspaces (populated at runtime)
RUN mkdir -p temp

# Switch to non-root user
USER appuser

EXPOSE 7000

CMD ["npm", "start"]
