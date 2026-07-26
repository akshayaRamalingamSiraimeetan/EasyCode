FROM node:22-alpine

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app/server

# Copy dependency manifests first to leverage Docker layer caching
COPY server/package.json server/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY server/src/ ./src/

# Switch to non-root user
USER appuser

EXPOSE 5000

CMD ["npm", "start"]
