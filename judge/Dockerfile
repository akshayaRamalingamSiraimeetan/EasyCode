FROM node:22-alpine

# Install the Docker CLI so the service can spawn containers at runtime.
# The Docker *daemon* is NOT installed — the host socket is bind-mounted in.
RUN apk add --no-cache docker-cli

# Create a non-root user and add it to a docker group (gid 999 matches the
# typical docker group on EC2/Linux hosts so the socket is accessible).
RUN addgroup -g 999 -S docker && \
    addgroup -S appgroup && \
    adduser  -S appuser -G appgroup && \
    adduser  appuser docker

WORKDIR /app/judge

# Copy dependency manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source and the temp directory placeholder
COPY src/   ./src/
RUN mkdir -p temp

# Switch to non-root user
USER appuser

EXPOSE 7000

CMD ["npm", "start"]
