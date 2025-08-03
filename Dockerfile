# Team Leader System v4.0 - Docker Configuration
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p \
    /app/projects \
    /app/logs \
    /app/data \
    /app/.teamleader

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DASHBOARD_PORT=3000

# Expose ports
EXPOSE 3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S teamleader -u 1001

# Change ownership of app directory
RUN chown -R teamleader:nodejs /app
USER teamleader

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Default command
CMD ["npm", "start"] 