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

# 3️⃣ Validate .env file
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

# 4️⃣ Ensure package.json and package-lock.json exist
echo "📦 Checking package.json and package-lock.json..."

cd "$SCRIPT_DIR"

if [ ! -f "package.json" ] || [ ! -f "package-lock.json" ]; then
  echo "📦 package.json or package-lock.json not found — generating fresh ones..."

  rm -rf node_modules package*.json

  # Generate new package.json
  npm init -y

  # Install all backend dependencies at once
  npm install express body-parser sqlite3 cors dotenv nodemailer exceljs

  echo "✅ package.json and dependencies created."
else
  echo "✅ package.json and package-lock.json found."
fi

# 5️⃣ Auto pull latest code from GitHub
echo "🔄 Pulling latest code from GitHub..."
git reset --hard HEAD
git pull origin main || echo "⚠️ Git pull failed — check remote status."

# 6️⃣ Clean local node_modules before Docker build
echo "🧹 Cleaning up host node_modules (if any)..."
rm -rf node_modules

# 7️⃣ Build Docker image
echo "👉 Building Docker image..."
docker-compose build

# 8️⃣ Stop existing containers
echo "🛑 Stopping any running containers..."
docker-compose down

# 9️⃣ Start fresh containers
echo "🚀 Starting fresh containers..."
docker-compose up -d

# 🔟 DB Schema Migration
echo "🧩 Ensuring database schema is updated (e.g., authorized_pickup_person)..."

DB_PATH="$SCRIPT_DIR/data/student_checkin_system_imported.db"

if [ -f "$DB_PATH" ]; then
  echo "🔍 Checking for authorized_pickup_person column..."

  if ! sqlite3 "$DB_PATH" "PRAGMA table_info(students);" | grep -q authorized_pickup_person; then
    echo "➕ Adding authorized_pickup_person column to students table..."
    sqlite3 "$DB_PATH" "ALTER TABLE students ADD COLUMN authorized_pickup_person TEXT;"
    echo "✅ Column added."
  else
    echo "✅ authorized_pickup_person column already exists."
  fi
else
  echo "⚠️ Database not found at $DB_PATH. Skipping migration."
fi

# 11️⃣ Show container status
echo "✅ Deployment complete!"
docker ps

# 12️⃣ Optional: Health check
echo "🔍 Verifying backend is up..."
sleep 3
if curl -sf http://localhost:3001/students > /dev/null; then
  echo "✅ Backend is running and reachable at http://localhost:3001"
else
  echo "⚠️ Warning: Backend is not responding on http://localhost:3001"
fi

echo "🎯 Deployment Finished Successfully!"
