FROM node:22-alpine

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app/ai

# Copy dependency manifests first to leverage Docker layer caching
COPY ai/package.json ai/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY ai/src/ ./src/

# Switch to non-root user
USER appuser

EXPOSE 6001

CMD ["npm", "start"]
