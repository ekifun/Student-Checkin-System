#!/bin/bash

# Simple deployment automation for student-checkin-backend
# Assumes you're inside ~/Student-Checkin-System/student-checkin-backend directory

echo "👉 Building Docker image..."
docker-compose build

echo "👉 Stopping any running containers..."
docker-compose down

echo "👉 Starting fresh containers..."
docker-compose up -d

echo "✅ Deployment complete!"
docker ps

