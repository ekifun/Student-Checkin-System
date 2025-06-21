#!/bin/bash

# Deploy script for webhook server

set -e

echo "🚀 Starting Webhook Server Deployment..."

cd "$(dirname "$0")"  # go to webhook-server directory

# 1️⃣ Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
else
  echo "✅ Dependencies already installed."
fi

# 2️⃣ Start the server (as background service or with PM2)
echo "🟢 Starting server.js..."
nohup node server.js > webhook.log 2>&1 &

echo "✅ Webhook server started and logging to webhook.log"
