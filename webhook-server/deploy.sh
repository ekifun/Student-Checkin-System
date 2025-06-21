#!/bin/bash

set -e

echo "🚀 Starting Webhook Server Deployment..."

cd "$(dirname "$0")"

# 1️⃣ Initialize package.json if missing
if [ ! -f "package.json" ]; then
  echo "📦 Creating package.json..."
  npm init -y
  echo "🛠 Updating basic fields..."
  jq '.name="webhook-server" | .version="1.0.0" | .main="server.js"' package.json > tmp.$$.json && mv tmp.$$.json package.json
fi

# 2️⃣ Install express if not already installed
if ! npm list express &>/dev/null; then
  echo "📥 Installing express..."
  npm install express
else
  echo "✅ express already installed."
fi

# 3️⃣ Start the server
echo "🚦 Starting server.js..."
node server.js
