#!/bin/bash

# Deployment automation for student-checkin-backend
# Assumes you're inside ~/Student-Checkin-System/student-checkin-backend directory

set -e

echo "✅ Student CheckIn App Production Deploy Script Starting..."

# 1️⃣ Install docker if not installed
if ! command -v docker &> /dev/null
then
  echo "🔧 Docker not found, installing Docker..."
  sudo yum update -y
  sudo yum install docker -y
  sudo systemctl start docker
  sudo systemctl enable docker
else
  echo "✅ Docker is installed."
fi

# 2️⃣ Install docker-compose if not installed
if ! command -v docker-compose &> /dev/null
then
  echo "🔧 Docker Compose not found, installing Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
else
  echo "✅ Docker Compose is installed."
fi

# 3️⃣ Build image
echo "👉 Building Docker image..."
docker-compose build

# 4️⃣ Stop running containers safely
echo "👉 Stopping any running containers..."
docker-compose down

# 5️⃣ Start fresh containers
echo "👉 Starting fresh containers..."
docker-compose up -d

# 6️⃣ Show docker status
echo "✅ Deployment complete!"
docker ps

echo "🎯 Deployment Finished Successfully!"                                                              1,1           Top
