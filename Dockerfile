# Use Railway's optimized Node.js image
FROM node:18-alpine

# Install basic system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Chromium path for Playwright
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Clean up dev dependencies to reduce image size
RUN npm prune --omit=dev

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]