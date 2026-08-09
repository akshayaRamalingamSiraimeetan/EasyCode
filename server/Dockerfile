FROM node:22-alpine

# IMPORTANT: This Dockerfile must be built from the repo root with:
#   docker build -f server/Dockerfile -t easycode-server:latest .
#
# If you build from inside server/ the COPY paths below resolve to
# server/server/... which does not exist. Docker silently reuses the
# previous cache layer and the old code runs in ECS.

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app/server

# Copy dependency manifests first to leverage Docker layer caching
# Paths are relative to the repo root (the build context)
COPY server/package.json server/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
# Paths are relative to the repo root (the build context)

COPY server/src/ ./src/
COPY server/scripts/ ./scripts/
COPY seed/ /app/seed/
# Embed a build timestamp as an image label so you can verify which image
# is running in ECS via CloudWatch or `docker inspect`
ARG BUILD_DATE=unknown
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.title="easycode-server"

# Switch to non-root user
USER appuser

EXPOSE 5000

CMD ["npm", "run", "seed"]