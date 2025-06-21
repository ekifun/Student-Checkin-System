#!/bin/bash

# Deployment automation for student-checkin-backend
# Run inside ~/Student-Checkin-System/student-checkin-backend

set -e

echo "✅ Student CheckIn App Production Deploy Script Starting..."

# 1️⃣ Install Docker if not installed
if ! command -v docker &> /dev/null; then
  echo "🔧 Docker not found, installing Docker..."
  sudo yum update -y
  sudo yum install docker -y
  sudo systemctl start docker
  sudo systemctl enable docker
else
  echo "✅ Docker is installed."
fi

# 2️⃣ Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
  echo "🔧 Docker Compose not found, installing Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
else
  echo "✅ Docker Compose is installed."
fi

# 2.5️⃣ Validate .env file
echo "🔍 Checking .env file before build..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "❌ .env file not found in $SCRIPT_DIR"
  exit 1
fi

REQUIRED_VARS=(
  EMAIL_USER
  EMAIL_PASSWORD
)

set -a
source "$SCRIPT_DIR/.env"
set +a

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required env variable: $var"
    exit 1
  fi
done

echo "✅ All required .env variables are present."

# 2.6️⃣ Ensure package.json and package-lock.json exist
echo "📦 Checking package.json and package-lock.json..."

if [ ! -f "$SCRIPT_DIR/package.json" ] || [ ! -f "$SCRIPT_DIR/package-lock.json" ]; then
  echo "📦 package.json or package-lock.json not found — generating fresh ones..."

  cd "$SCRIPT_DIR"

  # Clean old node_modules if any
  rm -rf node_modules package*.json

  # Generate new package.json
  npm init -y

  # Install backend dependencies
  npm install express body-parser sqlite3 cors dotenv nodemailer

  echo "✅ package.json and dependencies created."
else
  echo "✅ package.json and package-lock.json found."
fi

echo "🧹 Cleaning up host node_modules (if any)..."
rm -rf node_modules

# 3️⃣ Build Docker image
echo "👉 Building Docker image..."
docker-compose build

# 4️⃣ Stop running containers
echo "👉 Stopping any running containers..."
docker-compose down

# 5️⃣ Start fresh containers
echo "👉 Starting fresh containers..."
docker-compose up -d

# 6️⃣ Show Docker status
echo "✅ Deployment complete!"
docker ps

echo "🎯 Deployment Finished Successfully!"
