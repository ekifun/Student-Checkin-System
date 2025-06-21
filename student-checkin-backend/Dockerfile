# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package definition files first for better build caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the app source
COPY . .

# Ensure data directory exists (used by SQLite or export)
RUN mkdir -p /app/data

# Use environment variable for port (optional best practice)
ENV PORT=3001

# Expose port
EXPOSE ${PORT}

# Start server
CMD ["node", "server.js"]
